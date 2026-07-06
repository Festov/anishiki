const Anishiki = {
    LINK_CLASS: 'anishiki-link',

    requestLink(source, payload) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'resolveLink', source, payload }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (!response?.success) {
                    reject(new Error(response?.error || 'Link not found'));
                    return;
                }

                resolve(response);
            });
        });
    },

    waitForElement(selector, timeout = 12000) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(selector);
            if (existing) {
                resolve(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (!element) {
                    return;
                }

                observer.disconnect();
                resolve(element);
            });

            observer.observe(document.documentElement, { childList: true, subtree: true });

            window.setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element not found: ${selector}`));
            }, timeout);
        });
    },

    waitForCondition(getValue, timeout = 12000) {
        return new Promise((resolve, reject) => {
            const initial = getValue();
            if (initial) {
                resolve(initial);
                return;
            }

            const observer = new MutationObserver(() => {
                const value = getValue();
                if (!value) {
                    return;
                }

                observer.disconnect();
                resolve(value);
            });

            observer.observe(document.documentElement, { childList: true, subtree: true });

            window.setTimeout(() => {
                observer.disconnect();
                reject(new Error('Condition not met'));
            }, timeout);
        });
    },

    removeLinks() {
        document.querySelectorAll(`.${this.LINK_CLASS}`).forEach((node) => node.remove());
    },

    watchNavigation(onChange) {
        let lastPath = `${window.location.pathname}${window.location.search}`;

        const handleChange = () => {
            const currentPath = `${window.location.pathname}${window.location.search}`;
            if (currentPath === lastPath) {
                return;
            }

            lastPath = currentPath;
            this.removeLinks();
            onChange();
        };

        const observer = new MutationObserver(handleChange);
        observer.observe(document.documentElement, { childList: true, subtree: true });

        window.addEventListener('popstate', handleChange);
    },
};
