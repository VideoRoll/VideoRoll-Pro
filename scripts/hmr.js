import { watch } from "node:fs";
import { exec } from "node:child_process"

// 要监听的文件夹路径
const directoryPath = "src/manifest";

const watcher = watch(directoryPath, (eventType, filename) => {
    console.log("开始监听");
    if (filename) {
        if (eventType === "change") {
            exec(`cross-env BROWSER="${process.env.BROWSER}" node scripts/generateManifest.js`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`执行错误: ${error}`);
                    return;
                }
                console.log(`输出: ${stdout}`);
            });
        }
    } else {
        console.log("目录中发生了一些变化，但未提供文件名");
    }
});

watcher.on("error", (error) => {
    console.error("监听发生错误:", error);
    // 当发生错误时，可以尝试重新启动监听
    // setTimeout(() => watchDirectory(directoryPath), 1000); // 1秒后重新监听
});
