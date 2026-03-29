// ==UserScript==
// @name         Anilibria to Shikimori Widget
// @match        https://anilibria.top/anime/releases/release/*
// @grant        none
// @author       Festov
// ==/UserScript==
console.log('%cСкрипт расширения запущен.', 'color: blue;');
(function() {
    const path = window.location.pathname;
	console.log(path);
    const anilibriaSlugParts = path.split('/');
	const anilibriaSlug = anilibriaSlugParts[4];

    // --- ФУНКЦИЯ: Создаем плавающую кнопку ---
    function createFloatingButton(url) {
        // Проверяем, не создана ли кнопка уже
        if (document.getElementById('shiki-widget-btn')) return;

        // 1. Создаем саму кнопку
        const button = document.createElement('a');
        button.id = 'shiki-widget-btn';
        button.href = url;
        button.textContent = 'S';
        button.target = '_blank';
        
        // 2. Добавляем стили
        button.style.cssText = `
            position: fixed;
            z-index: 9999;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            line-height: 50px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: white !important;
            background-color: #E53935;
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            text-decoration: none;
            opacity: 0.9;
            transition: opacity 0.3s, transform 0.3s;
        `;

        // 3. Добавляем эффект при наведении
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
            button.style.transform = 'scale(1.05)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '0.9';
            button.style.transform = 'scale(1)';
        });

        // 4. Добавляем кнопку на страницу
        document.body.appendChild(button);
    }

    // --- ФУНКЦИЯ: Удаляем кнопку (на случай ошибки) ---
    function removeFloatingButton() {
        const btn = document.getElementById('shiki-widget-btn');
        if (btn) btn.remove();
    }
	
	function createStatus(linkshiki) {
		console.log('%cПоиск блока для добавления ссылки', 'color: teal;');
		setTimeout(addCustomChip, 1000); // Задержка в 1 секунду
		function addCustomChip() {
		// Проверяем, появился ли нужный контейнер
		const container = document.querySelector('.d-flex.align-center.mb-3');
    
		if (!container) {
			console.warn('%cМесто не найдено.', 'color: orange;');
		return;
		}
		console.log('%cБлок найден.', 'color: teal;');

		// Находим текущий элемент "Завершен"
		const currentChip = container.querySelector('.v-chip.v-chip--variant-outlined');

		if (!currentChip) {
			console.error('%cЭлемент "Завершен" не найден.', 'color: red;');
		return;
		}
		// console.log('%cЭлемент "Завершен" найден.', 'color: teal;', currentChip);

		// Создаем новый элемент
		const newChip = document.createElement('span');
		newChip.classList.add(
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
		'custom-status' // Уникальный класс для отслеживания
		);
		newChip.draggable = false;

		// Внутренняя структура чипа
		newChip.innerHTML = `
		<span class="v-chip__underlay"></span>
		<div class="v-chip__content" data-no-activator="">
		<span><a href='${linkshiki}' style="text-decoration: none; color: inherit;" target="_blank">Шикимори</a></span>
		</div>
		`;
		console.log('%cНовый элемент создан.', 'color: teal;');

		// Добавляем новый элемент после текущего
		container.insertBefore(newChip, currentChip.nextSibling);
		}
};


    // --- ЛОГИКА РАБОТЫ СКРИПТА ---
    removeFloatingButton(); // Убираем старую кнопку, если есть
    chrome.runtime.sendMessage(
        { action: 'findShikimoriLinkBySlug', slug: anilibriaSlug },
        function(response) {
            if (response && response.success) {
                // createFloatingButton(response.url); // Создаем кнопку
				console.log('%cСериал найден на Shikimori:', 'color: red;', response.url);
				createStatus(response.url);
            } else {
                console.log('Не удалось найти сериал на Shikimori.', response?.error);
            }
        }
    );
    // Слушаем логи из background.js
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'log') {
            console.log(`${msg.text}`);
        }
    });
})();

/////////////////////////////////////