/**
 * Audits exactly what `npm publish` would upload: packs the real tarball,
 * checks every file against an allowlist, and scans the packed contents for
 * secrets and private material. Run before any publish and in CI.
 *
 *   bun scripts/check-package.ts
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

/** The only paths a published tarball may contain. */
const ALLOWED = [
  /^package\.json$/,
  /^README\.md$/,
  /^LICENSE$/,
  /^CHANGELOG\.md$/,
  /^styles\/prompt-this-spot\.css$/,
  /^src\/.+\.tsx?$/,
];

/** Never ship tests, even if one lands under src/. */
const FORBIDDEN_PATHS = [/\.test\.tsx?$/, /(^|\/)\.env/, /(^|\/)\.npmrc$/];

/** Content that must never appear in a published file. */
const SECRET_PATTERNS: [string, RegExp][] = [
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}/],
  ["npm token", /\bnpm_[A-Za-z0-9]{30,}/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["Stripe live key", /\b(sk|rk)_live_[A-Za-z0-9]{10,}/],
  ["API secret key", /\bsk-[A-Za-z0-9_-]{20,}/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["JSON Web Token", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["email address", /\b[A-Za-z0-9._%+-]+@(?!example\.(com|org|net|test)\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
];

/** Hosts a published file may name; anything else is flagged for review. */
const ALLOWED_HOSTS = new Set([
  "github.com",
  "claude.ai",
  "tailwindcss.com",
  "semver.org",
  "registry.npmjs.org",
  "app.example.com",
]);

const run = (cmd: string[], cwd: string) => {
  const result = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    throw new Error(`${cmd.join(" ")} failed:\n${result.stderr.toString()}`);
  }
  return result.stdout.toString();
};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const root = join(import.meta.dir, "..");
const work = mkdtempSync(join(tmpdir(), "pts-pack-"));
const problems: string[] = [];

try {
  const [packed] = JSON.parse(
    run(["npm", "pack", "--json", "--pack-destination", work], root)
  ) as { filename: string; entryCount: number; size: number }[];
  if (!packed) {
    throw new Error("npm pack produced no tarball");
  }
  run(["tar", "-xzf", join(work, packed.filename), "-C", work], root);
  const pkgDir = join(work, "package");
  const files = walk(pkgDir).map((path) => relative(pkgDir, path)).sort();

  for (const file of files) {
    if (!ALLOWED.some((pattern) => pattern.test(file))) {
      problems.push(`not on the allowlist: ${file}`);
    }
    if (FORBIDDEN_PATHS.some((pattern) => pattern.test(file))) {
      problems.push(`forbidden file: ${file}`);
    }
    const text = readFileSync(join(pkgDir, file), "utf8");
    for (const [label, pattern] of SECRET_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        problems.push(`${label} in ${file}: ${match[0].slice(0, 12)}…`);
      }
    }
    for (const [, host] of text.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)) {
      if (host && !ALLOWED_HOSTS.has(host)) {
        problems.push(`unreviewed host in ${file}: ${host}`);
      }
    }
  }

  const manifest = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  for (const target of Object.values(manifest.exports ?? {}) as string[]) {
    if (!files.includes(target.replace(/^\.\//, ""))) {
      problems.push(`export target missing from the tarball: ${target}`);
    }
  }

  console.log(
    `${manifest.name}@${manifest.version}: ${packed.entryCount} files, ${packed.size} bytes packed`
  );
  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log("Package contents OK: allowlisted files only, no secrets found.");
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
