/**
 * News Fetching Configuration
 * Contains RSS sources and mock headlines data
 */

// English RSS News Sources for live headline fetching
// Each source object contains:
// - name: Display name of the news source
// - url: RSS feed URL  
// - category: One of: general, economy, technology, sports
const englishRssNewsSources = [
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
        category: "general"
    },
    {
        name: "BBC Technology",
        url: "http://feeds.bbci.co.uk/news/technology/rss.xml",
        category: "technology"
    },
    {
        name: "BBC Sport",
        url: "http://feeds.bbci.co.uk/sport/rss.xml",
        category: "sports"
    },
    {
        name: "Sky News",
        url: "http://feeds.skynews.com/feeds/rss/home.xml",
        category: "general"
    },
    {
        name: "The Independent UK",
        url: "http://www.independent.co.uk/news/uk/rss",
        category: "general"
    },
    {
        name: "Politico Economy",
        url: "https://rss.politico.com/economy.xml",
        category: "economy"
    },
    {
        name: "FoxNews Sports",
        url: "https://moxie.foxnews.com/google-publisher/sports.xml",
        category: "sports"
    },
    {
        name: "FoxNews Tech",
        url: "https://moxie.foxnews.com/google-publisher/tech.xml",
        category: "technology"
    },
    {
        name: "FoxNews",
        url: "https://moxie.foxnews.com/google-publisher/latest.xml",
        category: "general"
    },
    {
        name: "Washington Post",
        url: "https://feeds.washingtonpost.com/rss/world",
        category: "general"
    },
    {
        name: "Huffpost Sports",
        url: "https://chaski.huffpost.com/us/auto/vertical/sports",
        category: "sports"
    },
    {
        name: "Independent Sports",
        url: "https://www.independent.co.uk/sport/rss",
        category: "sports"
    },
    {
        name: "Independent Economy",
        url: "https://www.independent.co.uk/news/business/rss",
        category: "economy"
    },
    
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
        category: "economy"
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
        name: "Манитаймс",
        url: "https://www.moneytimes.ru/rss",
        category: "economy"
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

