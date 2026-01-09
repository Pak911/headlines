/**
 * Headlines Audio Configuration
 *
 * This file defines the audio system for the Headlines Crossword Game:
 * - Sound effect configurations (oscillator-based synthesis or file-based)
 * - Master volume and enable/disable controls
 * - Effect groups for shared audio processing
 * - Event mapping from game events to sound variations
 */

const headlinesAudio = {
    enabled: true, // Master enable/disable for all sound effects
    masterVolume: 0.7, // Global volume multiplier (0.0 to 1.0)

    // Individual sound effect configurations
    // Each sound can be either file-based (loaded via Pizzicato) or oscillator-based (synthesized)
    sounds: {
        // Oscillator-based sounds from data-audio-alt.js (for testing)
        blackHoleCollected: {
            type: 'oscillator',
            waveform: 'sine',
            frequency: { start: 80, end: 40 },
            volume: 0.25,
            duration: 0.4,
            envelope: { attack: 0.03, decay: 0.37 }
        },
        merge: {
            type: 'oscillator',
            waveform: 'triangle',
            frequency: { start: 200, end: 150 },
            volume: 0.18,
            duration: 0.2,
            envelope: { attack: 0.02, decay: 0.18 }
        },
        blackHoleDrop: {
            type: 'oscillator',
            waveform: 'sine',
            frequency: { start: 50, end: 35 },
            volume: 0.17,
            duration: 0.8,
            envelope: { attack: 0.2, decay: 0.6 },
            modulation: {
                type: 'lfo',
                frequency: 4,
                depth: 8
            }
        },
        blackHoleConsume: {
            type: 'oscillator',
            waveform: 'triangle',
            frequency: { start: 80, end: 25 },
            volume: 0.12,
            duration: 0.25,
            envelope: { attack: 0.02, decay: 0.23 },
            tremolo: {
                frequency: 8,
                depth: 0.2
            }
        },
        gameOver: {
            type: 'oscillator',
            waveform: 'triangle',
            frequency: { start: 220, end: 55 },
            volume: 0.3,
            duration: 1.2,
            envelope: { attack: 0.15, decay: 1.05 }
        },
        bounce1: {
            type: 'oscillator',
            waveform: 'sine',
            frequency: { start: 180, end: 120 },
            volume: 0.08,
            duration: 0.08,
            envelope: { attack: 0.005, decay: 0.075 }
        },
        bounce2: {
            type: 'oscillator',
            waveform: 'triangle',
            frequency: { start: 220, end: 160 },
            volume: 0.09,
            duration: 0.06,
            envelope: { attack: 0.003, decay: 0.057 }
        },
        bounce3: {
            type: 'oscillator',
            waveform: 'sine',
            frequency: { start: 140, end: 100 },
            volume: 0.07,
            duration: 0.1,
            envelope: { attack: 0.008, decay: 0.092 }
        },
        bounce4: {
            type: 'oscillator',
            waveform: 'triangle',
            frequency: { start: 260, end: 200 },
            volume: 0.06,
            duration: 0.05,
            envelope: { attack: 0.002, decay: 0.048 }
        },
        bounce5: {
            type: 'oscillator',
            waveform: 'sine',
            frequency: { start: 160, end: 90 },
            volume: 0.085,
            duration: 0.09,
            envelope: { attack: 0.006, decay: 0.084 }
        },
        buttonPress: {
            type: 'oscillator',
            waveform: 'sine',
            frequency: { start: 320, end: 240 },
            volume: 0.05,
            duration: 0.06,
            envelope: { attack: 0.004, decay: 0.056 }
        },
        letterSwapStart: {
            type: 'oscillator',
            waveform: 'sine',
            frequency: { start: 280, end: 360 },
            volume: 0.05,
            duration: 0.07,
            envelope: { attack: 0.005, decay: 0.065 }
        },
        letterSwapEnd: {
            type: 'oscillator',
            waveform: 'sine',
            frequency: { start: 240, end: 200 },
            volume: 0.05,
            duration: 0.08,
            envelope: { attack: 0.003, decay: 0.077 }
        },
        // File-based UI sounds
        uiPuzzleSolved: {
            path: 'sounds/ui_puzzle_solved.mp3',
            volume: 0.3,
            attack: 0.1,
            release: 0.2
        },
        uiWordSolved1: {
            path: 'sounds/ui_word_solved_01.mp3',
            volume: 0.3,
            attack: 0.1,
            release: 0.2
        },
        uiWordSolved2: {
            path: 'sounds/ui_word_solved_02.mp3',
            volume: 0.3,
            attack: 0.1,
            release: 0.2
        },
        uiWordSolved3: {
            path: 'sounds/ui_word_solved_03.mp3',
            volume: 0.3,
            attack: 0.1,
            release: 0.2
        },
        // Template for file-based sounds (loaded from MP3/OGG files):
        // 'soundName': {
        //     path: 'sounds/effect.mp3',  // Path to audio file (relative to project root, supports .mp3 and .ogg)
        //     volume: 0.8,                 // Volume multiplier (0.0 to 1.0, multiplied by masterVolume)
        //     attack: 0.1,                 // Fade-in time in seconds
        //     release: 0.2                 // Fade-out time in seconds
        // },

        // Template for oscillator-based sounds (synthesized using Web Audio API):
        // 'oscillatorSound': {
        //     type: 'oscillator',          // Must be 'oscillator' for synthesized sounds
        //     waveform: 'sine',            // Waveform: 'sine', 'triangle', 'square', 'sawtooth'
        //     frequency: {                  // Frequency sweep over time
        //         start: 200,               // Starting frequency in Hz
        //         end: 150                  // Ending frequency in Hz
        //     },
        //     volume: 0.2,                 // Volume multiplier (0.0 to 1.0)
        //     duration: 0.3,               // Total sound duration in seconds
        //     envelope: {                  // Volume envelope shaping
        //         attack: 0.02,             // Attack time (fade-in) in seconds
        //         decay: 0.28               // Decay time (fade-out) in seconds
        //     },
        //     // Optional modulation effects:
        //     modulation: {                // LFO frequency modulation (wobble effect)
        //         type: 'lfo',
        //         frequency: 5,             // LFO frequency in Hz
        //         depth: 10                 // Modulation depth (affects frequency variation)
        //     },
        //     tremolo: {                   // Amplitude modulation (volume wobble)
        //         frequency: 8,             // Tremolo frequency in Hz
        //         depth: 0.3                // Tremolo depth (0.0 to 1.0, affects volume variation)
        //     }
        // }
    },

    // Effect groups for shared audio processing
    // Sounds can be assigned to groups to share reverb, delay, and compression effects
    effectGroups: {
        // Template for an effect group:
        // 'groupName': {
        //     reverb: {                    // Reverb effect (simulates room acoustics)
        //         time: 1.5,               // Reverb decay time in seconds
        //         decay: 2.0,              // Reverb decay rate
        //         mix: 0.3                 // Wet/dry mix (0.0 = dry, 1.0 = wet)
        //     },
        //     delay: {                     // Delay effect (echo)
        //         feedback: 0.3,           // Delay feedback amount (0.0 to 1.0)
        //         time: 0.2,               // Delay time in seconds
        //         mix: 0.2                 // Wet/dry mix (0.0 = dry, 1.0 = wet)
        //     },
        //     compressor: {                // Dynamics compression (evens out volume)
        //         threshold: -10,          // Threshold in dB (-100 to 0)
        //         knee: 30,                // Knee softness (0 to 40)
        //         attack: 0.003,           // Attack time in seconds (0 to 1)
        //         release: 0.25,           // Release time in seconds (0 to 1)
        //         ratio: 12                // Compression ratio (1 to 20)
        //     }
        // }
    },

    // Event mapping from game events to sound variations
    // Maps game event names to arrays of sound IDs for random playback
    eventMap: {
        // Template for event mapping:
        // 'gameEventName': ['soundId1', 'soundId2', 'soundId3']
        // - If array has 1 sound: always plays that sound
        // - If array has multiple sounds: randomly selects one, avoiding immediate repetition
        // - Game events are triggered by the sound manager listening to window events

        // Game event mappings
        'buttonPress': ['buttonPress'],

        // Direct sound event mappings (for testing oscillator sounds)
        'blackHoleCollected': ['blackHoleCollected'],
        'merge': ['merge'],
        'blackHoleDrop': ['blackHoleDrop'],
        'blackHoleConsume': ['blackHoleConsume'],
        'gameOver': ['gameOver'],
        'bounce': ['bounce1', 'bounce2', 'bounce3', 'bounce4', 'bounce5'],
        'bounce1': ['bounce1'],
        'bounce2': ['bounce2'],
        'bounce3': ['bounce3'],
        'bounce4': ['bounce4'],
        'bounce5': ['bounce5'],
        'toggleOn': ['toggleOn'],
        'toggleOff': ['toggleOff'],

        // Letter swapping sound events
        'letterSwapStart': ['letterSwapStart'],
        'letterSwapEnd': ['letterSwapEnd'],

        // UI sound events
        'wordSolved': ['uiWordSolved1', 'uiWordSolved2', 'uiWordSolved3'],
        'puzzleSolved': ['uiPuzzleSolved'],

    }
};

// Expose the audio configuration globally
window.headlinesAudio = headlinesAudio;