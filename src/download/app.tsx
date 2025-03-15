import { defineComponent, ref, onMounted, provide, Transition, h, reactive, computed } from "vue";
// import Header from "./components/Header";
// import Navbar from "./components/Navbar";
// import AdPanel from "./components/AdPanel";

import './index.less';
import { M3U8Downloader } from "./class/M3u8downloader";
// import { OPTIONS_MENU } from "./config";
// import Panel from "./components/Panel";

export default defineComponent({
    name: "App",
    setup() {
        const segments = ref([]);
        const downloader = ref();

        const progress = reactive({
            percentage: 0,
            downloaded: 0,
            total: 0,
            totalBytes: 0
        });

        const downloadId = ref('');
        const isFinished = ref(false);

        const isButtonEnable = computed(() => {
            return progress.percentage >= 100 && isFinished.value;
        })

        onMounted(async () => {
            const params = new URLSearchParams(window.location.search);
            downloadId.value = params.get('downloadId') as string;

            if (downloadId.value) {
                const data = await chrome.storage.local
                    .get([downloadId.value]);
                const videoInfo = data[downloadId.value];

                if (!videoInfo) return;

                chrome.tabs.onRemoved.addListener(() => {
                    chrome.storage.local.remove([downloadId.value]);
                })

                downloader.value = new M3U8Downloader({
                    url: videoInfo.url,
                    log: true,
                    // outputMp4: false,
                    onParsed(data) {
                        segments.value = data.map(item => ({ ...item }));
                    },
                    onUpdated(item, index, data) {
                        segments.value = data.map(item => ({ ...item }));
                    },
                    onProgress(data, currentIndex, totalSegments, fileSize) {
                        console.log(data, currentIndex, totalSegments, '-----------')
                        progress.percentage = data;
                        progress.downloaded = currentIndex;
                        progress.total = totalSegments;
                        progress.totalBytes = fileSize;
                    },
                    onFinish() {
                        isFinished.value = true;
                    }

                });

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

        const downloadTS = async () => {
            const blob = await downloader.value.getTSData();
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url,
                filename: `${downloader.value.filename}.ts`
            });
        }

        const downloadMP4 = async () => {
            const blob = await downloader.value.getMP4Data();
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url,
                filename: `${downloader.value.filename}.mp4`
            });
        }
        return () => (
            <van-config-provider theme="dark">
                {/* <Header></Header> */}
                <main>
                    <div class="download-page">
                        <div class="download-info">
                            <div>Size: {progress.totalBytes}</div>
                            <div>Segments: {progress.downloaded}/{progress.total}</div>
                        </div>
                        <div class="download-percentage">
                            <van-progress percentage={progress.percentage}
                                track-color="#2d2e31"
                                show-pivot={false}
                                stroke-width="20"
                                color="linear-gradient(to right, #be99ff, #7232dd)"></van-progress>
                        </div>
                        <div>
                            <van-button disabled={!isButtonEnable.value} type="primary" size="small" onClick={downloadTS}>下载TS</van-button>
                            <van-button disabled={!isButtonEnable.value} type="primary" size="small" onClick={downloadMP4}>下载MP4</van-button>
                        </div>

                    </div>
                </main>
            </van-config-provider>
        );
    }
});
