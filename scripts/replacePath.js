import chalk from "chalk";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { dirname } from "dirname-filename-esm";

const logger = console.log;

const __dirname = dirname(import.meta);

export default async function replacePopupPath() {
  const distDir = path.join(__dirname, "../dist");
  try {
    const files = await readdir(distDir, { withFileTypes: true });
    const htmlFiles = files
      .filter((f) => f.isDirectory())
      .map((dir) => path.join(distDir, dir.name))
      .concat(distDir) // 也处理 dist 根目录
      .flatMap(async (dir) => {
        const subFiles = await readdir(dir, { withFileTypes: true });
        return subFiles
          .filter((f) => f.isFile() && f.name.endsWith(".html"))
          .map((f) => path.join(dir, f.name));
      });

    // 等待所有目录下的 html 文件路径
    const htmlFilePaths = (await Promise.all(htmlFiles)).flat();

    for (const filePath of htmlFilePaths) {
      let content = await readFile(filePath, { encoding: "utf8" });

      // 替换 <link ... href="/xxx.css"> 和 <script ... src="/xxx.js">
      content = content.replace(/(href|src)\s*=\s*([\"'])?\/([^\"'\s>]+)\2?/g, '$1=$2$3$2');
      await writeFile(filePath, content);
      logger(chalk.greenBright(`VideoRoll: replaced path in ${filePath}`));
    }
  } catch (err) {
    logger(chalk.red(`VideoRoll: replace html path failed ${err}`));
  }
}
