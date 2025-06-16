/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2024-09-23 17:01:48
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-15 15:59:21
 * @FilePath: \website-nextc:\programs\VideoRoll-Pro\src\options\utils\render.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ColorPicker } from "vue3-colorpicker";

export default function render(config: any, onChange: Function) {
  return config.map((item: any) => {
    switch (item.type) {
      case "group":
        return (
          <div class="general-group">
            <div class="general-title">{item.title}</div>
            <van-cell-group inset>
              {render(item.config, onChange)}
            </van-cell-group>
          </div>
        );
      case "color-picker":
        return (
          <van-field
            label-width="300"
            input-align="right"
            name="switch"
            label={item.title}
            v-slots={{
              input: () => (
                <ColorPicker
                  theme="black"
                  format="rgb"
                  shape="circle"
                  v-model:pureColor={item.value}
                  onUpdate:pureColor={onChange}
                />
              ),
            }}
          ></van-field>
        );
      case "switch":
        return (
          <van-field
            label-width="300"
            input-align="right"
            name="switch"
            label={item.title}
            v-slots={{
              input: () => (
                <van-switch
                  size="15px"
                  v-model={item.value}
                  onChange={onChange}
                />
              ),
            }}
          ></van-field>
        );
      default:
        return null;
    }
  });
}
