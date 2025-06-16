/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2024-09-23 17:01:48
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-16 21:42:51
 * @FilePath: \website-nextc:\programs\VideoRoll-Pro\src\options\app.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
  defineComponent,
  ref,
  onMounted,
  provide,
  Transition,
  h,
} from "vue";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import AdPanel from "./components/AdPanel";

import "./index.less";
import { OPTIONS_MENU } from "./config";
import Panel from "./components/Panel";

export default defineComponent({
  name: "App",
  setup() {
    const active = ref(0);
    const onChange = (item: any, index: number) => {
      active.value = index;
    };
    return () => (
      <van-config-provider theme="dark">
        <Header></Header>
        <main class="max-w-lg">
          <Navbar active={active.value} onChange={onChange}></Navbar>
          <Panel
            v-slots={{
              content: () => h(OPTIONS_MENU[active.value].component),
            }}
          ></Panel>
        </main>
      </van-config-provider>
    );
  },
});
