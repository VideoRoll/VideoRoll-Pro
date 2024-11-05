import chalk from "chalk";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { dirname } from "dirname-filename-esm";
import { nextTick } from "node:process";

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

    nextTick(async () => {
        await copyFile(baseManifestPath, distManifestPath);

        if (!browserType && !process.env.BROWSER) {
            logger(
                chalk.greenBright(
                    "VideoRoll: generate manifest.json from the base"
                )
            );
            return;
        }

        const currentManifestPath = path.join(
            __dirname,
            `../src/manifest/manifest.${
                process.env.BROWSER ?? browserType
            }.json`
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

            await writeFile(
                distManifestPath,
                JSON.stringify(newManifest, null, "\t")
            );

            logger(
                chalk.greenBright("VideoRoll: generate manifest.json success")
            );
        } catch (err) {
            logger(chalk.red(`VideoRoll: generate manifest.json faild ${err}`));
        }
    });
}

if (process.env.BROWSER) {
    await generateManifest();
}
