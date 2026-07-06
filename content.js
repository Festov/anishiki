(function () {
    const CHIP_CLASS = 'anishiki-shikimori-chip';
    const CONTAINER_SELECTOR = '.d-flex.align-center.mb-3';
    const STATUS_CHIP_SELECTOR = '.v-chip.v-chip--variant-outlined';

    const path = window.location.pathname;
    const anilibriaSlug = path.split('/')[4];

    if (!anilibriaSlug) {
        return;
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
})();
