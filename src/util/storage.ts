import { getDefaultConfig } from "../use";
import { IRollConfig } from "../types/type";
import browser from "webextension-polyfill";
import { getDomain } from "./getDomain";

export function getSessionStorage(tabId: number) {
    let data = JSON.parse(sessionStorage.getItem(`video-roll-${tabId}`) as string);

    if (!data) {
        data = getDefaultConfig();
        setSessionStorage(data);
    }
    
    data.tabId = tabId;
    return data;
}

export async function getLocalStorage(url?: string): Promise<any> {
    const key = `video-roll-${url ?? window.location.href}`;
    return browser.storage.sync.get(key).then((res) => {
        return res?.[key];
    });
}

export function setSessionStorage(config: IRollConfig, newConfig?: IRollConfig) {
    if (!config.url) return;

    sessionStorage.setItem(
        `video-roll-${config.tabId}`,
        JSON.stringify(newConfig ?? config)
    );
}

export function setLocalStorage(config: IRollConfig) {
    browser.storage.sync.set({
        [`video-roll-${config.url}`]: config 
    });
}

export function removeLocalStorage(key: string) {
    browser.storage.sync.remove(key);
}

export function setStorageByKey(config: IRollConfig) {
    const domain = getDomain(config.url);
    if (config.enable === false) {
        return browser.storage.sync.set({
            [`video-roll-disabled-${domain}`]: domain
        });
    }

    return browser.storage.sync.remove(`video-roll-disabled-${domain}`);
}