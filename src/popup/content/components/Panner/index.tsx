/*
 * @description: store Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */
import { defineComponent, inject } from "vue";
import { VolumeHighOutline, VolumeMuteOutline } from "@vicons/ionicons5";
import { Ear } from "@vicons/tabler";
import type { IRollConfig } from "../../../../types/type";
import "./index.less";

export default defineComponent({
    name: "Panner",
    setup() {
        const update = inject("update") as Function;
        const rollConfig = inject("rollConfig") as IRollConfig;

        const setPanner = () => {
            rollConfig.panner = !rollConfig.panner;
            update("panner", rollConfig.panner);
        };
        return () => (
            <div title='Muted' class={`video-roll-focus video-roll-item ${rollConfig.panner ? 'video-roll-on' : 'video-roll-off'}`} onClick={setPanner}>
                <div class="video-roll-icon-box">
                    <span class="video-roll-label">
                        <Ear class="video-roll-icon"></Ear>
                    </span>
                </div>
            </div>
        );
    },
});
