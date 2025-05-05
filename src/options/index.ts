import { createApp } from "../share.ts";

import './index.less';

import App from "./app";

import ConfigProvider from "vant/es/config-provider/index.mjs";
import RadioGroup from "vant/es/radio-group/index.mjs";
import Radio from "vant/es/radio/index.mjs";
import Switch from "vant/es/switch/index.mjs";
import Divider from "vant/es/divider/index.mjs";
import Button from "vant/es/button/index.mjs";
import Form from "vant/es/form/index.mjs";
import Field from "vant/es/field/index.mjs";
import CellGroup from "vant/es/cell-group/index.mjs";
import Loading from "vant/es/loading/index.mjs";
import Cell from "vant/es/cell/index.mjs";
import Icon from "vant/es/icon/index.mjs";
import Dialog from "vant/es/dialog/index.mjs";
import Overlay from "vant/es/overlay/index.mjs";

createApp(App)
    .use(ConfigProvider)
    .use(RadioGroup)
    .use(Radio)
    .use(Divider)
    .use(Switch)
    .use(Button)
    .use(Form)
    .use(Field)
    .use(CellGroup)
    .use(Loading)
    .use(Cell)
    .use(Icon)
    .use(Dialog)
    .use(Overlay)
    .mount("#options-root");