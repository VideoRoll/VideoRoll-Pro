/*
 * @description: useComponents
 * @Author: Gouxinyu
 * @Date: 2022-09-11 11:12:50
 */
import { shallowReactive } from "vue";
import {
  DeviceTv,
  Headphones,
  Download,
  List,
  Adjustments,
} from "@vicons/tabler";
import browser from "webextension-polyfill";
import { Tooltip } from "floating-vue";

// 静态导入所有组件， 避免parcel拆包
import Rotate from "../components/Rotate";
import Loop from "../components/Loop";
import PictureInPicture from "../components/PictureInPicture";
import Reposition from "../components/Repostion";
import Stretch from "../components/Stretch";
import Flip from "../components/Flip";
import Capture from "../components/Capture";
import QR from "../components/QR";
import Filter from "../components/Filter";
import Focus from "../components/Focus";
import AdvancedPictureInPicture from "../components/AdvancedPictureInPicture";
import ABLoop from "../components/ABLoop";
import VR from "../components/Vr";
import Record from "../components/Record";
import Player from "../components/Player";
import PlaybackRate from "../components/PlaybackRate";
import Zoom from "../components/Zoom";
import Mute from "../components/Mute";
import Panner from "../components/Panner";
import Volume from "../components/Volume";
import Pitch from "../components/Pitch";
import Delay from "../components/Delay";
import Stereo from "../components/Stereo";
import VideoList from "../components/VideoList";
import More from "../components/More";

interface IConfig {
  type: string;
  title?: JSX.Element | string;
  merge?: boolean;
  style?: Object;
  class?: string;
  children?: any[];
}

interface IComponentConfig extends IConfig {
  type: "component";
  component: any;
}

interface IContainerConfig extends IConfig {
  type: "container";
  title?: string;
  col?: number;
  showTitle?: boolean;
  children?: IComponentConfig[] | IRowConfig[];
}

interface IFragmentConfig extends IConfig {
  type: "fragment";
  col?: number;
  children?: IComponentConfig[] | IRowConfig[];
}

interface IRowConfig extends IConfig {
  type: "row";
  children: IContainerConfig[] | IFragmentConfig[];
}

interface ISwiperConfig extends IConfig {
  type: "swiper";
  children: IRowConfig[];
}

interface ITabConfig extends IConfig {
  type: "tab";
  children: IRowConfig[] | IComponentConfig[];
}

