export async function getUser() {
    // Create a single supabase client for interacting with your database
    chrome.cookies.get(
        { url: "http://localhost:3000/", name: "sb-cvsunicdltfduyijjnlo-auth-token.1" },
        async (res) => {
            console.log(res, 'res')
        }
    );
}
