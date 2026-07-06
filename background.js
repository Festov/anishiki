const SHIKIMORI_API = 'https://shikimori.io/api/animes';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action !== 'findShikimoriLinkBySlug') {
        return;
    }

    const slug = request.slug?.trim();
    if (!slug) {
        sendResponse({ success: false, error: 'Slug is empty' });
        return;
    }

    const apiUrl = `${SHIKIMORI_API}?search=${encodeURIComponent(slug)}&limit=5`;

    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'Anishiki Chrome Extension',
            'Accept': 'application/json',
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then((animes) => {
            if (!Array.isArray(animes) || animes.length === 0) {
                sendResponse({ success: false, error: 'No results found' });
                return;
            }

            const slugLower = slug.toLowerCase();
            const exactMatch = animes.find(
                (anime) => anime.url && anime.url.toLowerCase().includes(slugLower)
            );
            const anime = exactMatch || animes[0];
            const url = `https://shikimori.io${anime.url}`;

            sendResponse({ success: true, url });
        })
        .catch((error) => {
            sendResponse({ success: false, error: error.message });
        });

    return true;
});
