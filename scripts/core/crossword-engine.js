// Crossword Engine - Smart Backbone-First Layout Generation
// Three-phase algorithm: Matchmaker → Backbone → Beam Search Fill
// Ported from crossword-generator_1.html

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('crossword-engine', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[crossword-engine]', message);
    }
}

// Get configuration from data.js
function getCrosswordConfig() {
    if (typeof crosswordEngineConfig !== 'undefined') {
        return crosswordEngineConfig;
    }
    // Fallback defaults
    return {
        bridgeWeight: 50,
        lengthBonus: 10,
        variantsToTry: 100,
        squarenessWeight: 2,
        beamWidth: 10,
        timeLimit: 300,
        maxResults: 15,
        finalCompactness: 0.4,
        finalUnusedWeight: 300,
        intersectionWeights: [10, 20, 40, 80, 150]
    };
}

// Alphabet detection
const ALPHABET_RU = "абвгдежзийклмнопрстуфхцчшщъыьэюя";
const ALPHABET_EN = "abcdefghijklmnopqrstuvwxyz";
let CURRENT_ALPHABET = ALPHABET_RU;

function detectAndSetLanguage(words) {
    const combinedText = words.join("");
    if (/[а-яА-ЯёЁ]/.test(combinedText)) {
        CURRENT_ALPHABET = ALPHABET_RU;
        return "RU";
    } else {
        CURRENT_ALPHABET = ALPHABET_EN;
        return "EN";
    }
}

function getBitIndex(char) {
    char = char.toLowerCase();
    if (CURRENT_ALPHABET === ALPHABET_RU && char === 'ё') char = 'е';
    const idx = CURRENT_ALPHABET.indexOf(char);
    return idx === -1 ? null : idx;
}

function getBitmask(word) {
    let mask = 0;
    for (let char of word) {
        const idx = getBitIndex(char);
        if (idx !== null) {
            mask |= (1 << idx);
        }
    }
    return mask;
}

// === PHASE 1: MATCHMAKER (Selection) ===

function findBestPairs(words, config) {
    const masks = words.map(getBitmask);
    const pairs = [];

    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
            let bridgePotentials = 0;
            
            // Count how many other words share letters with BOTH words
            for (let k = 0; k < words.length; k++) {
                if (k === i || k === j) continue;
                if ((masks[k] & masks[i]) !== 0 && (masks[k] & masks[j]) !== 0) {
                    bridgePotentials++;
                }
            }

            const lenScore = (words[i].length + words[j].length);
            const score = (bridgePotentials * config.bridgeWeight) + (lenScore * config.lengthBonus);

            pairs.push({
                wordA: words[i],
                wordB: words[j],
                indexA: i,
                indexB: j,
                matchScore: score,
                bridges: bridgePotentials
            });
        }
    }
    return pairs.sort((a, b) => b.matchScore - a.matchScore);
}

// === PHASE 2: TOPOLOGICAL FINGERPRINTING & BACKBONE GENERATION ===

function getTopologicalFingerprint(wordA, wordB, shift, bridges) {
    const connections = [];
    const makeConnStr = (w1, i1, w2, i2) => {
        const s1 = `${w1}:${i1}`;
        const s2 = `${w2}:${i2}`;
        return (s1 < s2) ? `${s1}-${s2}` : `${s2}-${s1}`;
    };

    bridges.forEach(b => {
        connections.push(makeConnStr(b.word, b.intersectA, wordA, b.x));
        connections.push(makeConnStr(b.word, b.intersectB, wordB, b.x - shift));
    });
    connections.sort();
    return connections.join('|');
}

function calculateIntermediateScore(backbone, allWords, config) {
    const { wordA, wordB, bridges, minX, maxX, minY, maxY } = backbone;
    let score = 0;
    
    // Intersection bonuses
    const numBridges = bridges.length;
    const intWeights = config.intersectionWeights;
    const getW = (n) => {
        if (n <= 0) return 0;
        if (n === 1) return intWeights[0];
        if (n === 2) return intWeights[1];
        if (n === 3) return intWeights[2];
        if (n === 4) return intWeights[3];
        return intWeights[4];
    };

    const scoreA = numBridges * getW(numBridges);
    const scoreB = numBridges * getW(numBridges);
    let scoreBridges = 0;
    bridges.forEach(() => {
        scoreBridges += (2 * getW(2));
    });
    score += (scoreA + scoreB + scoreBridges);

    // Squareness penalty
    const width = maxX - minX;
    const height = maxY - minY;
    const diff = Math.abs(width - height);
    score -= (diff * config.squarenessWeight);

    // Unused words (light penalty for backbone phase)
    const usedWords = new Set([wordA, wordB, ...bridges.map(b => b.word)]);
    let unusedLettersCount = 0;
    allWords.forEach(w => {
        if (!usedWords.has(w)) unusedLettersCount += w.length;
    });
    score -= (unusedLettersCount * 5); // Light penalty
    
    return score;
}