// Mock headlines data - all with 4+ words and descriptions
const englishMockHeadlines = [
    {
        text: "CLIMATE SUMMIT BEGINS TODAY",
        words: ["CLIMATE", "SUMMIT", "BEGINS", "TODAY"],
        link: "https://example.com/climate-summit",
        description: "World leaders gather for crucial climate negotiations to address global warming and environmental challenges.",
        djb2Hash: "qgyrrq",
        category: "general"
    },
    {
        text: "TECH GIANTS ANNOUNCE MERGER",
        words: ["TECH", "GIANTS", "ANNOUNCE", "MERGER"],
        link: "https://example.com/tech-merger",
        description: "Major technology companies join forces in a groundbreaking merger that will reshape the industry landscape.",
        djb2Hash: "185zvfd",
        category: "technology"
    },
    {
        text: "MARKET HITS NEW RECORD",
        words: ["MARKET", "HITS", "NEW", "RECORD"],
        link: "https://example.com/market-record",
        description: "Stock market reaches unprecedented heights as investor confidence soars amid positive economic indicators.",
        djb2Hash: "1gw5yz2",
        category: "economy"
    },
    {
        text: "VACCINE TRIAL SHOWS SUCCESS",
        words: ["VACCINE", "TRIAL", "SHOWS", "SUCCESS"],
        link: "https://example.com/vaccine-success",
        description: "Clinical trials demonstrate promising results for new vaccine with high efficacy rates and minimal side effects.",
        djb2Hash: "coj6xv",
        category: "general"
    },
    {
        text: "MAJOR STORM APPROACHES COAST",
        words: ["MAJOR", "STORM", "APPROACHES", "COAST"],
        link: "https://example.com/storm-coast",
        description: "Powerful hurricane system moves toward populated coastal areas, prompting widespread evacuation orders.",
        djb2Hash: "v52cof",
        category: "general"
    },
    {
        text: "PEACE TALKS RESUME MONDAY",
        words: ["PEACE", "TALKS", "RESUME", "MONDAY"],
        link: "https://example.com/peace-talks",
        description: "Diplomatic negotiations restart after temporary suspension, with hopes for breakthrough in long-standing conflict.",
        djb2Hash: "lvi2ov",
        category: "general"
    },
    {
        text: "BUDGET CRISIS DEEPENS FURTHER",
        words: ["BUDGET", "CRISIS", "DEEPENS", "FURTHER"],
        link: "https://example.com/budget-crisis",
        description: "Government faces mounting fiscal challenges as spending cuts and revenue shortfalls create political tensions.",
        djb2Hash: "nz5oab",
        category: "economy"
    },
    {
        text: "SPORTS LEGEND ANNOUNCES RETIREMENT",
        words: ["SPORTS", "LEGEND", "ANNOUNCES", "RETIREMENT"],
        link: "https://example.com/sports-retires",
        description: "Celebrated athlete ends illustrious career after decades of championship victories and record-breaking performances.",
        djb2Hash: "19n1wp6",
        category: "sports"
    },
    {
        text: "NEW POLICY TAKES EFFECT",
        words: ["NEW", "POLICY", "TAKES", "EFFECT"],
        link: "https://example.com/new-policy",
        description: "Comprehensive legislation becomes law, introducing significant changes to healthcare and social services.",
        djb2Hash: "va18st",
        category: "general"
    },
    {
        text: "STOCK PRICES SURGE TODAY",
        words: ["STOCK", "PRICES", "SURGE", "TODAY"],
        link: "https://example.com/stock-surge",
        description: "Financial markets experience dramatic gains as investors respond positively to economic recovery signals.",
        djb2Hash: "1tte9v9",
        category: "economy"
    },
    {
        text: "BREAKING NEWS ALERT NOW",
        words: ["BREAKING", "NEWS", "ALERT", "NOW"],
        link: "https://example.com/breaking-news",
        description: "Urgent developments unfold in major international incident requiring immediate public attention and response.",
        djb2Hash: "2up1zq",
        category: "general"
    },
    {
        text: "WEATHER UPDATE ISSUED NOW",
        words: ["WEATHER", "UPDATE", "ISSUED", "NOW"],
        link: "https://example.com/weather-update",
        description: "Meteorological services release critical forecast information about severe weather conditions affecting the region.",
        djb2Hash: "2ljhvb",
        category: "general"
    },
    {
        text: "TRAFFIC DELAYS EXPECTED TODAY",
        words: ["TRAFFIC", "DELAYS", "EXPECTED", "TODAY"],
        link: "https://example.com/traffic-delays",
        description: "Major roadwork and construction projects cause significant transportation disruptions during peak hours.",
        djb2Hash: "j6rxze",
        category: "general"
    },
    {
        text: "FIRE STATION RESPONDS QUICKLY",
        words: ["FIRE", "STATION", "RESPONDS", "QUICKLY"],
        link: "https://example.com/fire-response",
        description: "Emergency services demonstrate rapid response capabilities in containing dangerous blaze threatening residential areas.",
        djb2Hash: "jzihr",
        category: "general"
    },
    {
        text: "SCHOOL HOLIDAY ANNOUNCED TODAY",
        words: ["SCHOOL", "HOLIDAY", "ANNOUNCED", "TODAY"],
        link: "https://example.com/school-holiday",
        description: "Educational authorities declare unexpected closure due to severe weather conditions affecting student safety.",
        djb2Hash: "vrb9mm",
        category: "general"
    },
    {
        text: "POWER OUTAGE REPORTED WIDELY",
        words: ["POWER", "OUTAGE", "REPORTED", "WIDELY"],
        link: "https://example.com/power-outage",
        description: "Electrical grid failures affect thousands of households as utility companies work to restore service.",
        djb2Hash: "1g443ru",
        category: "general"
    }
];

