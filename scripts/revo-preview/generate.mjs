import { chromium } from "@playwright/test";
import { createServer } from "vite";
import sharp from "sharp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = value => fileURLToPath(new URL(value, import.meta.url));
const server = await createServer({
  root: path("../../"),
  configFile: false,
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": path("../../src") } },
  server: { host: "127.0.0.1", port: 4193, strictPort: true },
});
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
let browser;
try {
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.REVO_PREVIEW_CHROME || (existsSync(chrome) ? chrome : undefined),
    args: ["--use-angle=swiftshader", "--enable-webgl", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1120, height: 850 } });
  page.on("pageerror", error => console.error(error));
  for (const era of [1, 2]) {
    await page.goto(`http://127.0.0.1:4193/scripts/revo-preview/index.html?era=${era}`);
    await page.locator('body[data-ready="true"]').waitFor();
    const encoded = await page.locator("canvas").evaluate(canvas => canvas.toDataURL().split(",")[1]);
    const source = Buffer.from(encoded, "base64");
    const trimmed = await sharp(source).trim({ background: "#00000000", threshold: 6 }).png().toBuffer({ resolveWithObject: true });
    const left = -(trimmed.info.trimOffsetLeft ?? 0);
    const top = -(trimmed.info.trimOffsetTop ?? 0);
    if (left < 8 || top < 8 || left + trimmed.info.width > 1112 || top + trimmed.info.height > 842) {
      throw new Error(`Model ${era} reaches the capture edge; reduce shared camera zoom.`);
    }
    const file = path(`../../public/revo/industry-${era}-preview.webp`);
    // Equal projected scale, canvas and baseline. Transparent margins keep the platform intact.
    const { width, height } = trimmed.info;
    const artWidth = 1024;
    const artHeight = 806;
    const marginBottom = 40;
    const padding = { left: Math.floor((artWidth - width) / 2), top: artHeight - marginBottom - height };
    const framed = await sharp(trimmed.data).extend({
      ...padding, right: artWidth - width - padding.left, bottom: marginBottom, background: "#00000000",
    }).png().toBuffer();
    const image = await sharp(framed).resize({ width: 896 }).webp({ quality: 83, alphaQuality: 94 }).toFile(file);
    console.log(`${file}: ${image.width}×${image.height}, ${image.size} bytes`);
  }
} finally {
  await browser?.close();
  await server.close();
}
