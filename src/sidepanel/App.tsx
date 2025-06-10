/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2025-05-26 20:55:22
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-10 21:15:59
 * @FilePath: \website-nextc:\programs\VideoRoll-Pro\src\player\app.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
  defineComponent,
  ref,
  onMounted,
  provide,
  h,
  reactive,
  computed,
  watch,
} from "vue";

export default defineComponent({
  name: "App",
  setup() {
    onMounted(() => {
      // Initialize any necessary data or state here
      console.log("Sidepanel App mounted");
    })
    return () => (
      <van-config-provider theme="dark" class="h-full">
        <main class="flex flex-row h-full">
          123
        </main>
      </van-config-provider>
    );
  },
});
