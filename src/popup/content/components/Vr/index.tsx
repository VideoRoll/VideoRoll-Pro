/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2024-09-23 17:01:49
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-06 22:11:01
 * @FilePath: \website-nextc:\programs\VideoRoll-Pro\src\popup\content\components\Vr\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineComponent, inject } from "vue";
import { GlassesOutline } from "@vicons/ionicons5";
import type { IRollConfig } from "../../../../types/type.d";
import browser from "webextension-polyfill";
import { vPermission } from "../../../../lib/directive";
import "./index.less";

export default defineComponent({
  name: "Vr",
  directives: {
    permission: vPermission
  },
  setup() {
    const update = inject("update") as Function;
    const rollConfig = inject("rollConfig") as IRollConfig;
    const user = inject("user");

    const setVr = () => {
      rollConfig.vr.on = !rollConfig.vr.on;
      update("vr", rollConfig.vr);
    };
    return () => (
      <div
        v-tooltip={browser.i18n.getMessage("tab_vr")}
        class={`video-roll-focus video-roll-item ${
          rollConfig.vr.on ? "video-roll-on" : "video-roll-off"
        }`}
        v-permission={[user.value?.role]}
        onClick={setVr}
      >
        <div class="video-roll-icon-box">
          <span class="video-roll-label">
            <GlassesOutline class="video-roll-icon"></GlassesOutline>
          </span>
        </div>
      </div>
    );
  },
});
