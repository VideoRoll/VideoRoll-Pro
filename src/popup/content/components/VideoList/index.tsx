/*
 * @description: videoList Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject, ref, watch } from "vue";
import browser from "webextension-polyfill";
import "./index.less";
import { IRollConfig } from "src/types/type";
import { showConfirmDialog } from "vant";
import { Download } from "@vicons/tabler";

export default defineComponent({
    name: "VideoList",
    setup() {
        const rollConfig = inject("rollConfig") as IRollConfig;
        const onHoverVideo = inject("onHoverVideo") as Function;
        const updateVideoCheck = inject("updateVideoCheck") as Function;
        const videoList = inject("videoList") as any;

        const getCheckedVideo = (list: any) => {
            return list.filter((v: any) => v.checked).map((v: any) => v.id);
        };

        // const checked = ref(getCheckedVideo(videoList.value));

        const onChange = (ids: string[]) => {
            updateVideoCheck(ids);
        };

        const onTriggerDownload = (id: string) => {
            showConfirmDialog({
                message:
                    "目前仅支持缓存下载模式，刷新页面后请勿关闭和拖拽视频进度",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
            }).then(() => {
                const newUrl = browser.runtime.getURL(
                    `download/index.html?id=${id}`
                );
                browser.tabs.create({ url: newUrl });
            });
        };

        const onError = function () {};

        // watch(() => videoList.value, (value) => {
        //     const list = getCheckedVideo(value);
        //     if (JSON.stringify(list) === JSON.stringify(checked.value)) return;
        //     checked.value = [...list];
        // }, { deep: true });

        function formatTime(value: string) {
            const seconds = Number(value);
            const h = Math.floor(seconds / 3600); // 小时
            const m = Math.floor((seconds % 3600) / 60); // 分钟
            const s = Math.floor(seconds % 60); // 秒

            // 如果小时为 0，不显示小时
            const formattedHours =
                h > 0 ? String(h).padStart(2, "0") + ":" : "";
            const formattedMinutes = String(m).padStart(2, "0");
            const formattedSeconds = String(s).padStart(2, "0");

            return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
        }

        // 格式化文件大小
        function formatFileSize(bytes: number): string {
            if (bytes === 0) return "0 B";
            const k = 1024;
            const sizes = ["B", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return (
                parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
            );
        }

        return () => (
            <div>
                <van-notice-bar
                    left-icon="tv-o"
                    color="#1989fa"
                    background="transparent"
                    text={rollConfig.document?.title}
                />
                {videoList.value?.length ? (
                    videoList.value.map((v: any) => (
                        <div
                            class="video-item"
                            onMouseleave={() => onHoverVideo(v.id, false)}
                            onMouseenter={() => onHoverVideo(v.id, true)}
                        >
                            <div class="video-item-box">
                                <div class="video-info">
                                    <div class="video-info-name">{v.url}</div>
                                    {/* <div class="video-percentage">
                                            <van-progress percentage={v.percentage}
                                                track-color="#2d2e31"
                                                show-pivot={false}
                                                color="linear-gradient(to right, #be99ff, #7232dd)"></van-progress>
                                            <div>{formatTime(v.currentTime)}</div>
                                        </div> */}

                                    <div class="video-tags">
                                        <div>
                                            <van-tag type="primary">
                                                {v.type}
                                            </van-tag>
                                            {typeof v.size === "number" ? (
                                                <van-tag plain type="success">
                                                    {formatFileSize(v.size)}
                                                </van-tag>
                                            ) : null}
                                        </div>
                                        <div>
                                            <Download class="list-icon"></Download>
                                        </div>
                                        {/* <van-button type="primary" size="small" disabled={v.percentage !== 100} onClick={() => onTriggerDownload(v.id)} >下载</van-button> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div>
                        <van-empty
                            image="error"
                            description={browser.i18n.getMessage("tips_empty")}
                        />
                    </div>
                )}
            </div>
        );
    },
});
