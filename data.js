// Default language configuration
const defaultLanguageConfig = {
    // Set to 'auto' to detect browser language, or specify 'en' or 'ru'
    defaultLanguage: 'ru'
};

// RSS language configuration - controls which RSS sources to use
// Options: 'auto' (detect from UI language), 'ru' (Russian RSS), 'en' (English RSS)
const rssLanguageConfig = {
    rssLanguage: 'auto'  // Set to Russian by default as requested
};

// Debug configuration - controls debug mode and logging
const debugConfig = {
    enabled: false  // Set to true to enable debug mode and logging
};

// Crossword Engine Configuration (Smart Backbone-First Algorithm)
const crosswordEngineConfig = {
    // Phase 1: Matchmaker - Find best word pairs for backbone
    bridgeWeight: 50,           // Bonus for pairs with high bridge potential
    lengthBonus: 10,            // Bonus for longer word pairs
    
    // Phase 2: Backbone Generation
    variantsToTry: 100,         // How many backbones to try filling (affects quality vs speed)
    squarenessWeight: 2,        // Penalty for non-square grids (difference between width/height)
    
    // Phase 3: Beam Search Fill
    beamWidth: 10,              // Number of states to keep in beam search (higher = better but slower)
    timeLimit: 300,             // Maximum time to spend generating layout (ms)
    
    // Final Scoring
    finalCompactness: 0.4,      // Penalty per unit of area (width × height) - lower values prefer compact grids
    finalUnusedWeight: 300,     // Heavy penalty for unused words (ensures all words are placed)
    
    // Final Selection - Weighted Random from Top Variants
    finalVariantCount: 5,       // Number of top-scoring variants to choose from using weighted probability
                                // Higher scores have higher chance, but adds variety to grid layouts
                                // Set to 1 to always pick the best variant (deterministic)
                                // Different users will likely get different grids from same word bag
    
    // Intersection Bonuses (non-linear rewards for well-connected words)
    // [1 intersection, 2 intersections, 3 intersections, 4 intersections, 5+ intersections]
    intersectionWeights: [10, 20, 40, 80, 150]
};

// Headline Scoring Configuration
const headlineScoringConfig = {
    // Word count constraints
    minWords: 4,           // Minimum words required after filtering
    maxWords: 15,           // Maximum words for optimal score
    idealMinWords: 4,      // Ideal minimum word count
    idealMaxWords: 10,      // Ideal maximum word count
    
    // Word length filtering
    minWordLength: 4,      // Words with 3 letters or less are filtered out
    
    // Scoring penalties
    filteredWordPenalty: -1,    // Penalty for each filtered word (stop words, short words)
    wordCountPenalty: -1,       // Penalty for each word above/below ideal range
    noDescriptionPenalty: -999, // Severe penalty for headlines without description
    
    // Stop words and trash words to exclude
    stopWords: [
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
        'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
        'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
        'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
        'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
        'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
        'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
        'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
        'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
        'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
        'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
        'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what',
        'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with',
        'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
        // Custom additions for news headlines
        'says', 'said', 'will', 'may', 'might', 'new', 'latest'
    ],
    
    // RSS parsing configuration
    rssConfig: {
        minWordLengthForParsing: 2,  // Minimum word length during RSS parsing
        skipWordsInParsing: ['THE', 'AND', 'OR', 'BUT', 'FOR', 'NOR', 'SO', 'YET', 'A', 'AN', 'И', 'В', 'НА', 'С', 'ПО', 'К', 'О', 'ТО', 'ТАКЖЕ', 'ТАК', 'НЕ', 'НИ', 'ЧТО', 'КАК', 'КТО', 'ГДЕ', 'КОГДА', 'ПОЧЕМУ', 'ЗАЧЕМ'], // Words to skip during parsing
        defaultCount: 10,            // Default number of headlines to fetch per source
        cacheTimeout: 300000,        // Cache timeout in milliseconds (5 minutes)
        loadingAnimationDelay: 300,  // Show loading animation after 5ms (for debugging)
        fetchDelay: 0              // Delay before starting RSS fetch (for debugging)
    }
};

// Difficulty system configuration
let currentDifficulty = 'medium'; // Default difficulty - hardest level with big hint (description)

