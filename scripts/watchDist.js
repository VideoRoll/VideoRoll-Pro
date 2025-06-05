/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2025-06-05 11:06:43
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-05 18:10:09
 * @Description: 自动启动浏览器并仅热重载本扩展（puppeteer-core 版本）
 */
import fs from "node:fs/promises";
import fsSync from "node:fs"; // 新增
import path from "node:path";
import { execSync } from "node:child_process";
import { dirname } from "dirname-filename-esm";
import chokidar from "chokidar";
import { WebSocketServer } from "ws";
import puppeteer from "puppeteer-core";
import { tmpdir } from "node:os";

const __dirname = dirname(import.meta);
const browser = process.env.BROWSER || "chromium";
const envPath = path.resolve(__dirname, "../.env");
let browserBinary = "";
if (fsSync.existsSync(envPath)) {
  const envContent = fsSync.readFileSync(envPath, "utf-8");
  let match;
  if (browser === "chromium") {
    match = envContent.match(/^BROWSER_CHROME\s*=\s*(.+)$/m);
  } else if (browser === "firefox") {
    match = envContent.match(/^BROWSER_FIREFOX\s*=\s*(.+)$/m);
  }
  if (match) {
    browserBinary = match[1].trim().replace(/^['"]|['"]$/g, "");
  }
}
const EXT_PATH = path.resolve(__dirname, "../dist");

// 启动 WebSocket 服务
const wss = new WebSocketServer({ port: 23333 });
wss.on("connection", (ws) => {
  console.log("扩展已连接 WebSocket");
});

(async () => {
  if (browser === "firefox") {
    const command = `web-ext run --source-dir=dist --target firefox-desktop --firefox="${browserBinary}"`;
    console.log("Running:", command);
    execSync(command, { stdio: "inherit", shell: true });
    return;
  } else if (browser !== "chromium") {
    console.error(`Unsupported browser: ${browser}`);
    process.exit(1);
  }


  const extPath = await createReloadManagerExtension('23333');

  // 启动 puppeteer 并加载扩展
  const browserInstance = await puppeteer.launch({
    headless: false,
    executablePath: browserBinary,
    args: [
      `--disable-extensions-except=${EXT_PATH},${extPath}`,
      `--load-extension=${EXT_PATH},${extPath}`,
    ],
  });

  // 新建标签页并跳转到扩展页面
  const page = await browserInstance.newPage();
  await page.goto("chrome://extensions/");

  console.log("Chrome 启动成功，监听扩展热重载...");

  let reloadTimer = null;
  const RELOAD_DEBOUNCE = 1000; // 1s 内只 reload 一次

  // 监听 dist 目录变动，通知扩展 reload
  chokidar.watch(EXT_PATH, { ignoreInitial: true }).on("all", async () => {
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      console.log("扩展代码变动，通知插件自动刷新...");
      wss.clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          ws.send("reload-extension");
        }
      });
    }, RELOAD_DEBOUNCE);
  });
})();

export async function createReloadManagerExtension(wsPort) {
  // 创建临时目录
  const extPath = path.join(tmpdir(), `reload-manager-extension-${Date.now()}`);
  await fs.mkdir(extPath, { recursive: true });

  // MV3 manifest
  await fs.writeFile(
    path.join(extPath, "manifest.json"),
    JSON.stringify(
      {
        manifest_version: 3,
        name: "Reload Manager Extension",
        version: "1.0",
        permissions: ["management", "tabs"],
        background: {
          service_worker: "bg.js",
        },
      },
      null,
      2
    )
  );

  // MV3 service worker
  const bgJs = `
const ws = new WebSocket("ws://localhost:${wsPort}");
ws.onmessage = async (evt) => {
  if (evt.data === "reload-extension") {
    const all = await chrome.management.getAll();
    for (const ext of all) {
      if (
        ext.enabled &&
        ext.installType === "development" &&
        ext.id !== chrome.runtime.id
      ) {
        // 禁用再启用
        await chrome.management.setEnabled(ext.id, false);
        await chrome.management.setEnabled(ext.id, true);
      }
    }
  }
};
  `.trim();

  await fs.writeFile(path.join(extPath, "bg.js"), bgJs);

  return extPath;
}
