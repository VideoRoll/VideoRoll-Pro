/*
 * @description: pitch Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject } from "vue";
import type { IRollConfig } from "../../../../types/type";
import { ReloadOutline} from '@vicons/ionicons5'
import browser from "webextension-polyfill";
import "./index.less";
import debounce from "lodash-es/debounce";

export default defineComponent({
    name: "Stereo",
    setup() {
        const update = inject("update") as Function;
        const rollConfig = inject("rollConfig") as IRollConfig;

        const setStereo = debounce((value: number) => {
            rollConfig.stereo = value;
            update("stereo", rollConfig.stereo);
        }, 100);

        return () => (
            <>
                <div class="video-roll-long-box">
                    <div v-tooltip={browser.i18n.getMessage('action_reset')} class={`video-roll-switch ${rollConfig.stereo !== 0 ? 'video-roll-switch-on' : 'video-roll-switch-off'}`} onClick={() => setStereo(0)}>
                        <ReloadOutline class="reset-icon"></ReloadOutline>
                    </div>
                    <div class="video-roll-pitch">
                        <van-slider
                            v-model={rollConfig.stereo}
                            min={-1}
                            max={1}
                            step={0.01}
                            bar-height="4px"
                            onUpdate:modelValue={setStereo}
                            v-slots={{
                                button: () => (
                                    <div class="custom-button">
                                        {rollConfig.stereo}
                                    </div>
                                ),
                            }}
                        ></van-slider>
                    </div>
                </div>
            </>
        );
    },
});