// Difficulty Settings:
// - minSwaps: Minimum number of swaps to ensure puzzle complexity
// - maxSwaps: Hard limit (60) - algorithm stops here even if maxGreenPercentage not reached, but usually stops earlier when target is achieved
// - maxGreenPercentage: Target percentage of correct (green) letters after scrambling
// - intersectionGreenPercentage: Target percentage of crossroad/intersection letters that should remain correct (green)
const difficultySettings = {
    easy: { 
        name: 'Easy - Word Shuffle Only', 
        minSwaps: 2, 
        maxSwaps: 60, 
        maxGreenPercentage: 100, // No constraint for easy
        intersectionGreenPercentage: 100 // All intersections stay correct
    },
    mediumEasy: { 
        name: 'Medium-Easy - 40% Green Max', 
        minSwaps: 3, 
        maxSwaps: 60, 
        maxGreenPercentage: 40,
        intersectionGreenPercentage: 75 // Most intersections stay correct
    },
    medium: { 
        name: 'Medium - 30% Green Max', 
        minSwaps: 6, 
        maxSwaps: 60, 
        maxGreenPercentage: 30,
        intersectionGreenPercentage: 50 // Half of intersections stay correct
    },
    mediumHard: { 
        name: 'Medium-Hard - 20% Green Max', 
        minSwaps: 8, 
        maxSwaps: 60, 
        maxGreenPercentage: 20,
        intersectionGreenPercentage: 25 // Few intersections stay correct
    },
    hard: { 
        name: 'Hard - 15% Green Max', 
        minSwaps: 12, 
        maxSwaps: 60, 
        maxGreenPercentage: 15,
        intersectionGreenPercentage: 0 // No intersections stay correct
    }
};

// RSS News Sources for live headline fetching
const rssNewsSources = [
    {
        name: "BBC News",
        url: "http://feeds.bbci.co.uk/news/rss.xml",
        category: "general"
    },
    {
        name: "CNN Top Stories",
        url: "http://rss.cnn.com/rss/edition.rss",
        category: "general"
    },
    {
        name: "Reuters Top News",
        url: "https://news.google.com/rss/search?q=site%3Areuters.com&hl=en-US&gl=US&ceid=US%3Aen",
        category: "general"
    },
    {
        name: "NPR News",
        url: "https://feeds.npr.org/1001/rss.xml",
        category: "general"
    },
    {
        name: "The Guardian",
        url: "https://www.theguardian.com/world/rss",
        category: "world"
    },
    {
        name: "BBC Technology",
        url: "http://feeds.bbci.co.uk/news/technology/rss.xml",
        category: "technology"
    },
    // {
    //     name: "BBC Sport",
    //     url: "http://feeds.bbci.co.uk/sport/rss.xml",
    //     category: "sports"
    // },
    {
        name: "Sky News",
        url: "http://feeds.skynews.com/feeds/rss/home.xml",
        category: "general"
    }
];

// Russian RSS News Sources
const russianRssNewsSources = [
    {
        name: "Коммерсант",
        url: "https://www.kommersant.ru/rss/main.xml",
        category: "general"
    },
    {
        name: "РИА",
        url: "https://ria.ru/export/rss2/index.xml",
        category: "general"
    },
    {
        name: "РБК",
        url: "https://rssexport.rbc.ru/rbcnews/news/30/full.rss",
        category: "general"
    },
    {
        name: "ТАСС",
        url: "https://tass.ru/rss/v2.xml",
        category: "general"
    },
    {
        name: "Лента",
        url: "https://lenta.ru/rss/news",
        category: "general"
    },
    {
        name: "Известия",
        url: "https://iz.ru/xml/rss/all.xml",
        category: "general"
    },
    {
        name: "RT",
        url: "https://russian.rt.com/rss",
        category: "general"
    },
    {
        name: "Ведомости",
        url: "https://vedomosti.ru/rss/articles",
        category: "general"
    },
    {
        name: "News Info",
        url: "https://www.newsinfo.ru/rss",
        category: "general"
    },
    {
        name: "Манитаймс",
        url: "https://www.moneytimes.ru/rss",
        category: "general"
    },
    {
        name: "3DNews",
        url: "https://3dnews.ru/breaking/rss",
        category: "technology"
    },
    {
        name: "iXBT.com",
        url: "https://www.ixbt.com/live/rss",
        category: "technology"
    },
    {
        name: "Чемпионат",
        url: "https://www.championat.com/rss/news",
        category: "sports"
    },
    {
        name: "Спортс",
        url: "https://www.sports.ru/rss/topnews.xml",
        category: "sports"
    }
];

