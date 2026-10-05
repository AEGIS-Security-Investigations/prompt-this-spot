/**
 * Installs the packed tarball into a brand-new Next.js app, the way an app
 * gets it from npm, and builds it: proves the published files, exports, peer
 * dependencies, TypeScript source and stylesheet work for a real consumer.
 *
 *   NEXT_VERSION=16.3.3 REACT_VERSION=19.2.5 TYPESCRIPT_VERSION=6.0.3 \
 *   LUCIDE_VERSION=1.11.0 bun scripts/consumer-smoke.ts
 *
 * Checks: `next build` succeeds (both entry points), `tsc --noEmit` passes
 * under strict flags, the prebuilt stylesheet reaches the CSS output, and the
 * server-rendered page runs package code.
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const env = (name: string, fallback: string) => process.env[name] || fallback;
const versions = {
  next: env("NEXT_VERSION", "16.3.3"),
  react: env("REACT_VERSION", "19.2.5"),
  typescript: env("TYPESCRIPT_VERSION", "6.0.3"),
  lucide: env("LUCIDE_VERSION", "1.11.0"),
};

const run = (cmd: string[], cwd: string, extraEnv: Record<string, string> = {}) => {
  console.log(`$ ${cmd.join(" ")}`);
  const result = Bun.spawnSync(cmd, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...extraEnv },
  });
  const output = `${result.stdout.toString()}${result.stderr.toString()}`;
  if (result.exitCode !== 0) {
    console.error(output);
    throw new Error(`${cmd.join(" ")} exited ${result.exitCode}`);
  }
  return output;
};

const write = (path: string, text: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
  );

const root = join(import.meta.dir, "..");
const work = mkdtempSync(join(tmpdir(), "pts-consumer-"));

try {
  const [packed] = JSON.parse(
    run(["npm", "pack", "--json", "--pack-destination", work], root)
  ) as { filename: string }[];
  if (!packed) {
    throw new Error("npm pack produced no tarball");
  }
  const app = join(work, "app");

  write(
    join(app, "package.json"),
    JSON.stringify(
      {
        name: "consumer-smoke",
        private: true,
        dependencies: {
          next: versions.next,
          react: versions.react,
          "react-dom": versions.react,
          "lucide-react": versions.lucide,
          "@uiw/react-codemirror": "^4.25.11",
          "@codemirror/view": "^6.43.12",
          "@brotskyllc/prompt-this-spot": process.env.PACKAGE_SPEC || `file:${join(work, packed.filename)}`,
        },
        devDependencies: {
          typescript: versions.typescript,
          "@types/react": "^19.2.0",
          "@types/react-dom": "^19.2.0",
          "@types/node": "^22.0.0",
        },
      },
      null,
      2
    )
  );
  write(
    join(app, "next.config.mjs"),
    `export default { transpilePackages: ["@brotskyllc/prompt-this-spot"] };\n`
  );
  write(
    join(app, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        strict: true,
        noUncheckedIndexedAccess: true,
        noEmit: true,
        module: "esnext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        esModuleInterop: true,
        skipLibCheck: true,
        isolatedModules: true,
        resolveJsonModule: true,
        plugins: [{ name: "next" }],
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"],
    })
  );
  write(
    join(app, "app/layout.tsx"),
    `import "@brotskyllc/prompt-this-spot/styles.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
  );
  write(
    join(app, "app/tools.tsx"),
    `"use client";
import {
  FloatingLauncherStackProvider,
  InspectPromptPreferencesProvider,
  InspectPromptToolGate,
  type PromptThisSpotConfig,
  PromptThisSpotProvider,
  sanitizePageUrl,
  UserFeedbackToolGate,
} from "@brotskyllc/prompt-this-spot";

const config: PromptThisSpotConfig = {
  repoSlug: "example/app",
  submitFeedback: async (submission) => {
    console.log(submission.promptText.length);
  },
};

export const Tools = () => (
  <PromptThisSpotProvider config={config}>
    <FloatingLauncherStackProvider>
      <InspectPromptPreferencesProvider>
        <p data-testid="sanitized">
          {sanitizePageUrl("https://app.example.com/x?token=abc")}
        </p>
        <InspectPromptToolGate eligible />
        <UserFeedbackToolGate eligible />
      </InspectPromptPreferencesProvider>
    </FloatingLauncherStackProvider>
  </PromptThisSpotProvider>
);
`
  );
  write(
    join(app, "app/page.tsx"),
    `import { Tools } from "./tools";

export default function Page() {
  return <Tools />;
}
`
  );
  write(
    join(app, "app/inspect-only/page.tsx"),
    `"use client";
import {
  InspectPromptToolGate,
  PromptThisSpotProvider,
} from "@brotskyllc/prompt-this-spot/inspect-prompt";

export default function Page() {
  return (
    <PromptThisSpotProvider config={{}}>
      <InspectPromptToolGate eligible />
    </PromptThisSpotProvider>
  );
}
`
  );

  run(["npm", "install", "--no-audit", "--no-fund"], app);
  const installed = Object.fromEntries(
    ["next", "react", "typescript", "@brotskyllc/prompt-this-spot"].map((name) => [
      name,
      JSON.parse(readFileSync(join(app, "node_modules", name, "package.json"), "utf8")).version,
    ])
  );
  console.log("installed:", installed);

  run(["npx", "next", "build"], app);
  run(["npx", "tsc", "--noEmit"], app);

  const css = walk(join(app, ".next/static"))
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  if (!css.includes("pointer-events-auto")) {
    throw new Error("The package stylesheet is missing from the built CSS.");
  }
  const html = readFileSync(join(app, ".next/server/app/index.html"), "utf8");
  if (!html.includes("https://app.example.com/x?token=REDACTED")) {
    throw new Error("Server-rendered package code did not run as expected.");
  }
  console.log("Consumer smoke test passed.");
} finally {
  if (!process.env.KEEP_CONSUMER) {
    rmSync(work, { recursive: true, force: true });
  }
}
