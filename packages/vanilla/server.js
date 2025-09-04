import express from "express";
import fs from "node:fs/promises";

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

const templateHtml = isProduction ? await fs.readFile("./dist/client/index.html", "utf-8") : "";
import { mswServer } from "./src/mocks/node.js";

const app = express();

mswServer.listen({
  onUnhandledRequest: "bypass",
});

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!isProduction) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

//모든 url을 핸들링하고 라우팅 작업을 진행함

app.use("/src", express.static(`${base}src`));

app.get("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/entry-server.js').render} */
    let render;
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/server/main-server.js")).render;
    }

    const rendered = await render(url, req.query);

    if (!rendered) {
      return;
    }

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(`<!--ssr-data-->`, `<script>window.__INITIAL_MODEL__ = ${JSON.stringify(rendered.serverData)}</script>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Vanilla Server started at http://localhost:${port}`);
});