// Star rating system configuration
const starRatingConfig = {
    // Base multiplier for minimum possible swaps
    baseMultiplier: 1.3,
    
    // Star threshold multipliers (applied to base threshold)
    starThresholds: {
        5: 3.0,    // 5 stars: ≤ wordCount × 3 (base)
        4: 5.0,    // 4 stars: ≤ wordCount × 4.5 (base × 1.5)
        3: 7.0,    // 3 stars: ≤ wordCount × 6 (base × 2.0)
        2: 12.0,    // 2 stars: ≤ wordCount × 9 (base × 3.0)
        1: Infinity // 1 star: any number of swaps
    },
    
    // Performance rating labels
    ratingLabels: {
        5: 'PERFECT',
        4: 'EXCELLENT', 
        3: 'GOOD',
        2: 'FAIR',
        1: 'COMPLETE'
    }
};

// Victory Animation Configuration
// Choose from: 'wave', 'jump', 'colorWave', 'shake', or 'none'
const victoryAnimationConfig = {
    animationType: 'wave',      // Options: 'wave', 'jump', 'colorWave', 'shake', 'none'
    duration: 500,              // Total animation duration in ms
    staggerDelay: 30,          // Delay between each cell animation in ms
    intensity: 'subtle',        // Options: 'subtle', 'moderate', 'strong'
    easing: 'ease-out'          // CSS easing function
};

// Mock headlines data - all with 4+ words and descriptions
const mockHeadlines = [
    {
        text: "CLIMATE SUMMIT BEGINS TODAY",
        words: ["CLIMATE", "SUMMIT", "BEGINS", "TODAY"],
        link: "https://example.com/climate-summit",
        description: "World leaders gather for crucial climate negotiations to address global warming and environmental challenges.",
        djb2Hash: "qgyrrq"
    },
    {
        text: "TECH GIANTS ANNOUNCE MERGER",
        words: ["TECH", "GIANTS", "ANNOUNCE", "MERGER"],
        link: "https://example.com/tech-merger",
        description: "Major technology companies join forces in a groundbreaking merger that will reshape the industry landscape.",
        djb2Hash: "185zvfd"
    },
    {
        text: "MARKET HITS NEW RECORD",
        words: ["MARKET", "HITS", "NEW", "RECORD"],
        link: "https://example.com/market-record",
        description: "Stock market reaches unprecedented heights as investor confidence soars amid positive economic indicators.",
        djb2Hash: "1gw5yz2"
    },
    {
        text: "VACCINE TRIAL SHOWS SUCCESS",
        words: ["VACCINE", "TRIAL", "SHOWS", "SUCCESS"],
        link: "https://example.com/vaccine-success",
        description: "Clinical trials demonstrate promising results for new vaccine with high efficacy rates and minimal side effects.",
        djb2Hash: "coj6xv"
    },
    {
        text: "MAJOR STORM APPROACHES COAST",
        words: ["MAJOR", "STORM", "APPROACHES", "COAST"],
        link: "https://example.com/storm-coast",
        description: "Powerful hurricane system moves toward populated coastal areas, prompting widespread evacuation orders.",
        djb2Hash: "v52cof"
    },
    {
        text: "PEACE TALKS RESUME MONDAY",
        words: ["PEACE", "TALKS", "RESUME", "MONDAY"],
        link: "https://example.com/peace-talks",
        description: "Diplomatic negotiations restart after temporary suspension, with hopes for breakthrough in long-standing conflict.",
        djb2Hash: "lvi2ov"
    },
    {
        text: "BUDGET CRISIS DEEPENS FURTHER",
        words: ["BUDGET", "CRISIS", "DEEPENS", "FURTHER"],
        link: "https://example.com/budget-crisis",
        description: "Government faces mounting fiscal challenges as spending cuts and revenue shortfalls create political tensions.",
        djb2Hash: "nz5oab"
    },
    {
        text: "SPORTS LEGEND ANNOUNCES RETIREMENT",
        words: ["SPORTS", "LEGEND", "ANNOUNCES", "RETIREMENT"],
        link: "https://example.com/sports-retires",
        description: "Celebrated athlete ends illustrious career after decades of championship victories and record-breaking performances.",
        djb2Hash: "19n1wp6"
    },
    {
        text: "NEW POLICY TAKES EFFECT",
        words: ["NEW", "POLICY", "TAKES", "EFFECT"],
        link: "https://example.com/new-policy",
        description: "Comprehensive legislation becomes law, introducing significant changes to healthcare and social services.",
        djb2Hash: "va18st"
    },
    {
        text: "STOCK PRICES SURGE TODAY",
        words: ["STOCK", "PRICES", "SURGE", "TODAY"],
        link: "https://example.com/stock-surge",
        description: "Financial markets experience dramatic gains as investors respond positively to economic recovery signals.",
        djb2Hash: "1tte9v9"
    },
    {
        text: "BREAKING NEWS ALERT NOW",
        words: ["BREAKING", "NEWS", "ALERT", "NOW"],
        link: "https://example.com/breaking-news",
        description: "Urgent developments unfold in major international incident requiring immediate public attention and response.",
        djb2Hash: "2up1zq"
    },
    {
        text: "WEATHER UPDATE ISSUED NOW",
        words: ["WEATHER", "UPDATE", "ISSUED", "NOW"],
        link: "https://example.com/weather-update",
        description: "Meteorological services release critical forecast information about severe weather conditions affecting the region.",
        djb2Hash: "2ljhvb"
    },
    {
        text: "TRAFFIC DELAYS EXPECTED TODAY",
        words: ["TRAFFIC", "DELAYS", "EXPECTED", "TODAY"],
        link: "https://example.com/traffic-delays",
        description: "Major roadwork and construction projects cause significant transportation disruptions during peak hours.",
        djb2Hash: "j6rxze"
    },
    {
        text: "FIRE STATION RESPONDS QUICKLY",
        words: ["FIRE", "STATION", "RESPONDS", "QUICKLY"],
        link: "https://example.com/fire-response",
        description: "Emergency services demonstrate rapid response capabilities in containing dangerous blaze threatening residential areas.",
        djb2Hash: "jzihr"
    },
    {
        text: "SCHOOL HOLIDAY ANNOUNCED TODAY",
        words: ["SCHOOL", "HOLIDAY", "ANNOUNCED", "TODAY"],
        link: "https://example.com/school-holiday",
        description: "Educational authorities declare unexpected closure due to severe weather conditions affecting student safety.",
        djb2Hash: "vrb9mm"
    },
    {
        text: "POWER OUTAGE REPORTED WIDELY",
        words: ["POWER", "OUTAGE", "REPORTED", "WIDELY"],
        link: "https://example.com/power-outage",
        description: "Electrical grid failures affect thousands of households as utility companies work to restore service.",
        djb2Hash: "1g443ru"
    }
];

