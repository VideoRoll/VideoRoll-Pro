import { defineComponent, ref, onMounted, provide, Transition, h, reactive } from "vue";
// import Header from "./components/Header";
// import Navbar from "./components/Navbar";
// import AdPanel from "./components/AdPanel";

import './index.less';
import { Percentage } from "@vicons/tabler";
import { M3U8Downloader, TSegmentType } from "./class/M3u8downloader";
// import { OPTIONS_MENU } from "./config";
// import Panel from "./components/Panel";

export default defineComponent({
    name: "App",
    setup() {
        const active = ref(0);
        const onChange = (item: any, index: number) => {
            active.value = index;
        }

        const segments = ref([]);
        const downloader = ref();

        const progress = reactive({
            percentage: 0,
            downloaded: 0,
            total: 0,
            totalBytes: 0
        });

        const downloadUrl = ref('');
        const videoInfo = ref();

        onMounted(() => {
            const params = new URLSearchParams(window.location.search);
            downloadUrl.value = params.get('downloadUrl') as string;

            if (downloadUrl.value) {
                downloader.value = new M3U8Downloader({
                    log: true,
                    // outputMp4: false,
                    onParsed(data) {
                        segments.value = data.map(item => ({ ...item }));
                    },
                    onUpdated(item, index, data) {
                        segments.value = data.map(item => ({ ...item }));
                    },
                    onProgress(data, currentIndex, totalSegments) {
                        console.log(data, currentIndex, totalSegments, '-----------')
                        progress.percentage = data;
                        progress.downloaded = currentIndex;
                        progress.total = totalSegments;
                    }
                });

                // 设置m3u8地址
                downloader.value.setUrl(downloadUrl.value)
                // 开始下载
                downloader.value.start()
            }
        })

        // 点击失败的片段进行重新下载
        function handleErrorRetry(index: number) {
            if (segments.value[index].status !== 'success') {
                downloader.value.downloadTsByIndex(index)
            }
        }

        // 手动下载，一般用于下载失败后未自动下载，将失败的片段重新下载完成后使用
        function handleDownload() {
            if (!segments.value.length) {
                return alert('没有可以下载的片段！')
            }
            downloader.value.download()
        }

        // 处理M3U8下载进度
        async function downloadM3U8WithProgress(videoInfo: any) {
            try {
                const segments = videoInfo.segments;
                if (!segments || segments.length === 0) {
                    throw new Error("没有可下载的视频片段");
                }

                const totalSegments = segments.length;
                let downloadedSegments = 0;
                const chunks: any[] = [];
                let totalBytes = 0;

                // // 创建下载状态对象
                // downloadStates.set(downloadId, {
                //     status: "downloading",
                //     progress: 0,
                //     startTime: Date.now(),
                //     videoInfo: videoInfo
                // });

                // 使用请求头信息进行下载
                const headers = videoInfo.headers || {};

                // 并行下载控制
                const MAX_CONCURRENT_DOWNLOADS = 3;
                const pendingSegments = [...segments];
                const activeDownloads = new Set();

                while (pendingSegments.length > 0 || activeDownloads.size > 0) {
                    // 填充活跃下载队列
                    while (activeDownloads.size < MAX_CONCURRENT_DOWNLOADS && pendingSegments.length > 0) {
                        const segment = pendingSegments.shift();
                        const segmentUrl = new URL(segment.uri, videoInfo.url).href;

                        const downloadPromise = (async () => {
                            try {
                                const response = await fetch(segmentUrl, { headers });
                                if (!response.ok) {
                                    throw new Error(`片段下载失败: ${response.status} ${response.statusText}`);
                                }

                                const blob = await response.blob();
                                chunks.push({
                                    index: segments.indexOf(segment),
                                    blob: blob
                                });
                                totalBytes += blob.size;
                                downloadedSegments++;

                                // 更新进度
                                progress.percentage = (downloadedSegments / totalSegments) * 100;
                                progress.downloaded = downloadedSegments;
                                progress.total = totalSegments;
                                // speed: calculateSpeed(downloadId, totalBytes),
                                progress.totalBytes = totalBytes

                                // updateDownloadProgress(downloadId, progress);
                            } catch (error) {
                                console.error(`片段下载错误 (${segmentUrl}):`, error);
                                // 重新添加到队列尝试重新下载
                                if (!segment.retryCount || segment.retryCount < 3) {
                                    segment.retryCount = (segment.retryCount || 0) + 1;
                                    pendingSegments.push(segment);
                                } else {
                                    throw new Error(`片段下载失败次数过多: ${segmentUrl}`);
                                }
                            } finally {
                                // activeDownloads.delete(downloadPromise);
                            }
                        })();

                        // activeDownloads.add(downloadPromise);
                    }

                    // // 等待任意一个下载完成
                    // if (activeDownloads.size > 0) {
                    //     await Promise.race(Array.from(activeDownloads));
                    // }
                }

                // 按原始顺序排序片段
                chunks.sort((a, b) => a.index - b.index);
                const sortedBlobs = chunks.map(chunk => chunk.blob);
                // 检查是否有有效的片段
                if (sortedBlobs.length === 0) {
                    throw new Error("没有成功下载任何视频片段");
                }
                // 合并并下载
                const finalBlob = new Blob(sortedBlobs, { type: "video/mp4" });

                // 检查合并后的Blob大小
                if (finalBlob.size === 0) {
                    throw new Error("合并后的视频大小为0，下载失败");
                }
                downloadUrl.value = URL.createObjectURL(finalBlob);
            } catch (error) {
                console.error("M3U8 download failed:", error);
            }
        }

        const download = () => {
            chrome.downloads.download({
                url: downloadUrl.value,
                filename: `${videoInfo.value.title}.mp4`
            });
        }
        return () => (
            <van-config-provider theme="dark">
                {/* <Header></Header> */}
                <main>

                    <div>
                        <div class="download-percentage">
                            <van-progress percentage={progress.percentage}
                                track-color="#2d2e31"
                                show-pivot={false}
                                stroke-width="30"
                                color="linear-gradient(to right, #be99ff, #7232dd)"></van-progress>
                            <div>{progress.downloaded}/{progress.total}</div>
                        </div>
                        {
                            progress.percentage >= 100 ? <van-button onClick={download}>下载</van-button> : null
                        }

                    </div>
                    {/* <AdPanel></AdPanel> */}
                </main>
            </van-config-provider>
        );
    }
});