function tryConfiguration(wordA, wordB, indexA, indexB, pool, maxGap, results, uniqueTopologies, direction, config, allWords) {
    for (let gap = 1; gap <= maxGap; gap++) {
        const dist = gap + 1;
        const minShift = -(wordB.length - 1);
        const maxShift = wordA.length - 1;

        for (let shift = minShift; shift <= maxShift; shift++) {
            const bridges = [];
            const usedBridgeWords = new Set();
            
            const startX = Math.max(0, shift);
            const endX = Math.min(wordA.length, shift + wordB.length);

            if (endX <= startX) continue;

            for (let x = startX; x < endX; x++) {
                const charA = wordA[x];
                const charB = wordB[x - shift];
                
                for (let k = 0; k < pool.length; k++) {
                    const candidate = pool[k].word;
                    const candidateIndex = pool[k].index;
                    
                    if (usedBridgeWords.has(candidate)) continue;
                    if (candidate.length < dist + 1) continue;
                    
                    for (let cIdx = 0; cIdx < candidate.length; cIdx++) {
                        const intersectB_Idx = (direction === "below") ? cIdx + dist : cIdx - dist;
                        
                        if (intersectB_Idx >= 0 && intersectB_Idx < candidate.length) {
                            if (candidate[cIdx] === charA && candidate[intersectB_Idx] === charB) {
                                const neighborConflict = bridges.some(b => Math.abs(b.x - x) <= 1);
                                if (!neighborConflict) {
                                    usedBridgeWords.add(candidate);
                                    bridges.push({
                                        word: candidate,
                                        wordIndex: candidateIndex,
                                        x: x,
                                        yStart: -cIdx,
                                        intersectA: cIdx,
                                        intersectB: intersectB_Idx
                                    });
                                    break;
                                }
                            }
                        }
                    }
                    if (bridges.length > 0 && bridges[bridges.length-1].x === x) break;
                }
            }

            if (bridges.length > 0) {
                const fingerprint = getTopologicalFingerprint(wordA, wordB, shift, bridges);

                if (!uniqueTopologies.has(fingerprint)) {
                    uniqueTopologies.add(fingerprint);
                    
                    let minX = 0, maxX = wordA.length;
                    let minY = 0, maxY = 1;
                    
                    const yB = direction === 'below' ? dist : -dist;
                    minX = Math.min(minX, shift);
                    maxX = Math.max(maxX, shift + wordB.length);
                    minY = Math.min(minY, yB);
                    maxY = Math.max(maxY, yB + 1);
                    
                    bridges.forEach(b => {
                        minY = Math.min(minY, b.yStart);
                        maxY = Math.max(maxY, b.yStart + b.word.length);
                    });

                    const backboneObj = {
                        wordA, wordB, indexA, indexB,
                        direction, gap, shift, bridges,
                        minX, maxX, minY, maxY
                    };

                    backboneObj.intermediateScore = calculateIntermediateScore(backboneObj, allWords, config);
                    results.push(backboneObj);
                }
            }
        }
    }
}

function generateBackbones(topPairs, allWords, config) {
    const validBackbones = [];
    const uniqueTopologies = new Set();
    
    const sortedWords = [...allWords].sort((a, b) => b.length - a.length);
    let maxGap = 0;
    if (sortedWords.length >= 3) {
        const thirdLongest = sortedWords[2];
        maxGap = Math.max(0, thirdLongest.length - 2);
    }

    const candidates = topPairs.slice(0, 30);

    for (const pair of candidates) {
        const { wordA, wordB, indexA, indexB } = pair;
        const availableWords = allWords.map((w, idx) => ({ word: w, index: idx }))
            .filter(item => item.word !== wordA && item.word !== wordB);

        tryConfiguration(wordA, wordB, indexA, indexB, availableWords, maxGap, validBackbones, uniqueTopologies, "below", config, allWords);
        tryConfiguration(wordA, wordB, indexA, indexB, availableWords, maxGap, validBackbones, uniqueTopologies, "above", config, allWords);
        
        if (validBackbones.length > 200) break;
    }

    return validBackbones.sort((a, b) => b.intermediateScore - a.intermediateScore);
}

