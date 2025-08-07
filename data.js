// Difficulty system configuration
let currentDifficulty = 'medium'; // Default difficulty

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

// Mock headlines data - all with 4+ words
const mockHeadlines = [
    {
        text: "CLIMATE SUMMIT BEGINS TODAY",
        words: ["CLIMATE", "SUMMIT", "BEGINS", "TODAY"],
        link: "https://example.com/climate-summit"
    },
    {
        text: "TECH GIANTS ANNOUNCE MERGER",
        words: ["TECH", "GIANTS", "ANNOUNCE", "MERGER"],
        link: "https://example.com/tech-merger"
    },
    {
        text: "MARKET HITS NEW RECORD",
        words: ["MARKET", "HITS", "NEW", "RECORD"],
        link: "https://example.com/market-record"
    },
    {
        text: "VACCINE TRIAL SHOWS SUCCESS",
        words: ["VACCINE", "TRIAL", "SHOWS", "SUCCESS"],
        link: "https://example.com/vaccine-success"
    },
    {
        text: "MAJOR STORM APPROACHES COAST",
        words: ["MAJOR", "STORM", "APPROACHES", "COAST"],
        link: "https://example.com/storm-coast"
    },
    {
        text: "PEACE TALKS RESUME MONDAY",
        words: ["PEACE", "TALKS", "RESUME", "MONDAY"],
        link: "https://example.com/peace-talks"
    },
    {
        text: "BUDGET CRISIS DEEPENS FURTHER",
        words: ["BUDGET", "CRISIS", "DEEPENS", "FURTHER"],
        link: "https://example.com/budget-crisis"
    },
    {
        text: "SPORTS LEGEND ANNOUNCES RETIREMENT",
        words: ["SPORTS", "LEGEND", "ANNOUNCES", "RETIREMENT"],
        link: "https://example.com/sports-retires"
    },
    // New headlines with exactly 4 words
    {
        text: "NEW POLICY TAKES EFFECT",
        words: ["NEW", "POLICY", "TAKES", "EFFECT"],
        link: "https://example.com/new-policy"
    },
    {
        text: "STOCK PRICES SURGE TODAY",
        words: ["STOCK", "PRICES", "SURGE", "TODAY"],
        link: "https://example.com/stock-surge"
    },
    {
        text: "BREAKING NEWS ALERT NOW",
        words: ["BREAKING", "NEWS", "ALERT", "NOW"],
        link: "https://example.com/breaking-news"
    },
    {
        text: "WEATHER UPDATE ISSUED NOW",
        words: ["WEATHER", "UPDATE", "ISSUED", "NOW"],
        link: "https://example.com/weather-update"
    },
    {
        text: "TRAFFIC DELAYS EXPECTED TODAY",
        words: ["TRAFFIC", "DELAYS", "EXPECTED", "TODAY"],
        link: "https://example.com/traffic-delays"
    },
    {
        text: "FIRE STATION RESPONDS QUICKLY",
        words: ["FIRE", "STATION", "RESPONDS", "QUICKLY"],
        link: "https://example.com/fire-response"
    },
    {
        text: "SCHOOL HOLIDAY ANNOUNCED TODAY",
        words: ["SCHOOL", "HOLIDAY", "ANNOUNCED", "TODAY"],
        link: "https://example.com/school-holiday"
    },
    {
        text: "POWER OUTAGE REPORTED WIDELY",
        words: ["POWER", "OUTAGE", "REPORTED", "WIDELY"],
        link: "https://example.com/power-outage"
    }
];
