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
  watch,
} from "vue";
import { RadioButtonOnOutline } from "@vicons/ionicons5";
import { useCountDown } from "@vant/use";
import "./index.less";
import browser from "webextension-polyfill";
import { IRollConfig } from "src/types/type";
import { showLoadingToast, showToast } from "vant/es/toast/index.mjs";
import { formatTime } from "../../utils";
import { vPermission } from "../../../../lib/directive";

export default defineComponent({
  name: "Record",
  directives: {
    permission: vPermission
  },
  setup() {
    const startRecord = inject("startRecord") as Function;
    const stopRecord = inject("stopRecord") as Function;
    const rollConfig = inject("rollConfig") as IRollConfig;
    const realVideo = inject("realVideo") as any;
    const user = inject("user");
    const isRecording = ref(false);
    const recordTime = ref(0);
    const startRecordTime = ref(0);
    const toast = ref();

    const countDown = useCountDown({
      // 倒计时 3s
      time: 2000,
      onChange(value) {
        toast.value.message = `${value.seconds + 1}s \n start`;
      },
      onFinish() {
        countDown.reset();
        startRecord();
        isRecording.value = true;
      },
    });

    const onRecord = () => {
      if (isRecording.value) {
        isRecording.value = false;
        stopRecord();
      } else {
        countDown.start();
        toast.value = showLoadingToast({
          duration: countDown.current.seconds,
          forbidClick: true,
          message: `${countDown.current.seconds + 1}s \n start`,
        });
      }
    };

    const refreshStatus = (config: IRollConfig) => {
      switch (config.recordStatus) {
        case "recording":
          isRecording.value = true;
          startRecordTime.value = config.recordTime ?? 0;
          break;
        case "paused":
          isRecording.value = false;
          break;
        case "inactive":
          isRecording.value = false;
          startRecordTime.value = 0;
          recordTime.value = 0;
          break;
        default:
          // isRecording.value = false;
          break;
      }
    };

    watch(
      () => rollConfig,
      () => {
        if (rollConfig.recordInfo) {
          isRecording.value = false;
          toast.value = showToast({
            duration: 2000,
            message: rollConfig.recordInfo,
          });

          return;
        }

        if (rollConfig.recordTime) {
          startRecordTime.value = rollConfig.recordTime ?? 0;
        }

        refreshStatus(rollConfig);
      },
      {
        deep: true,
      }
    );

    watch(
      () => realVideo.value,
      (value) => {
        if (!isRecording.value) return;

        recordTime.value = realVideo.value?.currentTime - startRecordTime.value;
      },
      { deep: true }
    );

    onMounted(() => {
      refreshStatus(rollConfig);
    });

    return () => (
      <div
        v-tooltip={browser.i18n.getMessage("tab_record")}
        class={`video-roll-focus video-roll-item video-roll-off ${
          isRecording.value ? "video-roll-recording" : ""
        }`}
        onClick={onRecord}
        v-permission={[user.value?.role]}
      >
        <div class="video-roll-icon-box">
          <span class="video-roll-label video-roll-flex">
            <RadioButtonOnOutline class="video-roll-icon"></RadioButtonOnOutline>
            {isRecording.value && recordTime.value > 0 ? (
              <span style="font-size: 10px">
                {formatTime(recordTime.value)}
              </span>
            ) : null}
          </span>
        </div>
      </div>
    );
  },
});
