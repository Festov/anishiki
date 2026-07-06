const CONFIG = {
    USER_AGENT: 'Anishiki/2.0 (github.com/Festov/anishiki)',
    ANILIBRIA_ORIGIN: 'https://anilibria.top',
    ANILIBRIA_API: 'https://anilibria.top/api/v1',
    SHIKIMORI_ORIGIN: 'https://shikimori.io',
    SHIKIMORI_API: 'https://shikimori.io/api/animes',
};

function normalizeTitle(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[!?.…:;,«»"'()[\]{}]/g, ' ')
        .replace(/[-–—_/]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function slugFromPathSegment(segment) {
    return String(segment || '').split('-').slice(1).join('-');
}

function buildAnilibriaUrl(alias) {
    return `${CONFIG.ANILIBRIA_ORIGIN}/anime/releases/release/${alias}/episodes`;
}

function buildShikimoriUrl(anime) {
    if (!anime?.url) {
        return null;
    }

    return anime.url.startsWith('http')
        ? anime.url
        : `${CONFIG.SHIKIMORI_ORIGIN}${anime.url}`;
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': CONFIG.USER_AGENT,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return null;
    }

    return response.json();
}

async function getAnilibriaRelease(alias) {
    if (!alias) {
        return null;
    }

    return fetchJson(`${CONFIG.ANILIBRIA_API}/anime/releases/${encodeURIComponent(alias)}`);
}

async function searchAnilibria(query) {
    if (!query) {
        return [];
    }

    const results = await fetchJson(
        `${CONFIG.ANILIBRIA_API}/app/search/releases?query=${encodeURIComponent(query)}&limit=8`
    );

    return Array.isArray(results) ? results : [];
}

async function searchShikimori(query) {
    if (!query) {
        return [];
    }

    const results = await fetchJson(
        `${CONFIG.SHIKIMORI_API}?search=${encodeURIComponent(query)}&limit=8`
    );

    return Array.isArray(results) ? results : [];
}

async function getShikimoriAnime(animeId) {
    if (!animeId) {
        return null;
    }

    return fetchJson(`${CONFIG.SHIKIMORI_API}/${animeId}`);
}

function scoreShikimoriCandidate(anime, hints) {
    const urlSlug = slugFromPathSegment(anime.url?.split('/').pop());
    let score = 0;

    if (hints.slug && urlSlug === hints.slug) {
        score += 100;
    } else if (hints.slug && urlSlug.includes(hints.slug)) {
        score += 60;
    }

    const names = [
        anime.name,
        anime.russian,
        ...(anime.english || []),
        ...(anime.japanese || []),
        ...(anime.synonyms || []),
    ].filter(Boolean);

    for (const hint of hints.titles || []) {
        const normalizedHint = normalizeTitle(hint);
        if (!normalizedHint) {
            continue;
        }

        for (const name of names) {
            const normalizedName = normalizeTitle(name);
            if (normalizedName === normalizedHint) {
                score += 80;
            } else if (normalizedName.includes(normalizedHint) || normalizedHint.includes(normalizedName)) {
                score += 40;
            }
        }
    }

    if (hints.year && anime.aired_on?.startsWith(String(hints.year))) {
        score += 10;
    }

    return score;
}

function scoreAnilibriaCandidate(release, hints) {
    let score = 0;

    if (hints.slug && release.alias === hints.slug) {
        score += 100;
    } else if (hints.slug && release.alias?.includes(hints.slug)) {
        score += 60;
    }

    const names = [
        release.name?.main,
        release.name?.english,
        release.name?.alternative,
    ].filter(Boolean);

    for (const hint of hints.titles || []) {
        const normalizedHint = normalizeTitle(hint);
        if (!normalizedHint) {
            continue;
        }

        for (const name of names) {
            const normalizedName = normalizeTitle(name);
            if (normalizedName === normalizedHint) {
                score += 80;
            } else if (normalizedName.includes(normalizedHint) || normalizedHint.includes(normalizedName)) {
                score += 40;
            }
        }
    }

    if (hints.year && release.year === hints.year) {
        score += 10;
    }

    return score;
}

function pickBestCandidate(items, scoreFn) {
    if (!items.length) {
        return null;
    }

    const ranked = items
        .map((item) => ({ item, score: scoreFn(item) }))
        .sort((left, right) => right.score - left.score);

    if (ranked[0].score <= 0) {
        return ranked[0].item;
    }

    return ranked[0].item;
}

async function resolveShikimoriLink({ slug }) {
    const release = await getAnilibriaRelease(slug);
    const hints = {
        slug,
        year: release?.year,
        titles: [
            release?.name?.english,
            release?.name?.main,
            release?.name?.alternative,
            slug.replace(/-/g, ' '),
        ].filter(Boolean),
    };

    const queries = [...new Set([slug, hints.titles[0], hints.titles[1]].filter(Boolean))];
    const candidates = [];

    for (const query of queries) {
        const results = await searchShikimori(query);
        candidates.push(...results);
    }

    const uniqueCandidates = [...new Map(candidates.map((item) => [item.id, item])).values()];
    const bestMatch = pickBestCandidate(uniqueCandidates, (item) => scoreShikimoriCandidate(item, hints));
    const url = buildShikimoriUrl(bestMatch);

    if (!url) {
        throw new Error('Shikimori release not found');
    }

    return { url, label: 'Шикимори' };
}

async function resolveAnilibriaLink({ slug, animeId }) {
    const directRelease = slug ? await getAnilibriaRelease(slug) : null;
    if (directRelease?.alias) {
        return {
            url: buildAnilibriaUrl(directRelease.alias),
            label: 'AniLiberty',
        };
    }

    const shikimoriAnime = animeId ? await getShikimoriAnime(animeId) : null;
    const hints = {
        slug,
        year: shikimoriAnime?.aired_on ? Number(shikimoriAnime.aired_on.slice(0, 4)) : null,
        titles: [
            shikimoriAnime?.name,
            shikimoriAnime?.russian,
            ...(shikimoriAnime?.english || []),
            ...(shikimoriAnime?.synonyms || []),
            slug?.replace(/-/g, ' '),
        ].filter(Boolean),
    };

    const queries = [...new Set([slug, ...hints.titles].filter(Boolean))];
    const candidates = [];

    for (const query of queries) {
        const results = await searchAnilibria(query);
        candidates.push(...results);
    }

    const uniqueCandidates = [...new Map(candidates.map((item) => [item.id, item])).values()];
    const bestMatch = pickBestCandidate(uniqueCandidates, (item) => scoreAnilibriaCandidate(item, hints));

    if (!bestMatch?.alias) {
        throw new Error('Anilibria release not found');
    }

    return {
        url: buildAnilibriaUrl(bestMatch.alias),
        label: 'AniLiberty',
    };
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action !== 'resolveLink') {
        return;
    }

    const resolver = request.source === 'anilibria'
        ? resolveShikimoriLink(request.payload)
        : resolveAnilibriaLink(request.payload);

    resolver
        .then((result) => sendResponse({ success: true, ...result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));

    return true;
});
