/*
 * @description: download page
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject, ref, watch } from "vue";
import browser from "webextension-polyfill";
import "./index.less";
import { IRollConfig } from "src/types/type";
import { showConfirmDialog } from "vant";

export default defineComponent({
    name: "DownloadPage",
    setup() {
        const percentage = ref(0);

        return () => (
            <div class="video-roll-download-page">
                <van-progress percentage={percentage.value}
                    pivot-color="#7232dd"
                    color="linear-gradient(to right, #be99ff, #7232dd)"></van-progress>
            </div>
        );
    },
});
