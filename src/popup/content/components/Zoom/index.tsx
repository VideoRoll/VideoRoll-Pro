/*
 * @description: zoom Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject } from "vue";
import type { IRollConfig } from "../../../../types/type.d";
import browser from "webextension-polyfill";
import "./index.less";
import { ReloadOutline } from "@vicons/ionicons5";
import debounce from "lodash-es/debounce";

export default defineComponent({
    name: "Zoom",
    setup() {
        const update = inject("update") as Function;
        const rollConfig = inject("rollConfig") as IRollConfig;

        const setZoomNum = debounce((value: number) => {
            rollConfig.zoom = value;
            update("zoom", value);
        }, 100);

        return () => (
            <>
                <div class="video-roll-long-box">
                    <div v-tooltip={browser.i18n.getMessage('action_reset')} class={`video-roll-switch ${rollConfig.zoom !== 1 ? 'video-roll-switch-on':'video-roll-switch-off'}`} onClick={() => setZoomNum(1)}>
                        <ReloadOutline class="reset-icon"></ReloadOutline>
                    </div>
                    <div class="video-roll-zoom">
                        <van-slider
                            v-model={rollConfig.zoom}
                            min={0}
                            max={3}
                            step={0.01}
                            bar-height="4px"
                            onUpdate:modelValue={setZoomNum}
                            v-slots={{
                                button: () => (
                                    <div class="custom-button">{rollConfig.zoom}</div>
                                ),
                            }}
                        ></van-slider>
                    </div>
                </div>
            </>
        );
    },
});
