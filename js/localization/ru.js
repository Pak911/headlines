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
        newHeadline: "Дальше"
    },
    
    // Color legend
    legend: {
        correct: "Верная позиция",
        wrongPosition: "Неверная позиция",
        connectedWord: "В соседнем слове",
        otherWord: "В другом слове"
    },
    
    // Victory modal
    victory: {
        title: "Поздравляем!",
        subtitle: "Вы верно воссоздали заголовок!",
        headlineLabel: "ВОССТАНОВЛЕННЫЙ ЗАГОЛОВОК",
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
        easy: "Легко - Только перестановка слов",
        mediumEasy: "Средне-легко - 40% зеленых максимум",
        medium: "Средне - 30% зеленых максимум",
        mediumHard: "Средне-трудно - 20% зеленых максимум",
        hard: "Трудно - 15% зеленых максимум"
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
        hintTitle: "Описание новости"
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.ru = ru;
}
