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

export default defineComponent({
    name: "VideoList",
    setup() {
        const rollConfig = inject("rollConfig") as IRollConfig;
        const onHoverVideo = inject("onHoverVideo") as Function;
        const updateVideoCheck = inject("updateVideoCheck") as Function;
        const videoList = inject("videoList") as any;

        const getCheckedVideo = (list: any) => {
            return list.filter((v: any) => v.checked).map((v: any) => v.id);
        }

        const checked = ref(getCheckedVideo(videoList.value));

        const onChange = (ids: string[]) => {
            updateVideoCheck(ids);
        }

        const onTriggerDownload = (id: string) => {
            showConfirmDialog({
                message: '目前仅支持缓存下载模式，刷新页面后请勿关闭和拖拽视频进度',
                confirmButtonText: 'Yes',
                cancelButtonText: 'No'
            }).then(() => {
                const newUrl = browser.runtime.getURL(`download/index.html?id=${id}`);
                browser.tabs.create({ url: newUrl });
            });
        }

        const onError = function () { }

        watch(() => videoList.value, (value) => {
            const list = getCheckedVideo(value);
            if (JSON.stringify(list) === JSON.stringify(checked.value)) return;
            checked.value = [...list];
        }, { deep: true });


        function formatTime(value: string) {
            const seconds = Number(value);
            const h = Math.floor(seconds / 3600); // 小时
            const m = Math.floor((seconds % 3600) / 60); // 分钟
            const s = Math.floor(seconds % 60); // 秒

            // 如果小时为 0，不显示小时
            const formattedHours = h > 0 ? String(h).padStart(2, '0') + ':' : '';
            const formattedMinutes = String(m).padStart(2, '0');
            const formattedSeconds = String(s).padStart(2, '0');

            return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
        }

        return () => (
            <div>
                <van-notice-bar
                    left-icon="tv-o"
                    color="#1989fa"
                    background="transparent"
                    text={rollConfig.document?.title}
                />
                <van-checkbox-group v-model={checked.value} onChange={onChange}>
                    {videoList.value.length ? videoList.value.sort((a: any, b: any) => Number(b.isReal) - Number(a.isReal)).map((v: any) =>
                        <div class="video-item" onMouseleave={() => onHoverVideo(v.id, false)} onMouseenter={() => onHoverVideo(v.id, true)}>
                            <van-checkbox shape="square" name={v.id} key={v.id} iconSize={15}>
                                <div class="video-item-box">
                                    <div class="video-poster-box">
                                        {
                                            v.posterUrl ? <img class="video-poster" src={v.posterUrl} onError={onError}></img> :
                                                <svg xmlns="http://www.w3.org/2000/svg" class="ionicon video-poster" viewBox="0 0 512 512"><path d="M508.64 148.79c0-45-33.1-81.2-74-81.2C379.24 65 322.74 64 265 64h-18c-57.6 0-114.2 1-169.6 3.6C36.6 67.6 3.5 104 3.5 149 1 184.59-.06 220.19 0 255.79q-.15 53.4 3.4 106.9c0 45 33.1 81.5 73.9 81.5 58.2 2.7 117.9 3.9 178.6 3.8q91.2.3 178.6-3.8c40.9 0 74-36.5 74-81.5 2.4-35.7 3.5-71.3 3.4-107q.34-53.4-3.26-106.9zM207 353.89v-196.5l145 98.2z" /></svg>
                                        }
                                    </div>
                                    <div class="video-info">
                                        <div class="video-info-name">
                                            {v.name}
                                        </div>
                                        <div class="video-percentage">
                                            <van-progress percentage={v.percentage}
                                                track-color="#2d2e31"
                                                show-pivot={false}
                                                color="linear-gradient(to right, #be99ff, #7232dd)"></van-progress>
                                            <div>{formatTime(v.currentTime)}</div>
                                        </div>

                                        <div class="video-tags">
                                            <van-tag plain type="primary">{v.duration} mins</van-tag>
                                            {
                                                v.isReal ? <van-tag type="success">{browser.i18n.getMessage('list_main')}</van-tag> : null
                                            }
                                            {/* <van-button type="primary" size="small" disabled={v.percentage !== 100} onClick={() => onTriggerDownload(v.id)} >下载</van-button> */}
                                        </div>
                                    </div>
                                </div>
                            </van-checkbox>
                        </div>
                    ) : <div><van-empty image="error" description={browser.i18n.getMessage('tips_empty')} /></div>}
                </van-checkbox-group>
            </div>
        );
    },
});
