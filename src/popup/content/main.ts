/*
 * @description: popup entry
 * @Author: Gouxinyu
 * @Date: 2022-01-13 19:43:08
 */

/// <reference path="../types/shims-vue.d.ts" />
import { createApp } from "../../share.ts";

// import { Row } from 'vant';
import FloatingVue from 'floating-vue'

import App from "./App";

import ConfigProvider from "vant/es/config-provider/index.mjs";
import Sidebar from "vant/es/sidebar/index.mjs";
import SidebarItem from "vant/es/sidebar-item/index.mjs";
import RadioGroup from "vant/es/radio-group/index.mjs";
import Radio from "vant/es/radio/index.mjs";
import Switch from "vant/es/switch/index.mjs";
import Slider from "vant/es/slider/index.mjs";
import Divider from "vant/es/divider/index.mjs";
import Button from "vant/es/button/index.mjs";
import Stepper from "vant/es/stepper/index.mjs";
import Badge from "vant/es/badge/index.mjs";
import Col from "vant/es/col/index.mjs";
import Swipe from "vant/es/swipe/index.mjs";
import SwipeItem from "vant/es/swipe-item/index.mjs";
import Popup from "vant/es/popup/index.mjs";
import Toast from "vant/es/toast/index.mjs";
import Popover from "vant/es/popover/index.mjs";
import Notify from "vant/es/notify/index.mjs";
import Tab from "vant/es/tab/index.mjs";
import Tabs from "vant/es/tabs/index.mjs";
import Space from "vant/es/space/index.mjs";
import Checkbox from "vant/es/checkbox/index.mjs";
import CheckboxGroup from "vant/es/checkbox-group/index.mjs";
import CellGroup from "vant/es/cell-group/index.mjs";
import Cell from "vant/es/cell/index.mjs";
import Tag from "vant/es/tag/index.mjs";
import NoticeBar from "vant/es/notice-bar/index.mjs";
import Form from "vant/es/form/index.mjs";
import Field from "vant/es/field/index.mjs";
import Empty  from "vant/es/empty/index.mjs";
import Loading  from "vant/es/loading/index.mjs";
import Progress from 'vant/es/progress/index.mjs'
import Circle from 'vant/es/circle/index.mjs'
import Image from 'vant/es/image/index.mjs'
import Row from 'vant/es/row/index.mjs'

createApp(App)
    .use(ConfigProvider)
    .use(RadioGroup)
    .use(Radio)
    .use(Sidebar)
    .use(SidebarItem)
    .use(Divider)
    .use(Slider)
    .use(Switch)
    .use(Button)
    .use(Stepper)
    .use(Badge)
    .use(Col)
    .use(Row)
    .use(Swipe)
    .use(SwipeItem)
    .use(Popup)
    .use(Toast)
    .use(Popover)
    .use(Notify)
    .use(Tab)
    .use(Tabs)
    .use(Space)
    .use(Checkbox)
    .use(CheckboxGroup)
    .use(CellGroup)
    .use(Cell)
    .use(Tag)
    .use(NoticeBar)
    .use(Form)
    .use(Field)
    .use(Empty)
    .use(Loading)
    .use(Progress)
    .use(Circle)
    .use(Image)
    .use(FloatingVue)
    .mount("#app");
