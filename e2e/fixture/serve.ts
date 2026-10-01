/**
 * Builds the fixture app with Bun and serves it for Playwright. Every unknown
 * path returns the page, like a single-page app's host, so the specs can load
 * any route directly.
 */
import { join } from "node:path";

const root = join(import.meta.dir, "../..");
const port = Number(process.env.FIXTURE_PORT ?? 4178);

const build = await Bun.build({
  entrypoints: [join(import.meta.dir, "app.tsx")],
  target: "browser",
  splitting: true,
  publicPath: "/assets/",
  naming: { entry: "[name].[ext]", chunk: "[name]-[hash].[ext]" },
  define: { "process.env.NODE_ENV": JSON.stringify("development") },
});
if (!build.success) {
  console.error(build.logs);
  process.exit(1);
}

const assets = new Map(
  build.outputs.map((output) => [
    `/assets/${output.path.split("/").pop()}`,
    output,
  ])
);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>prompt-this-spot fixture</title>
    <link rel="stylesheet" href="/prompt-this-spot.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>`;

Bun.serve({
  port,
  fetch(request) {
    const { pathname } = new URL(request.url);
    const asset = assets.get(pathname);
    if (asset) {
      return new Response(asset, {
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    }
    if (pathname === "/prompt-this-spot.css") {
      return new Response(
        Bun.file(join(root, "styles/prompt-this-spot.css")),
        { headers: { "content-type": "text/css; charset=utf-8" } }
      );
    }
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`fixture on http://localhost:${port}`);
