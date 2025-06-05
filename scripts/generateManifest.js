/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2024-09-23 17:01:48
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-05 18:02:28
 * @FilePath: \website-nextc:\programs\VideoRoll-Pro\scripts\generateManifest.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import chalk from "chalk";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { dirname } from "dirname-filename-esm";

const logger = console.log;

const __dirname = dirname(import.meta);

export default async function generateManifest(browserType) {
    const baseManifestPath = path.join(
        __dirname,
        `../src/manifest/manifest.json`
    );
    const distManifestPath = path.join(__dirname, "../dist/manifest.json");

    try {
        await mkdir("dist");
    } catch (e) {}

    await copyFile(baseManifestPath, distManifestPath);

    if (!browserType && !process.env.BROWSER) {
        logger(
            chalk.greenBright("VideoRoll: generate manifest.json from the base")
        );
        return;
    }

    const currentManifestPath = path.join(
        __dirname,
        `../src/manifest/manifest.${process.env.BROWSER ?? browserType}.json`
    );

    try {
        const currentManifest = await readFile(currentManifestPath, {
            encoding: "utf8",
        });
        const baseManifest = await readFile(baseManifestPath, {
            encoding: "utf8",
        });

        const newManifest = Object.assign(
            JSON.parse(baseManifest),
            JSON.parse(currentManifest)
        );

        // 判断是否为 development 环境，添加 management 权限
        // console.log('---', process.env);
        // if (process.env.ENV === "development") {
        //     newManifest.permissions = newManifest.permissions || [];
        //     if (!newManifest.permissions.includes("management")) {
        //         newManifest.permissions.push("management");
        //     }
        // }

        await writeFile(
            distManifestPath,
            JSON.stringify(newManifest, null, "\t")
        );

        logger(chalk.greenBright("VideoRoll: generate manifest.json success"));
    } catch (err) {
        logger(chalk.red(`VideoRoll: generate manifest.json faild ${err}`));
    }
}

if (process.env.BROWSER) {
    await generateManifest();
}
