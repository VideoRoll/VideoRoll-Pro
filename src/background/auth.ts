export async function getUser() {
    return chrome.storage.sync.get("accessToken");
    // Create a single supabase client for interacting with your database
    chrome.cookies.get(
        {
            url: "http://localhost:3000/",
            name: "sb-cvsunicdltfduyijjnlo-auth-token.1",
        },
        async (res) => {
            console.log(res, "res");
        }
    );
}

export function injectSignin() {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info, tab) {
        if (info.status === "complete" && tab.url?.startsWith('http://localhost:3000/signin')) {
            chrome.tabs.onUpdated.removeListener(listener);

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    window.addEventListener("message", function (event) {
                        if (event.data.type === "authResult") {
                            chrome.runtime.sendMessage(event.data);
                        }
                    });
                },
            });
        }
    });
}
