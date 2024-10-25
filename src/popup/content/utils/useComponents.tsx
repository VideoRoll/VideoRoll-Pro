/*
 * @description: useComponents
 * @Author: Gouxinyu
 * @Date: 2022-09-11 11:12:50
 */
import { shallowReactive } from 'vue';
import {
    defineAsyncComponent,
} from "vue";
import { DeviceTv, Headphones, List, Adjustments } from '@vicons/tabler'
import browser from 'webextension-polyfill';
import { Tooltip } from 'floating-vue';

interface IConfig {
    type: string;
    title?: JSX.Element | string;
    merge?: boolean;
    style?: Object;
    class?: string;
    children?: any[];
}

interface IComponentConfig extends IConfig {
    type: 'component',
    component: any;
}

interface IContainerConfig extends IConfig {
    type: 'container',
    title?: string,
    col?: number;
    showTitle?: boolean;
    children?: IComponentConfig[] | IRowConfig[]
}

interface IFragmentConfig extends IConfig {
    type: 'fragment',
    col?: number;
    children?: IComponentConfig[] | IRowConfig[]
}

interface IRowConfig extends IConfig {
    type: 'row';
    children: IContainerConfig[] | IFragmentConfig[]
}

interface ISwiperConfig extends IConfig {
    type: 'swiper';
    children: IRowConfig[]
}

interface ITabConfig extends IConfig {
    type: 'tab';
    children: IRowConfig[] | IComponentConfig[]
}