// === PHASE 3: BEAM SEARCH FILL ===

function buildGridMap(placedWords) {
    const map = new Map();
    placedWords.forEach(p => {
        for (let i = 0; i < p.word.length; i++) {
            const x = p.dir === 'horizontal' ? p.x + i : p.x;
            const y = p.dir === 'vertical' ? p.y + i : p.y;
            map.set(`${x},${y}`, { char: p.word[i] });
        }
    });
    return map;
}

function canPlace(attempt, map) {
    for (let i = 0; i < attempt.word.length; i++) {
        const x = attempt.dir === 'horizontal' ? attempt.x + i : attempt.x;
        const y = attempt.dir === 'vertical' ? attempt.y + i : attempt.y;
        const key = `${x},${y}`;
        const existing = map.get(key);
        
        if (existing) {
            if (existing.char !== attempt.word[i]) return false;
        } else {
            if (attempt.dir === 'horizontal') {
                if (map.has(`${x},${y-1}`) || map.has(`${x},${y+1}`)) return false;
            } else {
                if (map.has(`${x-1},${y}`) || map.has(`${x+1},${y}`)) return false;
            }
        }
    }
    
    const beforeX = attempt.dir === 'horizontal' ? attempt.x - 1 : attempt.x;
    const beforeY = attempt.dir === 'vertical' ? attempt.y - 1 : attempt.y;
    if (map.has(`${beforeX},${beforeY}`)) return false;

    const afterX = attempt.dir === 'horizontal' ? attempt.x + attempt.word.length : attempt.x;
    const afterY = attempt.dir === 'vertical' ? attempt.y + attempt.word.length : attempt.y;
    if (map.has(`${afterX},${afterY}`)) return false;

    return true;
}

function createNextState(prevState, newWordObj) {
    const newPlaced = [...prevState.placed, newWordObj];
    const newUsed = new Set(prevState.used);
    newUsed.add(newWordObj.wordIndex);
    return { placed: newPlaced, used: newUsed };
}

