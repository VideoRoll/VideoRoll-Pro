/*
 * @description: Footer
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject, ref, watch } from "vue";
import "./index.less";
import { formatTime } from "../../utils";

export default defineComponent({
    name: "Footer",
    setup() {
        const realVideo = inject("realVideo") as any;
        const play = inject("play") as Function;
        const pause = inject("pause") as Function;
        const controlVideo = ref(realVideo.value);

        watch(() => realVideo.value, (value) => {
            controlVideo.value = realVideo.value;
        }, { deep: true });

        const changeStatus = (status: boolean, callback: Function) => {
            callback();
        }

        return () => (
            <div class="video-roll-footer">
                <div class="video-control">
                    {/* {
                        controlVideo.value?.paused ? <PlayerPlay class="play-icon" onClick={() => changeStatus(false, play)}></PlayerPlay> : <PlayerPause class="play-icon" onClick={() => changeStatus(true, pause)}></PlayerPause>
                    } */}
                </div>

                <div class="video-percentage">
                    <van-progress percentage={controlVideo.value?.percentage}
                        track-color="#2d2e31"
                        show-pivot={false}
                        color="linear-gradient(to right, #be99ff, #7232dd)"></van-progress>
                    <div>{formatTime(controlVideo.value?.currentTime)} / {formatTime(controlVideo.value?.duration)}</div>
                </div>
                {/* <p><a href="https://videoroll.gomi.site/#donate" target="_blank" class="text-link">{browser.i18n.getMessage('tips_donate')}</a> - made by <a href="https://gomi.site" target="_blank" class="text-link">Gomi</a></p> */}
            </div>
        );
    }
});
