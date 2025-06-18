/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2025-06-17 19:26:09
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-17 22:38:32
 * @FilePath: \website-nextc:\programs\VideoRoll-Pro\src\options\app.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
  defineComponent,
  ref,
  h,
} from "vue";
import Header from "./components/Header";
import Navbar from "./components/Navbar";

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
        <main class="mx-auto">
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
