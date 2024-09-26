/*
 * @description: popup entry
 * @Author: Gouxinyu
 * @Date: 2022-01-13 19:43:08
 */

/// <reference path="../types/shims-vue.d.ts" />
import { createApp } from "vue";
import '@vant/touch-emulator';
import 'vant/lib/index.css'

import App from "./App";

import ConfigProvider from "vant/es/config-provider/index.mjs";
import Progress from 'vant/es/progress/index.mjs'
import Button from "vant/es/button/index.mjs";


import "vant/es/button/style/index.mjs";
import "vant/es/progress/style/index.mjs";

createApp(App)
    .use(ConfigProvider)
    .use(Progress)
    .use(Button)
    .mount("#app");
