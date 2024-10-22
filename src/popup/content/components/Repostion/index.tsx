/*
 * @description: move Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject, computed } from "vue";
import { MoveOutline } from "@vicons/ionicons5";
import type { IRollConfig } from "../../../../types/type";
import { getDefaultConfig } from '../../../../use';
import browser from 'webextension-polyfill'
import "./index.less";
import debounce from "lodash-es/debounce";

export default defineComponent({
    name: "Repostion",
    setup() {
        const update = inject("update") as Function;
        const rollConfig = inject("rollConfig") as IRollConfig;
        const setPopupShow = inject("setPopupShow") as Function;
        const updateRenderContent = inject("updateRenderContent") as Function;

        const isDefault = computed(() => JSON.stringify(rollConfig.move) === JSON.stringify(getDefaultConfig().move));

        const setMoveX = debounce((value: number) => {
            rollConfig.move.x = value;
            update("move", rollConfig.move);
        }, 100);

        const setMoveY = debounce((value: number) => {
            rollConfig.move.y = value;
            update("move", rollConfig.move);
        }, 100);

        const reset = () => {
            setMoveX(getDefaultConfig().move.x);
            setMoveY(getDefaultConfig().move.y)
        };

        const popupRender = () => (
            <>
                <div class="video-roll-move">
                    <div class="move-box">
                        <van-divider class="move-label">{browser.i18n.getMessage('video_left')} - {browser.i18n.getMessage('video_right')}</van-divider>
                        <div class="move-slider">
                            <van-slider
                                v-model={rollConfig.move.x}
                                min={-100}
                                max={100}
                                step={1}
                                bar-height="4px"
                                onUpdate:modelValue={setMoveX}
                                v-slots={{
                                    button: () => (
                                        <div class="custom-button">
                                            {rollConfig.move.x}
                                        </div>
                                    ),
                                }}
                            ></van-slider>
                        </div>
                    </div>
                    <div class="move-box">
                        <van-divider class="move-label">{browser.i18n.getMessage('video_down')} - {browser.i18n.getMessage('video_up')}</van-divider>
                        <div class="move-slider">
                            <van-slider
                                v-model={rollConfig.move.y}
                                min={-100}
                                max={100}
                                step={1}
                                bar-height="4px"
                                onUpdate:modelValue={setMoveY}
                                v-slots={{
                                    button: () => (
                                        <div class="custom-button">
                                            {rollConfig.move.y}
                                        </div>
                                    ),
                                }}
                            ></van-slider>
                        </div>
                    </div>
                </div>
                <van-button class="video-roll-resetBtn" size="mini" icon="replay" type="primary" onClick={reset}>{browser.i18n.getMessage('action_reset')}</van-button>
            </>
        )

        const showPopup = () => {
            setPopupShow(true);
            updateRenderContent(popupRender)
        }

        return () => (
            <div v-tooltip={browser.i18n.getMessage('video_reposition')} class={`video-roll-focus video-roll-item ${!isDefault.value ? 'video-roll-on' : 'video-roll-off'}`} onClick={showPopup}>
                <div class="video-roll-icon-box">
                    <span class="video-roll-label">
                        <MoveOutline
                            class="video-roll-icon"
                        ></MoveOutline>
                    </span>
                </div>
            </div>
        );
    },
});