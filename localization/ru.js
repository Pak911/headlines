// Russian translations
const ru = {
    // Game title and instructions
    game: {
        title: "Заголовки",
        instructions: "Меняйте буквы местами, чтобы восстановить заголовок новости!<br>Кликните по двум буквам, чтобы поменять их местами.<br>Подсказка ниже - это намек на заголовок статьи."
    },
    
    // UI elements
    ui: {
        swaps: "Ходы",        moves: "ходов",        nextHeadline: "Следующий заголовок",
        replay: "Играть снова",
        readFullArticle: "Читать статью полностью",
        newHeadline: "Дальше"
    },
    
    // Color legend
    legend: {
        correct: "Верная позиция",
        wrongPosition: "Неверная позиции",
        connectedWord: "В соседнем слове",
        otherWord: "В другом слове"
    },
    
    // Victory modal
    victory: {
        title: "Поздравляем!",
        subtitle: "Вы верно воссоздали заголовок!",
        headlineLabel: "ВОССТАНОВЛЕННЫЙ ЗАГОЛОВОК",
        stats: {
            swaps: "ХОДЫ",
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
                one: "🌟 Вы заработали {stars} звезду, завершив за {swaps} ходов!<br>⭐ Получите {nextStars} звезды, завершив за {threshold} ходов или меньше",
                twoFour: "🌟 Вы заработали {stars} звезды, завершив за {swaps} ходов!<br>⭐ Получите {nextStars} звезд, завершив за {threshold} ходов или меньше",
                many: "🌟 Вы заработали {stars} звезд, завершив за {swaps} ходов!<br>⭐ Получите {nextStars} звезд, завершив за {threshold} ходов или меньше"
            },
            getStars: {
                one: "⭐ Получите {starIndex} звезду, завершив головоломку за {requiredSwaps} ходов",
                twoFour: "⭐ Получите {starIndex} звезды, завершив головоломку за {requiredSwaps} ходов",
                many: "⭐ Получите {starIndex} звезд, завершив головоломку за {requiredSwaps} ходов"
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
