/*
 * @description: Head
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject, watch } from "vue";
import {
  LogoGithub,
  SettingsSharp,
  StarHalfSharp,
  ChatbubbleEllipses,
} from "@vicons/ionicons5";
import { UserExclamation } from "@vicons/tabler";
import { createURL } from "src/util";
import browser from "webextension-polyfill";
import "./index.less";
import { IRollConfig } from "src/types/type";

export default defineComponent({
  name: "Head",
  props: {
    isShow: Boolean,
  },
  setup(props) {
    const updateEnable = inject("updateEnable") as Function;
    const rollConfig = inject("rollConfig") as IRollConfig;
    const update = inject("update") as Function;
    const user = inject("user") as any;

    const toGithub = () => {
      createURL("https://github.com/gxy5202/VideoRoll");
    };
    const toSettings = () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        createURL(chrome.runtime.getURL("options.html"));
      }
    };

    const toHome = () => {
      createURL("https://videoroll.app");
    };

    const toFeedBack = () => {
      createURL(
        "https://chrome.google.com/webstore/detail/video-roll/cokngoholafkeghnhhdlmiadlojpindm"
      );
    };

    const toIssue = () => {
      createURL("https://github.com/VideoRoll/VideoRoll/issues");
    };

    const toUser = () => {
      createURL(process.env.ENV === 'development' ? "http://127.0.0.1:3001/en/signin" : "https://videoroll.app/en/signin");
    };

    const setEnable = (value: boolean) => {
      rollConfig.enable = value;
      update("enable", rollConfig.enable);
      updateEnable(rollConfig.enable);
    };

    return () => (
      <div class="video-roll-header">
        <div class="video-roll-logo" onClick={toHome}>
          <img class="video-roll-logo-img" src="../../icons/icon_512.png" />
        </div>
        <div class="video-roll-head-right">
          <van-space>
            <div
              class="video-roll-setting-btn"
              v-tooltip={
                rollConfig.enable
                  ? browser.i18n.getMessage("tips_disabled")
                  : browser.i18n.getMessage("tips_enabled")
              }
            >
              <van-switch
                v-model={rollConfig.enable}
                size="12px"
                onChange={setEnable}
              ></van-switch>
            </div>
            <div
              class="video-roll-setting-btn"
              v-tooltip={browser.i18n.getMessage("tips_setting")}
              onClick={toSettings}
            >
              <SettingsSharp class="logo-usd"></SettingsSharp>
            </div>
            <van-divider vertical></van-divider>
            <div class="video-roll-feedback">
              <van-space>
                {/* <div
                                    class="video-roll-setting-btn"
                                    onClick={toFeedBack}
                                    v-tooltip={browser.i18n.getMessage(
                                        "tips_rating"
                                    )}
                                >
                                    <StarHalfSharp class="logo-usd"></StarHalfSharp>
                                </div>
                                <div
                                    class="video-roll-setting-btn"
                                    onClick={toIssue}
                                    v-tooltip={browser.i18n.getMessage(
                                        "tips_feedback"
                                    )}
                                >
                                    <ChatbubbleEllipses class="logo-usd"></ChatbubbleEllipses>
                                </div>
                                <div
                                    class="video-roll-setting-btn"
                                    v-tooltip="github"
                                    onClick={toGithub}
                                >
                                    <LogoGithub class="logo-usd"></LogoGithub>
                                </div> */}
                {user.value ? (
                  <div
                    class="video-roll-setting-btn"
                    onClick={toUser}
                    v-tooltip={browser.i18n.getMessage("tips_user_center")}
                  >
                    <van-image
                      round
                      width="20px"
                      height="20px"
                      src={user.value.user_metadata?.avatar_url}
                    />
                    {/* <UserExclamation class="logo-usd"></UserExclamation> */}
                  </div>
                ) : (
                  <div
                    class="video-roll-setting-btn"
                    onClick={toUser}
                    v-tooltip={browser.i18n.getMessage("tips_login")}
                  >
                    <UserExclamation class="logo-usd"></UserExclamation>
                  </div>
                )}
              </van-space>
            </div>
          </van-space>
        </div>
      </div>
    );
  },
});