function solveRemainingWords(backbone, allWords, config) {
    const placed = [];
    const used = new Set();

    // Add backbone words
    placed.push({ word: backbone.wordA, wordIndex: backbone.indexA, x: 0, y: 0, dir: 'horizontal' });
    const yB = backbone.direction === 'below' ? (backbone.gap + 1) : -(backbone.gap + 1);
    placed.push({ word: backbone.wordB, wordIndex: backbone.indexB, x: backbone.shift, y: yB, dir: 'horizontal' });
    used.add(backbone.indexA);
    used.add(backbone.indexB);

    // Add bridge words
    backbone.bridges.forEach(b => {
        placed.push({ word: b.word, wordIndex: b.wordIndex, x: b.x, y: b.yStart, dir: 'vertical' });
        used.add(b.wordIndex);
    });

    let beam = [{ placed, used }];

    // Iterative fill
    let changed = true;
    while (changed) {
        changed = false;
        let nextBeamCandidates = [];

        for (const state of beam) {
            const currentMap = buildGridMap(state.placed);
            const remaining = allWords.map((w, idx) => ({ word: w, index: idx }))
                .filter(item => !state.used.has(item.index));
            
            if (remaining.length === 0) continue;

            const candidatesForState = [];

            for (const [key, cell] of currentMap.entries()) {
                const [ax, ay] = key.split(',').map(Number);
                
                for (const item of remaining) {
                    for (let k = 0; k < item.word.length; k++) {
                        if (item.word[k] === cell.char) {
                            const attemptH = { word: item.word, wordIndex: item.index, x: ax - k, y: ay, dir: 'horizontal' };
                            if (canPlace(attemptH, currentMap)) {
                                candidatesForState.push(createNextState(state, attemptH));
                            }
                            
                            const attemptV = { word: item.word, wordIndex: item.index, x: ax, y: ay - k, dir: 'vertical' };
                            if (canPlace(attemptV, currentMap)) {
                                candidatesForState.push(createNextState(state, attemptV));
                            }
                        }
                    }
                }
            }
            
            candidatesForState.forEach(cand => {
                cand.heuristicScore = cand.placed.length * 100;
            });

            nextBeamCandidates.push(...candidatesForState);
        }

        if (nextBeamCandidates.length > 0) {
            nextBeamCandidates.sort((a, b) => b.heuristicScore - a.heuristicScore);
            beam = nextBeamCandidates.slice(0, config.beamWidth);
            changed = true;
        }
    }

    const bestState = beam[0];
    const finalGridMap = buildGridMap(bestState.placed);
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    bestState.placed.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x + (p.dir === 'horizontal' ? p.word.length : 1));
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y + (p.dir === 'vertical' ? p.word.length : 1));
    });

    const width = maxX - minX;
    const height = maxY - minY;
    
    // Calculate intersections
    const cellCounts = new Map();
    bestState.placed.forEach(p => {
        for (let i = 0; i < p.word.length; i++) {
            const x = p.dir === 'horizontal' ? p.x + i : p.x;
            const y = p.dir === 'vertical' ? p.y + i : p.y;
            const key = `${x},${y}`;
            cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
        }
    });

    let intersectionScore = 0;
    const intWeights = config.intersectionWeights;
    const getW = (n) => {
        if (n <= 0) return 0;
        if (n === 1) return intWeights[0];
        if (n === 2) return intWeights[1];
        if (n === 3) return intWeights[2];
        if (n === 4) return intWeights[3];
        return intWeights[4];
    };
    
    bestState.placed.forEach(p => {
        let wordIntersects = 0;
        for (let i = 0; i < p.word.length; i++) {
            const x = p.dir === 'horizontal' ? p.x + i : p.x;
            const y = p.dir === 'vertical' ? p.y + i : p.y;
            if (cellCounts.get(`${x},${y}`) > 1) {
                wordIntersects++;
            }
        }
        intersectionScore += getW(wordIntersects);
    });

    // Unused penalty
    let unusedLetters = 0;
    allWords.forEach((w, idx) => {
        if (!bestState.used.has(idx)) {
            unusedLetters += w.length;
        }
    });
    const unusedPenalty = unusedLetters * config.finalUnusedWeight;
    
    // Area penalty
    const area = width * height;
    const compactnessPenalty = area * config.finalCompactness;

    const totalScore = intersectionScore - unusedPenalty - compactnessPenalty;

    return {
        placed: bestState.placed,
        minX, maxX, minY, maxY,
        finalScore: totalScore,
        usedCount: bestState.used.size
    };
}

// === VARIANT SELECTION ===

function selectVariantWeightedRandom(sortedResults, config) {
    // Validate and normalize finalVariantCount
    let variantCount = config.finalVariantCount;
    if (!Number.isInteger(variantCount) || variantCount < 1) {
        variantCount = 1;
    }
    
    // If only one result, return it directly
    if (sortedResults.length === 1) {
        if (window.debugInfo) {
            window.debugInfo.variantSelection = {
                totalVariants: 1,
                topScore: sortedResults[0].finalScore,
                selectedIndex: 0,
                selectedScore: sortedResults[0].finalScore
            };
        }
        return sortedResults[0];
    }
    
    // Take top N variants (or all if fewer than N)
    const topVariants = sortedResults.slice(0, Math.min(variantCount, sortedResults.length));
    
    // If only one in selection, return it
    if (topVariants.length === 1) {
        if (window.debugInfo) {
            window.debugInfo.variantSelection = {
                totalVariants: sortedResults.length,
                topScore: sortedResults[0].finalScore,
                selectedIndex: 0,
                selectedScore: topVariants[0].finalScore
            };
        }
        return topVariants[0];
    }
    
    // Calculate baseline: (lowest score - 1) to ensure all weights are positive
    // The lowest variant will get weight of 1
    const lowestScore = topVariants[topVariants.length - 1].finalScore;
    const baseline = lowestScore - 1;
    
    // Calculate weights (adjusted scores)
    const weights = topVariants.map(variant => variant.finalScore - baseline);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    // Weighted random selection
    let random = Math.random() * totalWeight;
    for (let i = 0; i < topVariants.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            _log(`Selected variant ${i + 1}/${topVariants.length} (score: ${Math.round(topVariants[i].finalScore)}, weight: ${Math.round(weights[i])})`);
            
            // Store selection info for debug panel
            console.log('[crossword-engine] Storing variant selection - window.debugInfo exists?', typeof window.debugInfo !== 'undefined');
            if (window.debugInfo) {
                window.debugInfo.variantSelection = {
                    totalVariants: sortedResults.length,
                    topScore: sortedResults[0].finalScore,
                    selectedIndex: i,
                    selectedScore: topVariants[i].finalScore
                };
            } else {
                console.warn('[crossword-engine] window.debugInfo not available!');
            }
            
            return topVariants[i];
        }
    }
    
    // Fallback (should never reach here due to floating point precision)
    if (window.debugInfo) {
        window.debugInfo.variantSelection = {
            totalVariants: sortedResults.length,
            topScore: sortedResults[0].finalScore,
            selectedIndex: 0,
            selectedScore: topVariants[0].finalScore
        };
    }
    return topVariants[0];
}

