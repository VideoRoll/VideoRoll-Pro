/*
 * @description: download Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */
import { defineComponent, inject, onMounted, ref, shallowReactive, watch } from "vue";
import { RadioButtonOnOutline } from "@vicons/ionicons5";
import "./index.less";
import browser from "webextension-polyfill";
import { IRollConfig } from "src/types/type";

export default defineComponent({
    name: "Record",
    setup() {
        const startRecord = inject("startRecord") as Function;
        const stopRecord = inject("stopRecord") as Function;
        const rollConfig = inject("rollConfig") as IRollConfig;
        const isRecording = ref(false);
        const onRecord = () => {
            if (isRecording.value) {
                stopRecord();
            } else {
                startRecord();
                isRecording.value = true;
            }
        };

        // onMounted(() => {
        //     isRecording.value = rollConfig.isRecording;
        // });

        watch(() => rollConfig.isRecording , (value) => {
            isRecording.value = value
        })

        return () => (
            <div
                v-tooltip={browser.i18n.getMessage("video_loop")}
                class={`video-roll-focus video-roll-item video-roll-off ${
                    isRecording.value ? "video-roll-recording" : ""
                }`}
                onClick={onRecord}
            >
                <div class="video-roll-icon-box">
                    <span class="video-roll-label">
                        <RadioButtonOnOutline class="video-roll-icon"></RadioButtonOnOutline>
                    </span>
                </div>
            </div>
        );
    },
});
