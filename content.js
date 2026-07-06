(function () {
    const CHIP_CLASS = 'anishiki-shikimori-chip';
    const CONTAINER_SELECTOR = '.d-flex.align-center.mb-3';
    const STATUS_CHIP_SELECTOR = '.v-chip.v-chip--variant-outlined';
    const RELEASE_PATH_RE = /^\/anime\/releases\/release\/([^/]+)/;

    function getReleaseSlug() {
        const match = window.location.pathname.match(RELEASE_PATH_RE);
        return match?.[1] ?? null;
    }

    function isReleasePage() {
        return RELEASE_PATH_RE.test(window.location.pathname);
    }

    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(selector);
            if (existing) {
                resolve(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element not found: ${selector}`));
            }, timeout);
        });
    }

    function createShikimoriChip(shikimoriUrl) {
        if (document.querySelector(`.${CHIP_CLASS}`)) {
            return;
        }

        const chip = document.createElement('span');
        chip.className = [
            'v-chip',
            'v-theme--dark',
            'text-white',
            'v-chip--density-default',
            'v-chip--size-small',
            'v-chip--variant-outlined',
            'fz-70',
            'ff-heading',
            'px-2',
            'ml-2',
            CHIP_CLASS,
        ].join(' ');
        chip.draggable = false;

        const underlay = document.createElement('span');
        underlay.className = 'v-chip__underlay';

        const content = document.createElement('div');
        content.className = 'v-chip__content';
        content.dataset.noActivator = '';

        const wrapper = document.createElement('span');

        const link = document.createElement('a');
        link.href = shikimoriUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Шикимори';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';

        wrapper.appendChild(link);
        content.appendChild(wrapper);
        chip.appendChild(underlay);
        chip.appendChild(content);

        return chip;
    }

    async function insertShikimoriChip(shikimoriUrl) {
        try {
            const container = await waitForElement(CONTAINER_SELECTOR);
            const statusChip = container.querySelector(STATUS_CHIP_SELECTOR);

            if (!statusChip) {
                console.warn('[Anishiki] Status chip not found.');
                return;
            }

            const chip = createShikimoriChip(shikimoriUrl);
            if (!chip) {
                return;
            }

            container.insertBefore(chip, statusChip.nextSibling);
        } catch (error) {
            console.warn('[Anishiki] Could not insert chip:', error.message);
        }
    }

    function init() {
        if (!isReleasePage()) {
            return;
        }

        const anilibriaSlug = getReleaseSlug();
        if (!anilibriaSlug) {
            return;
        }

        chrome.runtime.sendMessage(
            { action: 'findShikimoriLinkBySlug', slug: anilibriaSlug },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[Anishiki]', chrome.runtime.lastError.message);
                    return;
                }

                if (response?.success) {
                    insertShikimoriChip(response.url);
                } else {
                    console.warn('[Anishiki] Shikimori link not found:', response?.error);
                }
            }
        );
    }

    init();

    // Anilibria is a Nuxt SPA — re-run when navigating between releases without reload.
    let lastPath = window.location.pathname;
    const navigationObserver = new MutationObserver(() => {
        if (window.location.pathname === lastPath) {
            return;
        }

        lastPath = window.location.pathname;
        document.querySelector(`.${CHIP_CLASS}`)?.remove();
        init();
    });

    navigationObserver.observe(document.body, { childList: true, subtree: true });
})();