// === MAIN ENTRY POINT ===

function generateCrosswordLayout(words) {
    const startTime = performance.now();
    const config = getCrosswordConfig();
    
    // Detect language
    detectAndSetLanguage(words);
    
    // Phase 1: Find best pairs
    const pairs = findBestPairs(words, config);
    if (pairs.length === 0) {
        _log('No valid word pairs found');
        return null;
    }
    
    // Phase 2: Generate backbones
    const backbones = generateBackbones(pairs, words, config);
    if (backbones.length === 0) {
        _log('No valid backbones generated');
        return null;
    }
    
    // Phase 3: Fill remaining words
    const finalResults = [];
    const candidates = backbones.slice(0, config.variantsToTry);
    
    for (const bb of candidates) {
        if (performance.now() - startTime > config.timeLimit) break;
        
        const filled = solveRemainingWords(bb, words, config);
        finalResults.push(filled);
    }
    
    if (finalResults.length === 0) {
        _log('No complete crosswords generated');
        return null;
    }
    
    // Sort by score (highest first)
    finalResults.sort((a, b) => b.finalScore - a.finalScore);
    
    // Weighted random selection from top variants
    const bestResult = selectVariantWeightedRandom(finalResults, config);
    
    // Check if all words were used
    if (bestResult.usedCount < words.length) {
        _log(`Only ${bestResult.usedCount}/${words.length} words used - layout incomplete`);
        return null;
    }
    
    // Convert to expected output format
    const layout = {
        words: bestResult.placed.map(p => ({
            word: p.wordIndex,
            row: p.y - bestResult.minY,
            col: p.x - bestResult.minX,
            direction: p.dir === 'horizontal' ? 'horizontal' : 'vertical'
        }))
    };
    
    // Set global gridSize for compatibility
    if (typeof gridSize !== 'undefined') {
        gridSize = {
            rows: bestResult.maxY - bestResult.minY,
            cols: bestResult.maxX - bestResult.minX
        };
    }
    
    const elapsedTime = Math.round(performance.now() - startTime);
    _log(`✅ Crossword generated in ${elapsedTime}ms (${bestResult.usedCount}/${words.length} words, score: ${Math.round(bestResult.finalScore)})`);
    
    return layout;
}

// Fallback function for compatibility
function generateSimpleLayout(words) {
    _log('generateSimpleLayout called - using main algorithm instead');
    const result = generateCrosswordLayout(words);
    
    // If main algorithm fails, create minimal valid layout
    if (!result && words.length > 0) {
        _log('⚠️ Main algorithm failed, creating minimal layout');
        const layout = {
            words: words.map((word, idx) => ({
                word: idx,
                row: idx * 2,
                col: 0,
                direction: 'horizontal'
            }))
        };
        
        // Set gridSize for minimal layout
        if (typeof gridSize !== 'undefined') {
            const maxWordLength = Math.max(...words.map(w => w.length));
            gridSize = {
                rows: words.length * 2,
                cols: maxWordLength
            };
        }
        
        return layout;
    }
    
    return result;
}

// Normalize function for compatibility
function normalizeLayout(layout, words) {
    // Already normalized in the new algorithm
    return layout;
}

// Expose functions globally
window.generateCrosswordLayout = generateCrosswordLayout;
window.generateSimpleLayout = generateSimpleLayout;
window.normalizeLayout = normalizeLayout;

})();