// Russian mock headlines data - all with 4+ words and descriptions
const mockRussianHeadlines = [
    {
        text: "ЭКОНОМИКА СТРАНЫ РАСТЁТ БЫСТРО",
        words: ["ЭКОНОМИКА", "СТРАНЫ", "РАСТЁТ", "БЫСТРО"],
        link: "https://example.com/russian-economy",
        description: "Национальная экономика показывает значительный рост благодаря успешной промышленной политике правительства.",
        djb2Hash: "1v34jw3"
    },
    {
        text: "НОВЫЕ ТЕХНОЛОГИИ ВНЕДРЯЮТСЯ АКТИВНО",
        words: ["НОВЫЕ", "ТЕХНОЛОГИИ", "ВНЕДРЯЮТСЯ", "АКТИВНО"],
        link: "https://example.com/russian-tech",
        description: "Российские компании активно внедряют передовые технологии в производственные процессы для повышения эффективности.",
        djb2Hash: "1278azc"
    },
    {
        text: "КЛИМАТ ПЛАНЕТЫ МЕНЯЕТСЯ СИЛЬНО",
        words: ["КЛИМАТ", "ПЛАНЕТЫ", "МЕНЯЕТСЯ", "СИЛЬНО"],
        link: "https://example.com/russian-climate",
        description: "Глобальные климатические изменения оказывают значительное влияние на экосистемы и погодные условия по всему миру.",
        djb2Hash: "axf75v"
    },
    {
        text: "МЕДИЦИНА РАЗВИВАЕТСЯ УСПЕШНО",
        words: ["МЕДИЦИНА", "РАЗВИВАЕТСЯ", "УСПЕШНО"],
        link: "https://example.com/russian-medicine",
        description: "Современные медицинские технологии и препараты позволяют эффективно бороться с ранее неизлечимыми заболеваниями.",
        djb2Hash: "15r9rg5"
    },
    {
        text: "ОБРАЗОВАНИЕ СТАНОВИТСЯ ЛУЧШЕ",
        words: ["ОБРАЗОВАНИЕ", "СТАНОВИТСЯ", "ЛУЧШЕ"],
        link: "https://example.com/russian-education",
        description: "Новые образовательные программы и методики обучения обеспечивают высокое качество подготовки специалистов.",
        djb2Hash: "9bohc6"
    },
    {
        text: "ТРАНСПОРТНАЯ СИСТЕМА МОДЕРНИЗИРУЕТСЯ",
        words: ["ТРАНСПОРТНАЯ", "СИСТЕМА", "МОДЕРНИЗИРУЕТСЯ"],
        link: "https://example.com/russian-transport",
        description: "Масштабные инвестиции в развитие транспортной инфраструктуры улучшают доступность и качество перевозок.",
        djb2Hash: "xntfug"
    },
    {
        text: "ЭНЕРГЕТИКА ПЕРЕХОДИТ НА ЗЕЛЁНУЮ",
        words: ["ЭНЕРГЕТИКА", "ПЕРЕХОДИТ", "НА", "ЗЕЛЁНУЮ"],
        link: "https://example.com/russian-energy",
        description: "Переход на возобновляемые источники энергии снижает углеродный след и обеспечивает энергетическую независимость.",
        djb2Hash: "157i4d5"
    },
    {
        text: "КУЛЬТУРА РАСЦВЕТАЕТ ПОВСЕМЕСТНО",
        words: ["КУЛЬТУРА", "РАСЦВЕТАЕТ", "ПОВСЕМЕСТНО"],
        link: "https://example.com/russian-culture",
        description: "Государственная поддержка культурных инициатив способствует сохранению наследия и развитию творческих индустрий.",
        djb2Hash: "1e4cxnm"
    },
    {
        text: "СПОРТ ДОСТИГАЕТ НОВЫХ ВЫСОТ",
        words: ["СПОРТ", "ДОСТИГАЕТ", "НОВЫХ", "ВЫСОТ"],
        link: "https://example.com/russian-sport",
        description: "Российские спортсмены показывают выдающиеся результаты на международных соревнованиях и чемпионатах мира.",
        djb2Hash: "eh8lwv"
    },
    {
        text: "НАУКА ОТКРЫВАЕТ НОВЫЕ ГОРИЗОНТЫ",
        words: ["НАУКА", "ОТКРЫВАЕТ", "НОВЫЕ", "ГОРИЗОНТЫ"],
        link: "https://example.com/russian-science",
        description: "Фундаментальные научные исследования открывают новые возможности для технологического прогресса и развития.",
        djb2Hash: "1w1y1u5"
    },
    {
        text: "ЭКОЛОГИЯ ТРЕБУЕТ ВНИМАНИЯ СРОЧНО",
        words: ["ЭКОЛОГИЯ", "ТРЕБУЕТ", "ВНИМАНИЯ", "СРОЧНО"],
        link: "https://example.com/russian-ecology",
        description: "Экологическая ситуация требует немедленных мер по защите окружающей среды и сохранению природных ресурсов.",
        djb2Hash: "153zgp9"
    },
    {
        text: "ПОЛИТИКА СТРЕМИТСЯ К СТАБИЛЬНОСТИ",
        words: ["ПОЛИТИКА", "СТРЕМИТСЯ", "К", "СТАБИЛЬНОСТИ"],
        link: "https://example.com/russian-politics",
        description: "Государственная политика направлена на обеспечение стабильности и благополучия граждан страны.",
        djb2Hash: "hx95f1"
    },
    {
        text: "БИЗНЕС РАЗВИВАЕТСЯ ДИНАМИЧНО",
        words: ["БИЗНЕС", "РАЗВИВАЕТСЯ", "ДИНАМИЧНО"],
        link: "https://example.com/russian-business",
        description: "Предпринимательская деятельность получает поддержку государства и показывает высокие темпы роста.",
        djb2Hash: "yi6zyw"
    },
    {
        text: "ТЕХНИКА СОВЕРШЕНСТВУЕТСЯ ПОСТОЯННО",
        words: ["ТЕХНИКА", "СОВЕРШЕНСТВУЕТСЯ", "ПОСТОЯННО"],
        link: "https://example.com/russian-engineering",
        description: "Инженерные разработки и технические новшества обеспечивают прогресс во всех отраслях промышленности.",
        djb2Hash: "eq2q7a"
    },
    {
        text: "ОБЩЕСТВО СТАНОВИТСЯ СПЛОЧЕННЕЕ",
        words: ["ОБЩЕСТВО", "СТАНОВИТСЯ", "СПЛОЧЕННЕЕ"],
        link: "https://example.com/russian-society",
        description: "Социальная сплоченность и взаимопомощь становятся основой стабильного развития гражданского общества.",
        djb2Hash: "1ndyzpi"
    },
    {
        text: "ИННОВАЦИИ МЕНЯЮТ МИР БЫСТРО",
        words: ["ИННОВАЦИИ", "МЕНЯЮТ", "МИР", "БЫСТРО"],
        link: "https://example.com/russian-innovation",
        description: "Инновационные разработки и передовые технологии кардинально изменяют привычные способы жизни.",
        djb2Hash: "1gm4x4h"
    }
];
