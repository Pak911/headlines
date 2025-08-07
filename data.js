// Headline Scoring Configuration
const headlineScoringConfig = {
    // Word count constraints
    minWords: 4,           // Minimum words required after filtering
    maxWords: 6,           // Maximum words for optimal score
    idealMinWords: 4,      // Ideal minimum word count
    idealMaxWords: 6,      // Ideal maximum word count
    
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
        skipWordsInParsing: ['THE', 'AND', 'OR', 'BUT', 'FOR', 'NOR', 'SO', 'YET', 'A', 'AN'], // Words to skip during parsing
        defaultCount: 10,            // Default number of headlines to fetch per source
        cacheTimeout: 300000,        // Cache timeout in milliseconds (5 minutes)
        loadingAnimationDelay: 5000  // Show loading animation after 5 seconds
    }
};

// Difficulty system configuration
let currentDifficulty = 'hard'; // Default difficulty - hardest level with big hint (description)

const difficultySettings = {
    easy: { 
        name: 'Easy - Word Shuffle Only', 
        minSwaps: 2, 
        maxSwaps: 6, 
        maxGreenPercentage: 100 // No constraint for easy
    },
    mediumEasy: { 
        name: 'Medium-Easy - 40% Green Max', 
        minSwaps: 3, 
        maxSwaps: 8, 
        maxGreenPercentage: 40 
    },
    medium: { 
        name: 'Medium - 30% Green Max', 
        minSwaps: 6, 
        maxSwaps: 12, 
        maxGreenPercentage: 30 
    },
    mediumHard: { 
        name: 'Medium-Hard - 20% Green Max', 
        minSwaps: 8, 
        maxSwaps: 16, 
        maxGreenPercentage: 20 
    },
    hard: { 
        name: 'Hard - 15% Green Max', 
        minSwaps: 12, 
        maxSwaps: 24, 
        maxGreenPercentage: 15 
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

// Mock headlines data - all with 4+ words and descriptions
const mockHeadlines = [
    {
        text: "CLIMATE SUMMIT BEGINS TODAY",
        words: ["CLIMATE", "SUMMIT", "BEGINS", "TODAY"],
        link: "https://example.com/climate-summit",
        description: "World leaders gather for crucial climate negotiations to address global warming and environmental challenges."
    },
    {
        text: "TECH GIANTS ANNOUNCE MERGER",
        words: ["TECH", "GIANTS", "ANNOUNCE", "MERGER"],
        link: "https://example.com/tech-merger",
        description: "Major technology companies join forces in a groundbreaking merger that will reshape the industry landscape."
    },
    {
        text: "MARKET HITS NEW RECORD",
        words: ["MARKET", "HITS", "NEW", "RECORD"],
        link: "https://example.com/market-record",
        description: "Stock market reaches unprecedented heights as investor confidence soars amid positive economic indicators."
    },
    {
        text: "VACCINE TRIAL SHOWS SUCCESS",
        words: ["VACCINE", "TRIAL", "SHOWS", "SUCCESS"],
        link: "https://example.com/vaccine-success",
        description: "Clinical trials demonstrate promising results for new vaccine with high efficacy rates and minimal side effects."
    },
    {
        text: "MAJOR STORM APPROACHES COAST",
        words: ["MAJOR", "STORM", "APPROACHES", "COAST"],
        link: "https://example.com/storm-coast",
        description: "Powerful hurricane system moves toward populated coastal areas, prompting widespread evacuation orders."
    },
    {
        text: "PEACE TALKS RESUME MONDAY",
        words: ["PEACE", "TALKS", "RESUME", "MONDAY"],
        link: "https://example.com/peace-talks",
        description: "Diplomatic negotiations restart after temporary suspension, with hopes for breakthrough in long-standing conflict."
    },
    {
        text: "BUDGET CRISIS DEEPENS FURTHER",
        words: ["BUDGET", "CRISIS", "DEEPENS", "FURTHER"],
        link: "https://example.com/budget-crisis",
        description: "Government faces mounting fiscal challenges as spending cuts and revenue shortfalls create political tensions."
    },
    {
        text: "SPORTS LEGEND ANNOUNCES RETIREMENT",
        words: ["SPORTS", "LEGEND", "ANNOUNCES", "RETIREMENT"],
        link: "https://example.com/sports-retires",
        description: "Celebrated athlete ends illustrious career after decades of championship victories and record-breaking performances."
    },
    {
        text: "NEW POLICY TAKES EFFECT",
        words: ["NEW", "POLICY", "TAKES", "EFFECT"],
        link: "https://example.com/new-policy",
        description: "Comprehensive legislation becomes law, introducing significant changes to healthcare and social services."
    },
    {
        text: "STOCK PRICES SURGE TODAY",
        words: ["STOCK", "PRICES", "SURGE", "TODAY"],
        link: "https://example.com/stock-surge",
        description: "Financial markets experience dramatic gains as investors respond positively to economic recovery signals."
    },
    {
        text: "BREAKING NEWS ALERT NOW",
        words: ["BREAKING", "NEWS", "ALERT", "NOW"],
        link: "https://example.com/breaking-news",
        description: "Urgent developments unfold in major international incident requiring immediate public attention and response."
    },
    {
        text: "WEATHER UPDATE ISSUED NOW",
        words: ["WEATHER", "UPDATE", "ISSUED", "NOW"],
        link: "https://example.com/weather-update",
        description: "Meteorological services release critical forecast information about severe weather conditions affecting the region."
    },
    {
        text: "TRAFFIC DELAYS EXPECTED TODAY",
        words: ["TRAFFIC", "DELAYS", "EXPECTED", "TODAY"],
        link: "https://example.com/traffic-delays",
        description: "Major roadwork and construction projects cause significant transportation disruptions during peak hours."
    },
    {
        text: "FIRE STATION RESPONDS QUICKLY",
        words: ["FIRE", "STATION", "RESPONDS", "QUICKLY"],
        link: "https://example.com/fire-response",
        description: "Emergency services demonstrate rapid response capabilities in containing dangerous blaze threatening residential areas."
    },
    {
        text: "SCHOOL HOLIDAY ANNOUNCED TODAY",
        words: ["SCHOOL", "HOLIDAY", "ANNOUNCED", "TODAY"],
        link: "https://example.com/school-holiday",
        description: "Educational authorities declare unexpected closure due to severe weather conditions affecting student safety."
    },
    {
        text: "POWER OUTAGE REPORTED WIDELY",
        words: ["POWER", "OUTAGE", "REPORTED", "WIDELY"],
        link: "https://example.com/power-outage",
        description: "Electrical grid failures affect thousands of households as utility companies work to restore service."
    }
];
