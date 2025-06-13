/**
 * useLayoutComponents - 使用布局配置的组件系统
 */
import { computed, onMounted, ref } from "vue";
import {
  DeviceTv,
  Headphones,
  Download,
  Adjustments,
} from "@vicons/tabler";
import browser from "webextension-polyfill";
import { Tooltip } from "floating-vue";
import { useLayoutConfig, TabConfig, RowConfig, ComponentItem } from "../../../options/utils/useLayoutConfig";

import { JSX } from "vue/jsx-runtime";

// 静态导入所有组件
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
import Summarizer from "../components/Summarizer";

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

export default function useLayoutComponents() {
  const { layoutConfig, loadConfig } = useLayoutConfig();
  const isConfigLoaded = ref(false);

  // 强制重新加载配置的方法
  const reloadConfig = async () => {
    console.log('Force reloading configuration...');
    isConfigLoaded.value = false;
    try {
      await loadConfig();
      isConfigLoaded.value = true;
      console.log('Configuration force reloaded successfully');
    } catch (error) {
      console.error('Failed to force reload configuration:', error);
      isConfigLoaded.value = true;
    }
  };

  // 组件映射表
  const componentMap: Record<string, any> = {
    rotate: <Rotate />,
    loop: <Loop />,
    pip: <PictureInPicture />,
    reposition: <Reposition />,
    stretch: <Stretch />,
    flip: <Flip />,
    capture: <Capture />,
    qr: <QR />,
    filter: <Filter />,
    focus: <Focus />,
    separate: <AdvancedPictureInPicture />,
    player: <Player />,
    abloop: <ABLoop />,
    vr: <VR />,
    record: <Record />,
    summarizer: <Summarizer />,
    speed: <PlaybackRate />,
    zoom: <Zoom />,
    // 音频组件
    mute: <Mute />,
    panner: <Panner />,
    volume: <Volume />,
    pitch: <Pitch />,
    delay: <Delay />,
    stereo: <Stereo />,
  };
  // 图标映射表
  const iconMap: Record<string, any> = {
    DeviceTv: <DeviceTv class="tab-icon" />,
    Headphones: <Headphones class="tab-icon" />,
    Download: <Download class="tab-icon" />,
    Adjustments: <Adjustments class="tab-icon" />,
  };  // 每次popup打开时加载最新配置
  onMounted(async () => {
    console.log('useLayoutComponents mounted, loading configuration...');
    try {
      await loadConfig();
      isConfigLoaded.value = true;
      console.log('Configuration loaded successfully for popup:', JSON.stringify(layoutConfig, null, 2));
    } catch (error) {
      console.error('Failed to load configuration for popup:', error);
      isConfigLoaded.value = true; // 即使失败也要标记为已加载，使用默认配置
    }
  });

  // 根据配置生成组件结构
  const components = computed(() => {
    console.log('---Computing components, isConfigLoaded:', isConfigLoaded.value, 'tabs length:', layoutConfig.tabs.length);
    
    if (!isConfigLoaded.value || !layoutConfig.tabs.length) {
      console.log('---Config not loaded or no tabs, returning empty array');
      return [];
    }return layoutConfig.tabs
      .filter((tab: TabConfig) => tab.visible)
      .map((tab: TabConfig) => {
        // 为特殊标签页提供自定义内容
        if (tab.id === 'download') {
          return {
            type: "tab",
            title: (
              <Tooltip>
                <div
                  class="tab-title"
                  v-tooltip={tab.name}
                >
                  {iconMap[tab.icon] || <Download class="tab-icon" />}
                </div>
              </Tooltip>
            ),
            children: [
              {
                type: "component",
                component: <VideoList />,
              },
            ],
          };
        }

        if (tab.id === 'more') {
          return {
            type: "tab",
            title: (
              <Tooltip>
                <div
                  class="tab-title"
                  v-tooltip={tab.name}
                >
                  {iconMap[tab.icon] || <Adjustments class="tab-icon" />}
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
                        component: <More />,
                      },
                    ],
                  },
                ],
              },
            ],
          };
        }

        // 常规标签页根据配置生成
        return {
          type: "tab",
          title: (
            <Tooltip>
              <div
                class="tab-title"
                v-tooltip={tab.name}
              >
                {iconMap[tab.icon] || <DeviceTv class="tab-icon" />}
              </div>
            </Tooltip>
          ),          children: tab.rows
            .filter((row: RowConfig) => row.components.some((comp: ComponentItem) => comp.visible))
            .map((row: RowConfig) => ({
              type: "row",
              style: {
                margin: "30px 0",
                height: "40px",
              },              children: row.components
                .filter((comp: ComponentItem) => comp.visible)
                .map((comp: ComponentItem) => ({
                  type: "container",
                  title: comp.name,
                  showTitle: true,
                  col: comp.colSpan,
                  class: getComponentClass(comp.id),
                  children: [
                    {
                      type: "component",
                      component: componentMap[comp.id] || null,
                    },
                  ],
                }))
            }))        };
      }) as ITabConfig[];
  });

  // 获取组件的特殊样式类
  const getComponentClass = (componentId: string): string | undefined => {
    const proComponents = ['abloop', 'vr', 'record', 'panner', 'pitch', 'delay', 'stereo'];
    return proComponents.includes(componentId) ? 'container-badge-pro' : undefined;
  };

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