export default function useComponents() {
  const components = shallowReactive<ITabConfig[]>([
    {
      type: "tab",
      title: (
        <Tooltip>
          <div
            class="tab-title"
            v-tooltip={browser.i18n.getMessage("tabs_video")}
          >
            <DeviceTv class="tab-icon" />
          </div>
        </Tooltip>
      ),
      children: [
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              col: 12,
              title: browser.i18n.getMessage("video_rotate"),
              showTitle: true,
              children: [
                {
                  type: "component",
                  component: <Rotate></Rotate>,
                },
              ],
            },
            {
              type: "container",
              col: 6,
              title: browser.i18n.getMessage("video_loop"),
              showTitle: true,
              children: [
                {
                  type: "component",
                  component: <Loop></Loop>,
                },
              ],
            },
            {
              type: "container",
              col: 6,
              title: browser.i18n.getMessage("video_pic"),
              showTitle: true,
              children: [
                {
                  type: "component",
                  component: <PictureInPicture></PictureInPicture>,
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              title: browser.i18n.getMessage("video_reposition"),
              showTitle: true,
              col: 6,
              children: [
                {
                  type: "component",
                  component: <Reposition></Reposition>,
                },
              ],
            },
            {
              type: "container",
              col: 6,
              title: browser.i18n.getMessage("video_stretch"),
              showTitle: true,
              children: [
                {
                  type: "component",
                  component: <Stretch />,
                },
              ],
            },
            {
              type: "container",
              col: 6,
              title: browser.i18n.getMessage("video_flip"),
              showTitle: true,
              children: [
                {
                  type: "component",
                  component: <Flip></Flip>,
                },
              ],
            },
            {
              type: "container",
              title: browser.i18n.getMessage("video_screenshot"),
              showTitle: true,
              col: 6,
              children: [
                {
                  type: "component",
                  component: <Capture></Capture>,
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              title: "QR",
              showTitle: true,
              col: 6,
              children: [
                {
                  type: "component",
                  component: <QR></QR>,
                },
              ],
            },
            {
              type: "container",
              title: browser.i18n.getMessage("video_filter"),
              showTitle: true,
              col: 6,
              children: [
                {
                  type: "component",
                  component: <Filter></Filter>,
                },
              ],
            },
            {
              type: "container",
              title: browser.i18n.getMessage("video_focus"),
              showTitle: true,
              col: 6,
              children: [
                {
                  type: "component",
                  component: <Focus></Focus>,
                },
              ],
            },
            {
              type: "container",
              title: "Separate",
              showTitle: true,
              col: 6,
              children: [
                {
                  type: "component",
                  component: (
                    <AdvancedPictureInPicture></AdvancedPictureInPicture>
                  ),
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              title: "A-B Loop",
              showTitle: true,
              class: "container-badge-pro",
              col: 6,
              children: [
                {
                  type: "component",
                  component: <ABLoop></ABLoop>,
                },
              ],
            },
            {
              type: "container",
              title: "VR",
              showTitle: true,
              class: "container-badge-pro",
              col: 6,
              children: [
                {
                  type: "component",
                  component: <VR></VR>,
                },
              ],
            },
            {
              type: "container",
              title: "Record",
              showTitle: true,
              class: "container-badge-pro",
              col: 6,
              children: [
                {
                  type: "component",
                  component: <Record></Record>,
                },
              ],
            },
            {
              type: "container",
              title: "Player",
              showTitle: true,
              class: "container-badge-pro",
              col: 6,
              children: [
                {
                  type: "component",
                  component: <Player></Player>,
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              col: 24,
              title: browser.i18n.getMessage("video_speed"),
              showTitle: true,
              children: [
                {
                  type: "component",
                  component: <PlaybackRate></PlaybackRate>,
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              col: 24,
              title: browser.i18n.getMessage("video_zoom"),
              showTitle: true,
              children: [
                {
                  type: "component",
                  component: <Zoom></Zoom>,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "tab",
      title: (
        <Tooltip>
          <div
            class="tab-title"
            v-tooltip={browser.i18n.getMessage("tabs_audio")}
          >
            <Headphones class="tab-icon" />
          </div>
        </Tooltip>
      ),
      children: [
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              title: browser.i18n.getMessage("audio_muted"),
              showTitle: true,
              col: 12,
              children: [
                {
                  type: "component",
                  component: <Mute></Mute>,
                },
              ],
            },
            {
              type: "container",
              title: "Surround",
              class: "container-badge-pro",
              showTitle: true,
              col: 12,
              children: [
                {
                  type: "component",
                  component: <Panner></Panner>,
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              title: browser.i18n.getMessage("audio_volume"),
              showTitle: true,
              col: 24,
              children: [
                {
                  type: "component",
                  component: <Volume></Volume>,
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              title: browser.i18n.getMessage("audio_pitch"),
              class: "container-badge-pro",
              showTitle: true,
              col: 24,
              children: [
                {
                  type: "component",
                  component: <Pitch></Pitch>,
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              title: "Delay",
              class: "container-badge-pro",
              showTitle: true,
              col: 24,
              children: [
                {
                  type: "component",
                  component: <Delay></Delay>,
                },
              ],
            },
          ],
        },
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "40px",
          },
          children: [
            {
              type: "container",
              title: "Stereo",
              class: "container-badge-pro",
              showTitle: true,
              col: 24,
              children: [
                {
                  type: "component",
                  component: <Stereo></Stereo>,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "tab",
      title: (
        <Tooltip>
          <div
            class="tab-title"
            v-tooltip={browser.i18n.getMessage("tabs_list")}
          >
            <Download class="tab-icon" />
          </div>
        </Tooltip>
      ),
      children: [
        {
          type: "component",
          component: <VideoList></VideoList>,
        },
      ],
    },
    {
      type: "tab",
      title: (
        <Tooltip>
          <div
            class="tab-title"
            v-tooltip={browser.i18n.getMessage("tabs_more")}
          >
            <Adjustments class="tab-icon" />
          </div>
        </Tooltip>
      ),
      children: [
        {
          type: "row",
          style: {
            margin: "30px 0",
            height: "100px",
          },
          children: [
            {
              type: "fragment",
              col: 24,
              children: [
                {
                  type: "component",
                  component: <More></More>,
                },
              ],
            },
          ],
        },
      ],
    },
  ]);

  return components;
}

export {
  ITabConfig,
  ISwiperConfig,
  IRowConfig,
  IComponentConfig,
  IContainerConfig,
  IFragmentConfig,
  IConfig,
};
