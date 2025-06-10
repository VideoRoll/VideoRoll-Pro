/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2025-06-09 22:58:39
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-10 21:00:23
 * @FilePath: \website-nextc:\programs\VideoRoll-Pro\src\sidepanel\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createVideoRollApp } from "../lib/share";
import App from "./App";
import "./index.less";

createVideoRollApp(App, "#app");
