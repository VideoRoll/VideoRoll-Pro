/*
 * @description: ABloop Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */
import { defineComponent, inject } from "vue";
import { RepeatOutline } from "@vicons/ionicons5";
import "./index.less";
import browser from "webextension-polyfill";
import { IRollConfig } from "src/types/type";

export default defineComponent({
    name: "ABLoop",
    setup() {
        const update = inject("update") as Function;
        const rollConfig = inject("rollConfig") as IRollConfig;
        const setPopupShow = inject("setPopupShow") as Function;
        const updateRenderContent = inject("updateRenderContent") as Function;

        const switchAbloop = (value: boolean) => {
            rollConfig.abLoop.on = value;
            update("abLoop", rollConfig.abLoop);
        };

        const popupRender = () => (
            <div class="video-roll-filter">
                <div class="video-roll-filter-custom">
                    <van-cell-group>
                        <van-field
                            input-align="right"
                            name="switch"
                            label="是否开启"
                            v-slots={{
                                input: () => (
                                    <van-switch
                                        size="15px"
                                        v-model={rollConfig.abLoop.on}
                                        onChange={switchAbloop}
                                    />
                                ),
                            }}
                        ></van-field>
                        <van-field
                            v-model={rollConfig.abLoop.a}
                            label="A"
                            colon
                            placeholder="00:00:00"
                        />
                        <van-field
                            v-model={rollConfig.abLoop.b}
                            label="B"
                            colon
                            placeholder="00:00:00"
                        />
                    </van-cell-group>
                </div>
            </div>
        );

        const showPopup = () => {
            setPopupShow(true);
            updateRenderContent(popupRender);
        };

        return () => (
            <div
                v-tooltip={browser.i18n.getMessage("video_loop")}
                class={`video-roll-focus video-roll-item ${
                    rollConfig.abLoop.on ? "video-roll-on" : "video-roll-off"
                }`}
                onClick={showPopup}
            >
                <div class="video-roll-icon-box">
                    <span class="video-roll-label">
                        <RepeatOutline class="video-roll-icon"></RepeatOutline>
                    </span>
                </div>
            </div>
        );
    },
});
