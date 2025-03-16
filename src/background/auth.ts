export async function getUser() {
    const user = await chrome.storage.local.get("user");
    if (!user) {
        return Promise.resolve(null);
    }

    return Promise.resolve(user);
    // Create a single supabase client for interacting with your database
    // chrome.cookies.get(
    //     {
    //         url: "http://localhost:3000/",
    //         name: "sb-cvsunicdltfduyijjnlo-auth-token.1",
    //     },
    //     async (res) => {
    //         console.log(res, "res");
    //     }
    // );
}

export function injectAuth() {
    function get() {
        window.addEventListener("message", function (event) {
            if (event.data.type === "videoroll-auth-signin") {
                if (event.data.data.user) {
                    chrome.storage.local.set({
                        user: event.data.data.user,
                    });
                }
            } else if (event.data.type === "videoroll-auth-signout") {
                chrome.storage.local.remove("user");
            }
        });
    }

    chrome.tabs.onUpdated.addListener(function listener(tabId, info, tab) {
        if (
            info.status === "complete" &&
            tab.url?.startsWith("http://localhost:4101")
        ) {
            // chrome.tabs.onUpdated.removeListener(listener);
            console.log(tab, "---");
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: get,
            });
        }
    });

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        const { tabId } = activeInfo;

        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: get,
        });
    });
}
