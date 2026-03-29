chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'findShikimoriLinkBySlug') {
        const slug = request.slug;
        const searchUrl = `https://shikimori.io/animes?search=${encodeURIComponent(slug)}`;

		// Функция, которая помогает выводить логи из этого файла в content.js - logToContent("текст сообщения" + переменная);
		function logToContent(message) {
			chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
				if (tabs[0]) {
					chrome.tabs.sendMessage(tabs[0].id, { type: 'log', text: message });
				}
			});
		}

		// Отправка запроса на сайт шикимори с переменной searchUrl
        fetch(searchUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': navigator.userAgent,
                'Accept': 'text/html'
            }
        })
		
		// Обработка ответа со стороны сервера
        .then(response => {
            if (!response.ok) throw new Error(`${response.status}`);
            return response.text();
        })
		
		// Основное тело кода
        .then(html => {
            // --- МЕТОД 1: Поиск по тегу <a> ---
            
            let startIndex = 0;
            let foundLinks = [];

            // Цикл для поиска ВСЕХ ссылок, а не только первой
            while (true) {
                // 1. Ищем начало тега <a>
                const aTagStart = html.indexOf('<a ', startIndex);
                if (aTagStart === -1) break; // Если тегов <a> больше нет, выходим

                // 2. Ищем конец тега </a>
                const aTagEnd = html.indexOf('</a>', aTagStart);
                if (aTagEnd === -1) break;

                // 3. Извлекаем весь код тега <a ...>...</a>
                const aTagCode = html.substring(aTagStart, aTagEnd + 4);

                // 4. Проверяем, есть ли в этом теге нужный нам URL
                if (aTagCode.includes('https://shikimori.io/animes/')) {
                    // 5. Извлекаем саму ссылку из href="..."
                    const hrefStart = aTagCode.indexOf('href="') + 6;
                    const hrefEnd = aTagCode.indexOf('"', hrefStart);
                    
                    if (hrefStart !== -1 && hrefEnd !== -1) {
                        const link = aTagCode.substring(hrefStart, hrefEnd);
                        // Проверяем, что это не страница поиска/пагинации и что ссылка заканчивается на slug
                        if (!link.includes('?search=') && !link.includes('/page/') && link.endsWith(slug)) {
                            sendResponse({ success: true, url: link });
                            return; // Выходим, так как мы нашли то, что нужно
                        }
                    }
                }
                // Сдвигаем старт поиска на следующий символ после текущего тега <a>
                startIndex = aTagEnd + 4;
            }
        })
        return true;
    }
});