export default function useComponents() {
    const components = shallowReactive<ITabConfig[]>([
        {
            type: 'tab',
            title: <Tooltip><div class="tab-title" v-tooltip={browser.i18n.getMessage('tabs_video')}><DeviceTv class="tab-icon" /></div></Tooltip>,
            children: [{
                type: 'row',
                style: {
                    margin: '30px 0',
                    height: '40px'
                },
                children: [
                    {
                        type: 'container',
                        col: 12,
                        title: browser.i18n.getMessage('video_rotate'),
                        showTitle: true,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/Rotate"))
                        }]
                    },
                    {
                        type: "container",
                        col: 6,
                        title: browser.i18n.getMessage('video_loop'),
                        showTitle: true,
                        children: [
                            {
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Loop"))
                            }
                        ]
                    },
                    {
                        type: "container",
                        col: 6,
                        title: browser.i18n.getMessage('video_pic'),
                        showTitle: true,
                        children: [
                            {
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/PictureInPicture"))
                            }
                        ]
                    }
                ]
            },
            {
                type: 'row',
                style: {
                    margin: '30px 0',
                    height: '40px'
                },
                children: [
                    {
                        type: 'container',
                        title: browser.i18n.getMessage('video_reposition'),
                        showTitle: true,
                        col: 6,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/Repostion"))
                        }]
                    },
                    {
                        type: 'container',
                        col: 6,
                        title: browser.i18n.getMessage('video_stretch'),
                        showTitle: true,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/Stretch"))
                        }]
                    },
                    {
                        type: 'container',
                        col: 6,
                        title: browser.i18n.getMessage('video_flip'),
                        showTitle: true,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/Flip"))
                        }]
                    },
                    {
                        type: 'container',
                        title: browser.i18n.getMessage('video_screenshot'),
                        showTitle: true,
                        col: 6,
                        children: [
                            {
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Capture"))
                            }
                        ]
                    }
                ],
            },
            {
                type: 'row',
                style: {
                    margin: '30px 0',
                    height: '40px'
                },
                children: [
                    {
                        type: 'container',
                        title: browser.i18n.getMessage('video_focus'),
                        class: 'container-badge-pro',
                        showTitle: true,
                        col: 6,
                        children: [
                            {
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Focus"))
                            }
                        ]
                    },
                    {
                        type: 'container',
                        title: browser.i18n.getMessage('video_filter'),
                        class: 'container-badge-pro',
                        showTitle: true,
                        col: 6,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/Filter"))
                        }]
                    },
                    {
                        type: 'container',
                        title: 'QR',
                        showTitle: true,
                        class: 'container-badge-pro',
                        col: 6,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/QR"))
                        }]
                    },
                    {
                        type: 'container',
                        title: 'VR',
                        showTitle: true,
                        class: 'container-badge-pro',
                        col: 6,
                        children: [
                            {
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Vr"))
                            }
                        ]
                    }
                ],
            },
            {
                type: 'row',
                style: {
                    margin: '30px 0',
                    height: '40px'
                },
                children: [
                    {
                        type: 'container',
                        title: 'A-B Loop',
                        showTitle: true,
                        class: 'container-badge-pro',
                        col: 6,
                        children: [
                            {
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/ABLoop"))
                            }
                        ]
                    },
                    {
                        type: 'container',
                        title: 'Separate',
                        showTitle: true,
                        class: 'container-badge-pro',
                        col: 6,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/AdvancedPictureInPicture"))
                        }]
                    },
                    {
                        type: 'container',
                        title: 'History',
                        showTitle: true,
                        class: 'container-badge-pro',
                        col: 6,
                        children: [
                            {
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/History"))
                            }
                        ]
                    },
                    {
                        type: 'container',
                        title: 'Record',
                        showTitle: true,
                        class: 'container-badge-pro',
                        col: 6,
                        children: [
                            {
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Record"))
                            }
                        ]
                    }
                ],
            },
            {
                type: 'row',
                style: {
                    margin: '30px 0',
                    height: '40px'
                },
                children: [
                    {
                        type: 'container',
                        col: 24,
                        title: browser.i18n.getMessage('video_speed'),
                        showTitle: true,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/PlaybackRate"))
                        }]
                    },
                ]
            },
            {
                type: 'row',
                style: {
                    margin: '30px 0',
                    height: '40px'
                },
                children: [
                    {
                        type: 'container',
                        col: 24,
                        title: browser.i18n.getMessage('video_zoom'),
                        showTitle: true,
                        children: [{
                            type: 'component',
                            component: defineAsyncComponent(() => import("../components/Zoom"))
                        }]
                    },
                ]
            }
            ]
        },
        {
            type: 'tab',
            title: <Tooltip><div class="tab-title" v-tooltip={browser.i18n.getMessage('tabs_audio')}><Headphones class="tab-icon" /></div></Tooltip>,
            children: [
                {
                    type: 'row',
                    style: {
                        margin: '30px 0',
                        height: '40px'
                    },
                    children: [
                        {
                            type: 'container',
                            title: browser.i18n.getMessage('audio_muted'),
                            showTitle: true,
                            col: 24,
                            children: [{
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Mute"))
                            }]
                        },
                    ]
                },
                {
                    type: 'row',
                    style: {
                        margin: '30px 0',
                        height: '40px'
                    },
                    children: [
                        {
                            type: 'container',
                            title: browser.i18n.getMessage('audio_volume'),
                            showTitle: true,
                            col: 24,
                            children: [{
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Volume"))
                            }]
                        },
                    ]
                },
                {
                    type: 'row',
                    style: {
                        margin: '30px 0',
                        height: '40px'
                    },
                    children: [
                        {
                            type: 'container',
                            title: browser.i18n.getMessage('audio_pitch'),
                            class: 'container-badge-pro',
                            showTitle: true,
                            col: 24,
                            children: [{
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Pitch"))
                            }]
                        },
                    ]
                },
                {
                    type: 'row',
                    style: {
                        margin: '30px 0',
                        height: '40px'
                    },
                    children: [
                        {
                            type: 'container',
                            title: 'Sync',
                            class: 'container-badge-pro',
                            showTitle: true,
                            col: 24,
                            children: [{
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/Sync"))
                            }]
                        },
                    ]
                }
            ]
        },
        {
            type: 'tab',
            title: <Tooltip><div class="tab-title" v-tooltip={browser.i18n.getMessage('tabs_list')}><List class="tab-icon" /></div></Tooltip>,
            children: [
                {
                    type: 'component',
                    component: defineAsyncComponent(() => import("../components/VideoList"))
                }
            ]
        },
        {
            type: 'tab',
            title: <Tooltip><div class="tab-title" v-tooltip={browser.i18n.getMessage('tabs_more')}><Adjustments class="tab-icon" /></div></Tooltip>,
            children: [
                {
                    type: 'row',
                    style: {
                        margin: '30px 0',
                        height: '100px'
                    },
                    children: [
                        {
                            type: 'fragment',
                            col: 24,
                            children: [{
                                type: 'component',
                                component: defineAsyncComponent(() => import("../components/More"))
                            }]
                        },
                    ]
                }
            ]
        }
    ]);

    return components;
}

export { ITabConfig, ISwiperConfig, IRowConfig, IComponentConfig, IContainerConfig, IFragmentConfig, IConfig }