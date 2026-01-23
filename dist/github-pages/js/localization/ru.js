// Russian translations
const ru = {
    // Game title and instructions
    game: {
        title: "Заголовки",
        instructions: "Меняйте буквы местами, чтобы восстановить заголовок новости!<br>Кликните по двум буквам, чтобы поменять их местами.<br>Подсказка ниже - это намек на заголовок статьи."
    },
    
    // UI elements
    ui: {
        swaps: "Ходы",
        moves: {
            one: "ход",
            few: "хода",
            many: "ходов"
        },
        giveUp: "Сдаться",
        nextHeadline: "Дальше",
        replay: "Играть снова",
        readFullArticle: "Читать статью полностью",
        newHeadline: "Дальше",
        ok: "OK",
        cancel: "Отмена"
    },
    
    // Color legend
    legend: {
        correct: "Верная позиция",
        wrongPosition: "Неверная позиция",
        connectedWord: "В соседнем слове",
        otherWord: "В другом слове",
        // Shorter versions for when legend wraps to multiple lines
        correctShort: "Верно",
        wrongPositionShort: "В этом слове",
        connectedWordShort: "В соседнем",
        otherWordShort: "Другое"
    },
    
    // Victory modal
    victory: {
        title: "Поздравляем!",
        subtitle: "Вы верно воссоздали заголовок!",
        headlineLabel: "ВОССТАНОВЛЕННЫЙ ЗАГОЛОВОК",
        articlePrompt: "Прочитайте полную статью, чтобы узнать заголовок целиком",
        customPuzzlePrompt: "Вы можете испытать друга, создав собственную головоломку",
        createOwnPuzzle: "Создать свой паззл",
        stats: {
            swaps: {
                one: "ХОД",
                few: "ХОДА",
                many: "ХОДОВ"
            },
            rating: "РЕЙТИНГ"
        },
        ratings: {
            perfect: "ИДЕАЛЬНО",
            excellent: "ОТЛИЧНО",
            good: "ХОРОШО",
            fair: "УДОВЛЕТВОРИТЕЛЬНО",
            complete: "ЗАВЕРШЕНО"
        },
        tooltips: {
            perfect: "🏆 Идеально! Вы достигли максимального рейтинга в 5 звезд!",
            earned: {
                one: "🌟 Вы заработали 1 звезду, завершив за {swaps} {swapsWord}!<br>⭐ Получите {nextStars} звезды, завершив за {threshold} {thresholdWord} или меньше",
                few: "🌟 Вы заработали {stars} звезды, завершив за {swaps} {swapsWord}!<br>⭐ Получите {nextStars} звезды, завершив за {threshold} {thresholdWord} или меньше",
                many: "🌟 Вы заработали {stars} звезд, завершив за {swaps} {swapsWord}!<br>⭐ Получите {nextStars} звезд, завершив за {threshold} {thresholdWord} или меньше"
            },
            getStars: {
                one: "⭐ Получите 1 звезду, завершив головоломку за {requiredSwaps} {requiredSwapsWord} или меньше",
                few: "⭐ Получите {starIndex} звезды, завершив головоломку за {requiredSwaps} {requiredSwapsWord} или меньше",
                many: "⭐ Получите {starIndex} звезд, завершив головоломку за {requiredSwaps} {requiredSwapsWord} или меньше"
            },
            getOneStar: "⭐ Получите {starIndex} звезду, завершив головоломку"
        }
    },
    
    // Difficulty levels
    difficulty: {
        easy: {
            name: "Легчайше",
            description: "Только перестановка слов"
        },
        mediumEasy: {
            name: "Полегче",
            description: "40% зеленых максимум"
        },
        medium: {
            name: "Средне",
            description: "30% зеленых максимум"
        },
        mediumHard: {
            name: "Труднее",
            description: "20% зеленых максимум"
        },
        hard: {
            name: "Сложно",
            description: "15% зеленых максимум"
        }
    },
    
    // News categories
    category: {
        all: {
            name: "Все",
            description: "Все категории новостей"
        },
        general: {
            name: "Общие",
            description: "Общие новости"
        },
        economy: {
            name: "Экономика",
            description: "Бизнес и финансы"
        },
        technology: {
            name: "Технологии",
            description: "Технологии и инновации"
        },
        sports: {
            name: "Спорт",
            description: "Спортивные новости"
        }
    },
    
    // Debug panel
    debug: {
        toggleHint: "Нажмите 'D' чтобы переключить отладку",
        title: "🔧 Отладочная информация",
        close: "×",
        sections: {
            currentHeadline: "Текущий заголовок",
            layoutGeneration: "Генерация сетки",
            shuffleDifficulty: "Перемешивание и сложность",
            headlineManagement: "Управление заголовками",
            alternativeHeadlines: "Альтернативные заголовки",
            compatibility: "Анализ совместимости",
            testCaseHTML: "HTML код тестового случая",
            testCaseJS: "JavaScript код тестового случая"
        },
        difficulty: "Сложность:",
        autoWin: "🏆 Авто-победа (Отладка)"
    },
    
    // Tooltips and hints
    hints: {
        tipPrefix: "💡 Подсказка:",
        hintTitle: "Подсказка"
    },
    
    // Toolbar tooltips
    toolbar: {
        menu: "Меню",
        howToPlay: "Как играть",
        nextPuzzle: "Следующий пазл",
        createOwnPuzzle: "Создать свой пазл"
    },
    
    // Menu items
    menu: {
        title: "Меню",
        language: "Язык",
        difficulty: "Сложность",
        category: "Категория",
        statistics: "Статистика",
        sound: "Звук",
        help: "Помощь",
        giveUp: "Сдаться",
        giveUpDescription: "Открывает решение",
        nextPuzzle: "Следующий пазл",
        nextPuzzleDescription: "Загрузить следующий заголовок",
        createOwnPuzzle: "Создай свой пазл",
        createOwnPuzzleDescription: "Испытай друга"
    },
    
    // Loading messages
    loading: {
        fetchingHeadlines: "Загрузка свежих заголовков...",
        fetchingSubtext: "Может занять несколько секунд"
    },
    
    // Tutorial
    tutorial: {
        welcome: {
            title: "Как играть?",
            content: "Ваша задача — разгадать **заголовок** по его **описанию под игровым полем**. Сейчас  буквы перемешаны. Но когда вы **правильно** их расставите они все станут **зелёными**.![Восстановленное слово](imgs/ex_green_ru.png)\n\n---\n\nБуквы находящиеся **в правильном слове**, но **не на своих местах** отображаюится **оранжевыми**.\nЧтобы **поменять местами** две буквы **тапните** по очереди по каждой из них.\n![Тапните по двум буквам](imgs/ex_ornage_ru.png)\n\n ---\n\nБуквы находящиеся **в пересекающемся слове** отображаются **фиолетовым**. А **серым** закрашены буквы принадлежащие совсем **другому слову**.\n![Остальные цвета](imgs/ex_misc_ru.png)\n\n ---\n\nИспользуйте **логику** и **подсказку**, чтобы разгадать заголовок за как можно меньшее число ходов.",
            buttonText: "Понятно"
        }
    },

    // Create Puzzle Page
    createPuzzle: {
        title: "Создать паззл",
        subtitle: "Создайте собственную головоломку для друзей.",
        headlineLabel: "Скрытый заголовок (собственно головоломка)",
        headlineHint: "Минимум 5 слов, по 4+ буквы каждое. Знаки препинания и эмодзи будут игнорированы.",
        headlinePlaceholder: "например, Пираты Карибского моря: Проклятие Черной жемчужины",
        wordAnalysisLabel: "АНАЛИЗ СЛОВ:",
        hintLabel: "Контекстная подсказка",
        hintHint: "Подсказка, показываемая игроку. <strong>Должна содержать минимум в 2 раза больше слов, чем в заголовке.</strong>",
        hintPlaceholder: "например, Захватывающий приключенческий фильм о проклятых пиратах, которые должны снять древнее проклятие, найдя потерянные кусочки ацтекского золота до того, как луна станет полной",
        difficultyLabel: "Сложность",
        difficultyHint: "Выберите, насколько сложным будет паззл для решающего.",
        verifyButton: "Проверить и создать превью",
        backButton: "Вернуться к игре",
        previewTitle: "Кроссворд и ссылка успешно созданы",
        statsWords: "Слов:",
        statsLanguage: "Язык:",
        statsDifficulty: "Сложность:",
        unsolvedGridTitle: "Неразгаданный паззл со сложностью {difficulty}",
        solvedGridTitle: "Решённый паззл",
        createLinkButton: "Создать ссылку на паззл",
        shareLabel: "Поделитесь этой ссылкой:",
        copyButton: "Скопировать ссылку",
        previewHeader: "Превью",
        previewDisclaimer: "Это один из примеров раскладки, созданной для вашего устройства. Фактическая раскладка головоломки может отличаться на разных устройствах в зависимости от размера экрана и соотношения сторон.",
        toastCopied: "Скопировано в буфер обмена!",
        errors: {
            minWords: "Нужно минимум {count} слов (сейчас: {current}). Продолжайте печатать!",
            shortWords: "Найдено {count} слов(а), которые слишком короткие (отмечены КРАСНЫМ выше). Все слова должны содержать 4+ буквы.",
            mixedLanguages: "Нельзя смешивать английские и русские буквы.",
            noHint: "Пожалуйста, предоставьте подсказку.",
            hintTooShort: "Подсказка слишком короткая: {hintWords} слов. Нужно минимум {required} (2× заголовок).",
            layoutFailed: "Не удалось создать раскладку кроссворда. Попробуйте другие слова или порядок слов."
        },
        language: {
            english: "АНГЛИЙСКИЙ",
            russian: "Русский",
            mixed: "СМЕШАННЫЙ/НЕВЕРНЫЙ"
        }
    },

    // Puzzle Error (for custom puzzle loading failures)
    puzzleError: {
        title: "Ошибка пазла",
        corruptedLink: "Ссылка на пазл может быть повреждена или недействительна.<br>Пожалуйста, попросите человека, который вам её отправил, отправить ссылку заново.<br>А пока вы можете просто поиграть в Заголовки.",
        startRegularGame: "Начать обычную игру"
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.ru = ru;
}
