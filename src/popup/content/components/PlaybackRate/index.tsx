/*
 * @description: speed Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject, onMounted, ref, shallowRef } from "vue";
import type { IRollConfig } from "../../../../types/type.d";
import { EllipsisVertical, ReloadOutline } from "@vicons/ionicons5";
import browser from "webextension-polyfill";
import "./index.less";
import { Dropdown } from "floating-vue";

export default defineComponent({
  name: "PlaybackRate",
  setup() {
    const update = inject("update") as Function;
    const rollConfig = inject("rollConfig") as IRollConfig;
    const selections = shallowRef([
      {
        title: "0.25x",
        value: 0.25,
      },
      {
        title: "0.5x",
        value: 0.5,
      },
      {
        title: "1.0x",
        value: 1,
      },
      {
        title: "1.5x",
        value: 1.5,
      },
      {
        title: "2.0x",
        value: 2,
      },
      {
        title: "16.0x",
        value: 16,
      },
    ]);

    // onMounted(() => {
    //   const item = selections.value.find(
    //     (v) => v.value === rollConfig.playbackRate
    //   );
    //   if (item) {
    //     selected.value = item.title;
    //   }
    // });

    const setPlaybackRateNum = (item: any) => {
      rollConfig.playbackRate = Number(item.value);
      update("playbackRate", Number(item.value));
    };


    return () => (
      <div class="video-roll-long-box">
        {selections.value.map((item) => (
          <div
            class={`speed-item ${
              Number(rollConfig.playbackRate) === Number(item.value)
                ? "video-roll-switch-on video-roll-on"
                : ""
            }`}
            onClick={() => setPlaybackRateNum(item)}
          >
            {item.title}
          </div>
        ))}
        <Dropdown
          distance="6"
          placement="top"
          v-slots={{
            popper: () => (
              <van-stepper
                v-model={rollConfig.playbackRate}
                min={0.5}
                max={16}
                step={0.5}
                decimal-length="1"
                input-width="40px"
                button-size="32px"
                onUpdate:modelValue={(val: number) => setPlaybackRateNum({ value: val })}
              ></van-stepper>
            ),
          }}
        >
          <span class="video-roll-label">
            <EllipsisVertical class="video-roll-icon"></EllipsisVertical>
          </span>
        </Dropdown>

      </div>
    );
  },
});
