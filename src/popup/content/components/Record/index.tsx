/*
 * @description: download Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */
import {
    defineComponent,
    inject,
    onMounted,
    ref,
    shallowReactive,
    shallowRef,
    watch,
} from "vue";
import { RadioButtonOnOutline } from "@vicons/ionicons5";
import { useCountDown } from "@vant/use";
import "./index.less";
import browser from "webextension-polyfill";
import { IRollConfig } from "src/types/type";
import { showLoadingToast } from "vant/es/toast/index.mjs";

export default defineComponent({
    name: "Record",
    setup() {
        const startRecord = inject("startRecord") as Function;
        const stopRecord = inject("stopRecord") as Function;
        const rollConfig = inject("rollConfig") as IRollConfig;
        const isRecording = ref(false);
        const popupShow = ref(false);
        const countdown = shallowRef(3);
        const toast = ref();

        const countDown = useCountDown({
            // 倒计时 3s
            time: 4000,
            onChange(value) {
                toast.value.message = `${value.seconds}s后 \n 开始录制`;
            },
            onFinish() {
                countDown.reset();
                startRecord();
                isRecording.value = true;
            },
        });

        const onRecord = () => {
            if (isRecording.value) {
                stopRecord();
            } else {
                countDown.start();
                toast.value = showLoadingToast({
                    duration: countDown.current.seconds,
                    forbidClick: true,
                    message: `${countDown.current.seconds}s后 \n 开始录制`,
                });
            }
        };

        // onMounted(() => {
        //     isRecording.value = rollConfig.isRecording;
        // });

        watch(
            () => rollConfig.isRecording,
            (value) => {
                isRecording.value = value;
            }
        );

        return () => (
            <>
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
            </>
        );
    },
});
