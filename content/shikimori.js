(function () {
    const ANIME_PATH_RE = /^\/animes\/(\d+)(?:-([^/]+))?/;

    function getAnimeMeta() {
        const match = window.location.pathname.match(ANIME_PATH_RE);
        if (!match) {
            return null;
        }

        return {
            animeId: Number(match[1]),
            slug: match[2] || null,
        };
    }

    function findExternalLinksBlock() {
        return [...document.querySelectorAll('.b-animes-menu .block')].find((block) => {
            const title = block.querySelector('.subheadline')?.textContent?.trim() || '';
            return title.includes('На других сайтах');
        });
    }

    function createMenuLink(url, label) {
        const row = document.createElement('div');
        row.className = `b-external_link anilibria b-menu-line ${Anishiki.LINK_CLASS} anishiki-link--menu`;

        const link = document.createElement('a');
        link.className = 'b-link';
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;

        row.appendChild(link);
        return row;
    }

    function createFallbackButton(url, label) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;
        link.className = `${Anishiki.LINK_CLASS} anishiki-link--fallback`;
        link.title = label;
        return link;
    }

    async function insertMenuLink(url, label) {
        try {
            const block = await Anishiki.waitForCondition(findExternalLinksBlock);
            block.appendChild(createMenuLink(url, label));
        } catch (_error) {
            document.body.appendChild(createFallbackButton(url, label));
        }
    }

    async function init() {
        const meta = getAnimeMeta();
        if (!meta) {
            return;
        }

        try {
            const link = await Anishiki.requestLink('shikimori', meta);
            await insertMenuLink(link.url, link.label);
        } catch (error) {
            console.warn('[Anishiki]', error.message);
        }
    }

    init();
    Anishiki.watchNavigation(init);
})();
