/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2025-06-05 11:06:43
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-17 19:46:40
 * @Description: 使用普通进程启动浏览器并自动热重载扩展（无自动化控制横幅）
 */
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";
import { dirname } from "dirname-filename-esm";
import chokidar from "chokidar";
import { WebSocketServer } from "ws";
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

// 全局变量存储临时数据路径和浏览器进程
let userDataDir = "";
let extPath = "";
let chromeProcess = null;

// 清理函数
async function cleanup() {
  console.log("\n正在清理临时数据...");
  
  // 关闭 WebSocket 服务器
  if (wss) {
    wss.close();
    console.log("WebSocket 服务器已关闭");
  }
  
  // 关闭浏览器进程
  if (chromeProcess && !chromeProcess.killed) {
    chromeProcess.kill('SIGTERM');
    console.log("浏览器进程已关闭");
  }
  
  // 清除临时扩展目录
  if (extPath && fsSync.existsSync(extPath)) {
    try {
      await fs.rm(extPath, { recursive: true, force: true });
      console.log(`临时扩展目录已清除: ${extPath}`);
    } catch (error) {
      console.warn(`清除临时扩展目录失败: ${error.message}`);
    }
  }
  
  console.log("清理完成，程序退出");
  process.exit(0);
}

// 监听 Ctrl+C 信号
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
  console.error('程序发生未捕获异常:', error);
  cleanup();
});
process.on('unhandledRejection', (reason) => {
  console.error('程序发生未处理的 Promise 拒绝:', reason);
  cleanup();
});

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
  }  extPath = await createReloadManagerExtension('23333');

  // 创建临时用户数据目录（固定名称，可覆盖）
  userDataDir = path.join(tmpdir(), 'chrome-dev-profile');
  await fs.mkdir(userDataDir, { recursive: true });
  console.log(`使用临时用户数据目录: ${userDataDir}`);

  // 使用 child_process 直接启动 Chrome（没有自动化控制标记）
  console.log("正在启动 Chrome...");
  
  // 构建启动命令行参数，添加用户数据目录参数
  const chromeArgs = [
    `--user-data-dir=${userDataDir}`, // 使用临时用户数据目录
    `--no-first-run`, // 跳过首次运行设置
    `--no-default-browser-check`, // 不检查默认浏览器设置
    `--disable-extensions-except=${EXT_PATH},${extPath}`,
    `--load-extension=${EXT_PATH},${extPath}`,
    "chrome://extensions/" // 自动打开扩展页面
  ];
  
  // 直接启动 Chrome 进程
  chromeProcess = spawn(browserBinary, chromeArgs, {
    detached: true, // 让 Chrome 在后台运行，不受 Node 进程影响
    stdio: 'ignore'
  });
  
  // 允许父进程退出，而不影响 Chrome
  chromeProcess.unref();
    console.log("Chrome 启动成功，监听扩展热重载...");
  console.log("扩展页面已自动打开，请确保开启开发者模式。");
  console.log("按 Ctrl+C 可清理临时数据并退出程序。");

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
  // 创建临时目录（固定名称，可覆盖）
  const extPath = path.join(tmpdir(), 'reload-manager-extension');
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