/*
 * @description: ABloop Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */
import { defineComponent, inject } from "vue";
import {  RepeatOutline } from "@vicons/ionicons5";
import "./index.less";
import browser from 'webextension-polyfill'
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
                <div>
                    <van-switch
                        v-model={rollConfig.abLoop.on}
                        inactive-color="#888"
                        active-color="#409eff"
                        size="28px"
                        onChange={switchAbloop}
                    />
                </div>
                <div class="video-roll-filter-custom">
                    <div>
                        <span>A:</span>
                        
                    </div>
                </div>
            </div>
        )

        const showPopup = () => {
            setPopupShow(true);
            updateRenderContent(popupRender)
        }

        return () => (
            <div v-tooltip={browser.i18n.getMessage('video_loop')} class={`video-roll-focus video-roll-item ${rollConfig.abLoop.on ? 'video-roll-on' : 'video-roll-off'}`} onClick={showPopup}>
                <div class="video-roll-icon-box">
                    <span class="video-roll-label">
                        <RepeatOutline class="video-roll-icon"></RepeatOutline>
                    </span>
                </div>
            </div>
        );
    },
});
