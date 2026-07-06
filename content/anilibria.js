(function () {
    const RELEASE_PATH_RE = /^\/anime\/releases\/release\/([^/]+)/;

    function getSlug() {
        const match = window.location.pathname.match(RELEASE_PATH_RE);
        return match?.[1] ?? null;
    }

    function createChip(url, label) {
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
            Anishiki.LINK_CLASS,
            'anishiki-link--chip',
        ].join(' ');

        const underlay = document.createElement('span');
        underlay.className = 'v-chip__underlay';

        const content = document.createElement('div');
        content.className = 'v-chip__content';

        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;

        content.appendChild(link);
        chip.appendChild(underlay);
        chip.appendChild(content);

        return chip;
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

    async function insertChip(url, label) {
        try {
            const container = await Anishiki.waitForElement('.d-flex.align-center.mb-3');
            const statusChip = container.querySelector('.v-chip.v-chip--variant-outlined');

            if (!statusChip) {
                throw new Error('Status chip not found');
            }

            container.insertBefore(createChip(url, label), statusChip.nextSibling);
        } catch (_error) {
            document.body.appendChild(createFallbackButton(url, label));
        }
    }

    async function init() {
        const slug = getSlug();
        if (!slug) {
            return;
        }

        try {
            const link = await Anishiki.requestLink('anilibria', { slug });
            await insertChip(link.url, link.label);
        } catch (error) {
            console.warn('[Anishiki]', error.message);
        }
    }

    init();
    Anishiki.watchNavigation(init);
})();