// Russian mock headlines data - all with 4+ words and descriptions
const mockRussianHeadlines = [
    {
        text: "ЭКОНОМИКА СТРАНЫ РАСТЁТ БЫСТРО",
        words: ["ЭКОНОМИКА", "СТРАНЫ", "РАСТЁТ", "БЫСТРО"],
        link: "https://example.com/russian-economy",
        description: "Национальная экономика показывает значительный рост благодаря успешной промышленной политике правительства.",
        djb2Hash: "1v34jw3",
        category: "economy"
    },
    {
        text: "НОВЫЕ ТЕХНОЛОГИИ ВНЕДРЯЮТСЯ АКТИВНО",
        words: ["НОВЫЕ", "ТЕХНОЛОГИИ", "ВНЕДРЯЮТСЯ", "АКТИВНО"],
        link: "https://example.com/russian-tech",
        description: "Российские компании активно внедряют передовые технологии в производственные процессы для повышения эффективности.",
        djb2Hash: "1278azc",
        category: "technology"
    },
    {
        text: "КЛИМАТ ПЛАНЕТЫ МЕНЯЕТСЯ СИЛЬНО",
        words: ["КЛИМАТ", "ПЛАНЕТЫ", "МЕНЯЕТСЯ", "СИЛЬНО"],
        link: "https://example.com/russian-climate",
        description: "Глобальные климатические изменения оказывают значительное влияние на экосистемы и погодные условия по всему миру.",
        djb2Hash: "axf75v",
        category: "general"
    },
    {
        text: "МЕДИЦИНА РАЗВИВАЕТСЯ УСПЕШНО",
        words: ["МЕДИЦИНА", "РАЗВИВАЕТСЯ", "УСПЕШНО"],
        link: "https://example.com/russian-medicine",
        description: "Современные медицинские технологии и препараты позволяют эффективно бороться с ранее неизлечимыми заболеваниями.",
        djb2Hash: "15r9rg5",
        category: "general"
    },
    {
        text: "ОБРАЗОВАНИЕ СТАНОВИТСЯ ЛУЧШЕ",
        words: ["ОБРАЗОВАНИЕ", "СТАНОВИТСЯ", "ЛУЧШЕ"],
        link: "https://example.com/russian-education",
        description: "Новые образовательные программы и методики обучения обеспечивают высокое качество подготовки специалистов.",
        djb2Hash: "9bohc6",
        category: "general"
    },
    {
        text: "ТРАНСПОРТНАЯ СИСТЕМА МОДЕРНИЗИРУЕТСЯ",
        words: ["ТРАНСПОРТНАЯ", "СИСТЕМА", "МОДЕРНИЗИРУЕТСЯ"],
        link: "https://example.com/russian-transport",
        description: "Масштабные инвестиции в развитие транспортной инфраструктуры улучшают доступность и качество перевозок.",
        djb2Hash: "xntfug",
        category: "general"
    },
    {
        text: "ЭНЕРГЕТИКА ПЕРЕХОДИТ НА ЗЕЛЁНУЮ",
        words: ["ЭНЕРГЕТИКА", "ПЕРЕХОДИТ", "НА", "ЗЕЛЁНУЮ"],
        link: "https://example.com/russian-energy",
        description: "Переход на возобновляемые источники энергии снижает углеродный след и обеспечивает энергетическую независимость.",
        djb2Hash: "157i4d5",
        category: "general"
    },
    {
        text: "КУЛЬТУРА РАСЦВЕТАЕТ ПОВСЕМЕСТНО",
        words: ["КУЛЬТУРА", "РАСЦВЕТАЕТ", "ПОВСЕМЕСТНО"],
        link: "https://example.com/russian-culture",
        description: "Государственная поддержка культурных инициатив способствует сохранению наследия и развитию творческих индустрий.",
        djb2Hash: "1e4cxnm",
        category: "general"
    },
    {
        text: "СПОРТ ДОСТИГАЕТ НОВЫХ ВЫСОТ",
        words: ["СПОРТ", "ДОСТИГАЕТ", "НОВЫХ", "ВЫСОТ"],
        link: "https://example.com/russian-sport",
        description: "Российские спортсмены показывают выдающиеся результаты на международных соревнованиях и чемпионатах мира.",
        djb2Hash: "eh8lwv",
        category: "sports"
    },
    {
        text: "НАУКА ОТКРЫВАЕТ НОВЫЕ ГОРИЗОНТЫ",
        words: ["НАУКА", "ОТКРЫВАЕТ", "НОВЫЕ", "ГОРИЗОНТЫ"],
        link: "https://example.com/russian-science",
        description: "Фундаментальные научные исследования открывают новые возможности для технологического прогресса и развития.",
        djb2Hash: "1w1y1u5",
        category: "general"
    },
    {
        text: "ЭКОЛОГИЯ ТРЕБУЕТ ВНИМАНИЯ СРОЧНО",
        words: ["ЭКОЛОГИЯ", "ТРЕБУЕТ", "ВНИМАНИЯ", "СРОЧНО"],
        link: "https://example.com/russian-ecology",
        description: "Экологическая ситуация требует немедленных мер по защите окружающей среды и сохранению природных ресурсов.",
        djb2Hash: "153zgp9",
        category: "general"
    },
    {
        text: "ПОЛИТИКА СТРЕМИТСЯ К СТАБИЛЬНОСТИ",
        words: ["ПОЛИТИКА", "СТРЕМИТСЯ", "К", "СТАБИЛЬНОСТИ"],
        link: "https://example.com/russian-politics",
        description: "Государственная политика направлена на обеспечение стабильности и благополучия граждан страны.",
        djb2Hash: "hx95f1",
        category: "general"
    },
    {
        text: "БИЗНЕС РАЗВИВАЕТСЯ ДИНАМИЧНО",
        words: ["БИЗНЕС", "РАЗВИВАЕТСЯ", "ДИНАМИЧНО"],
        link: "https://example.com/russian-business",
        description: "Предпринимательская деятельность получает поддержку государства и показывает высокие темпы роста.",
        djb2Hash: "yi6zyw",
        category: "economy"
    },
    {
        text: "ТЕХНИКА СОВЕРШЕНСТВУЕТСЯ ПОСТОЯННО",
        words: ["ТЕХНИКА", "СОВЕРШЕНСТВУЕТСЯ", "ПОСТОЯННО"],
        link: "https://example.com/russian-engineering",
        description: "Инженерные разработки и технические новшества обеспечивают прогресс во всех отраслях промышленности.",
        djb2Hash: "eq2q7a",
        category: "technology"
    },
    {
        text: "ОБЩЕСТВО СТАНОВИТСЯ СПЛОЧЕННЕЕ",
        words: ["ОБЩЕСТВО", "СТАНОВИТСЯ", "СПЛОЧЕННЕЕ"],
        link: "https://example.com/russian-society",
        description: "Социальная сплоченность и взаимопомощь становятся основой стабильного развития гражданского общества.",
        djb2Hash: "1ndyzpi",
        category: "general"
    },
    {
        text: "ИННОВАЦИИ МЕНЯЮТ МИР БЫСТРО",
        words: ["ИННОВАЦИИ", "МЕНЯЮТ", "МИР", "БЫСТРО"],
        link: "https://example.com/russian-innovation",
        description: "Инновационные разработки и передовые технологии кардинально изменяют привычные способы жизни.",
        djb2Hash: "1gm4x4h",
        category: "technology"
    }
];

// RSS Fetching Configuration
const rssFetchingConfig = {
    maxConcurrentRequests: 2,  // Maximum concurrent RSS requests in a batch
    batchDelayMs: 10,         // Delay between batches in milliseconds (to avoid rate limiting)
    fetchTimeoutMs: 3000,     // Timeout for each individual RSS fetch call in milliseconds (3 seconds)
    articlesPerSource: {      // Number of articles to fetch per source by language
        'en': 15,             // English: 15 articles per source
        'ru': 15              // Russian: 15 articles per source
    },
    validCategories: [        // Valid category values for RSS sources
        'general',
        'economy', 
        'technology',
        'sports'
    ]
};

// Expose RSS fetching configuration globally for use by other modules
if (typeof window !== 'undefined') {
    window.rssFetchingConfig = rssFetchingConfig;
}