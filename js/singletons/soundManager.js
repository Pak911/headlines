/**
 * Sound Manager - Global Audio Controller for Headlines Crossword Game
 *
 * Dual audio system:
 * - Pizzicato.js sample-based sounds (primary) with effect groups
 * - Web Audio API oscillator sounds (fallback) for legacy support
 *
 * Follows the Singleton pattern to ensure single audio context management.
 * Handles audio mixing, event-driven sound effects, and basic volume control.
 */

(function() {
    'use strict';

    // Web Audio API (for oscillators)
    let audioContext = null;
    let masterVolume = 1.0;
    let isEnabled = true;
    let initialized = false;
    let audioContextReady = false; // Track if AudioContext has been created after user interaction

    // Page visibility tracking
    let hasFocus = true; // True if page/window has focus

    // Pizzicato system (sample-based sounds with priority)
    let pizzicatoInitialized = false;
    let samplesConfig = {
        sounds: {},
        effectGroups: {},
        eventMap: {}
    };

    // Pizzicato runtime state
    const effectGroupInstances = new Map(); // 'group_id' → Pizzicato.Group
    const soundInstances = new Map(); // 'sound_id' → Pizzicato.Sound
    const lastPlayedSounds = new Map(); // 'event_name' → 'sound_id' (for no-repeat randomization)
    const lastEventPlayTime = new Map(); // 'event_name' → timestamp (for event cooldown)

    // Loading state tracking
    let totalSoundsToLoad = 0;
    let soundsLoaded = 0;
    let loadingComplete = false;

    // Global audio settings
    let soundEventsCooldownMs = 100; // Default cooldown between sound events in milliseconds

    // Logging helper function
    function _log(message, options = {}) {
        // Force always log for debugging
        options.always = true;
        if (window.__cosic && typeof window.__cosic.flog === 'function') {
            window.__cosic.flog('soundManager', message, options);
        } else {
            console.log('[soundManager]', message);
        }
    }

    /**
     * Initialize the audio context and event listeners
     */
    function init() {
        if (initialized) return;

        try {
            // Set up event listeners for game events
            setupEventListeners();

            // Set up user interaction listener for autoplay policy
            setupUserInteractionListener();

            // Set up page visibility listener for pausing audio when tab loses focus
            setupPageVisibilityListener();

            // Load settings from global config (this will create AudioContext on first user interaction)
            loadSettings();

            initialized = true;
            _log('Sound Manager initialized successfully (AudioContext will be created on first user interaction)');
        } catch (e) {
            console.error('[soundManager] Failed to initialize sound manager:', e);
            isEnabled = false;
        }
    }

    /**
     * Dynamically load Pizzicato.js script
     * Required for WebKit/iOS where AudioContext must be created after user interaction
     */
    function loadPizzicatoScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof Pizzicato !== 'undefined') {
                _log('Pizzicato already loaded');
                resolve();
                return;
            }

            // Check if AudioContext is supported before loading Pizzicato
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                _log('AudioContext not supported - skipping Pizzicato load');
                resolve(); // Resolve anyway to continue without Pizzicato
                return;
            }

            _log('Loading Pizzicato.js dynamically...');
            const script = document.createElement('script');
            // Use different path for test vs main game
            const isTestMode = document.location.pathname.includes('/test/');
            script.src = isTestMode ? '../libs/pizzicato.min.js' : 'libs/pizzicato.min.js';
            script.async = false; // Load synchronously to ensure order
            script.onload = () => {
                _log('Pizzicato.js loaded successfully');
                resolve();
            };
            script.onerror = (error) => {
                console.error('[soundManager] Failed to load Pizzicato.js:', error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Set up listener for first user interaction to create/resume AudioContext
     * Required by browser autoplay policies
     */
    function setupUserInteractionListener() {
        const initAudioContext = async () => {
            if (audioContextReady) return; // Already initialized

            _log('User interaction detected, checking AudioContext support...');

            // Step 0: Check if AudioContext is supported in this environment
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                _log('AudioContext not supported in this environment - audio disabled');
                isEnabled = false;
                audioContextReady = true; // Mark as "ready" to prevent retries
                return;
            }

            _log('AudioContext supported, initializing audio system...');

            // Step 1: Load Pizzicato.js dynamically (WebKit/iOS requires this)
            try {
                await loadPizzicatoScript();
            } catch (e) {
                console.error('[soundManager] Failed to load Pizzicato, continuing with oscillators only:', e);
            }

            // Step 2: Create AudioContext on first interaction
            if (!audioContext) {
                try {
                    audioContext = new AudioContextClass();
                    _log('AudioContext created successfully');
                    _log('AudioContext state: ' + audioContext.state);
                } catch (e) {
                    console.error('[soundManager] Failed to create AudioContext:', e);
                    isEnabled = false;
                    audioContextReady = true; // Mark as "ready" to prevent retries
                    return;
                }
            }

            // Step 3: Resume AudioContext if suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    _log('AudioContext resumed successfully');
                    audioContextReady = true;

                    // Wait 200ms before initializing any audio (prevents clicks)
                    initializeAudioAfterDelay();
                }).catch(err => {
                    console.error('[soundManager] Failed to resume AudioContext:', err);
                    audioContextReady = true; // Mark as "ready" even on failure
                });
            } else {
                audioContextReady = true;

                // Wait 200ms before initializing any audio (prevents clicks)
                initializeAudioAfterDelay();
            }
        };

        // Listen for various user interaction events
        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(eventType => {
            document.addEventListener(eventType, initAudioContext, { once: true, passive: true });
        });

        _log('User interaction listener set up for AudioContext creation');
    }

    /**
     * Initialize all audio systems after a delay to prevent clicks
     */
    function initializeAudioAfterDelay() {
        setTimeout(async () => {
            _log('Initializing audio systems after 200ms delay...');

            // Initialize Pizzicato sound system if not already done
            if (!pizzicatoInitialized && typeof Pizzicato !== 'undefined') {
                await initializePizzicato();
            }
        }, 200);
    }

    /**
     * Set up Page Visibility API listener to pause/resume audio when tab loses/gains focus
     */
    function setupPageVisibilityListener() {
        const handleVisibilityChange = (e) => {
            // Determine focus based on all possible event types
            if (e.type === 'pagehide' || e.type === 'blur' || document.hidden) {
                hasFocus = false;
            } else if (e.type === 'pageshow' || e.type === 'focus' || !document.hidden) {
                hasFocus = true;
            }

            _log(`Visibility Event: ${e.type} | hasFocus: ${hasFocus}`);
            updateMusicPlaybackState();
        };

        // Standard Visibility API
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // iOS Reliability: pagehide/pageshow are better for system suspension
        window.addEventListener('pagehide', handleVisibilityChange);
        window.addEventListener('pageshow', handleVisibilityChange);

        // Application switching backups
        window.addEventListener('blur', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        _log('Consolidated iOS-ready visibility listeners set up');
    }

    /**
     * Update music playback state based on focus (placeholder for future music system)
     */
    function updateMusicPlaybackState() {
        // For now, this is a placeholder. Music system will be added later if needed.
        // Currently handles AudioContext resumption for iOS
        if (hasFocus && audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                _log('AudioContext resumed via visibility check');
            });
        }
    }

    /**
     * Set up event listeners for cosmic events
     */
    function setupEventListeners() {
        _log('Setting up event listeners...');

        // Example event listeners - these will be expanded as game events are added
        // For now, these are placeholders to demonstrate the event-driven system

        // Listen for button press events
        window.addEventListener('headlines:buttonPress', (event) => {
            _log('BUTTON PRESS EVENT RECEIVED');
            playEventSound('buttonPress');
        });

        _log('Event listeners configured');
    }

    /**
     * Load audio settings from the global configuration
     */
    function loadSettings() {
        const settings = window.headlinesAudio;
        if (!settings) {
            console.error('[soundManager] No headlinesAudio settings found!');
            return;
        }

        // Load master settings
        masterVolume = settings.masterVolume ?? 1.0;
        isEnabled = settings.enabled ?? true;

        // Load sample-based sounds (priority system)
        samplesConfig.sounds = settings.sounds || {};
        samplesConfig.effectGroups = settings.effectGroups || {};
        samplesConfig.eventMap = settings.eventMap || {};

        _log('Settings loaded: masterVolume=' + masterVolume + ', isEnabled=' + isEnabled);
        _log('Sounds: ' + Object.keys(samplesConfig.sounds).length);
        _log('Effect groups: ' + Object.keys(samplesConfig.effectGroups).length);
        _log('Event mappings: ' + Object.keys(samplesConfig.eventMap).length);

        // Don't initialize Pizzicato yet - wait for user interaction + delay
        if (!isEnabled) {
            _log('Audio disabled (enabled=false), using oscillators only');
        } else {
            _log('Pizzicato will be initialized after first user interaction + 500ms delay');
        }
    }

    /**
     * Initialize Pizzicato sound system: create effect groups and load sounds
     */
    async function initializePizzicato() {
        if (pizzicatoInitialized) {
            _log('Pizzicato already initialized');
            return;
        }

        _log('Initializing Pizzicato sound system...');

        try {
            // Step 1: Create effect groups asynchronously
            await buildEffectGroupsAsync();

            // Step 2: Load all sounds asynchronously
            await buildSoundsAsync();

            pizzicatoInitialized = true;
            _log('Pizzicato initialization completed');
        } catch (e) {
            console.error('[soundManager] Failed to initialize Pizzicato:', e);
        }
    }

    /**
     * Create Pizzicato effect groups from configuration asynchronously
     */
    function buildEffectGroupsAsync() {
        return new Promise((resolve) => {
            const groupEntries = Object.entries(samplesConfig.effectGroups);

            if (groupEntries.length === 0) {
                _log('No effect groups to create');
                resolve();
                return;
            }

            let groupIndex = 0;
            const createNextGroup = () => {
                if (groupIndex < groupEntries.length) {
                    const [groupId, groupConfig] = groupEntries[groupIndex];

                    // Create group and add effects
                    const group = new Pizzicato.Group();

                    // Add compressor effect first if configured
                    if (groupConfig.compressor) {
                        const compressor = new Pizzicato.Effects.Compressor(groupConfig.compressor);
                        group.addEffect(compressor);
                        _log('Added Compressor to group "' + groupId + '"');
                    }

                    // Add reverb effect if configured
                    if (groupConfig.reverb) {
                        const reverb = new Pizzicato.Effects.Reverb(groupConfig.reverb);
                        group.addEffect(reverb);
                        _log('Added Reverb to group "' + groupId + '"');
                    }

                    // Add delay effect if configured
                    if (groupConfig.delay) {
                        const delay = new Pizzicato.Effects.Delay(groupConfig.delay);
                        group.addEffect(delay);
                        _log('Added Delay to group "' + groupId + '"');
                    }

                    effectGroupInstances.set(groupId, group);
                    groupIndex++;

                    // Schedule next group creation asynchronously
                    setTimeout(createNextGroup, 0);
                } else {
                    _log('Created ' + effectGroupInstances.size + ' effect groups');
                    resolve();
                }
            };

            createNextGroup();
        });
    }

    /**
     * Load all sounds and create instances asynchronously
     */
    function buildSoundsAsync() {
        return new Promise((resolve) => {
            const soundEntries = Object.entries(samplesConfig.sounds);

            if (soundEntries.length === 0) {
                _log('No sounds to load');
                loadingComplete = true;
                resolve();
                return;
            }

            // Calculate total instances to load
            totalSoundsToLoad = soundEntries.length;
            soundsLoaded = 0;

            _log('Loading ' + totalSoundsToLoad + ' sound instances asynchronously...');

            // Load each sound
            let soundIndex = 0;
            const loadNextSound = () => {
                if (soundIndex < soundEntries.length) {
                    const [soundId, soundConfig] = soundEntries[soundIndex];
                    loadSoundInstance(soundId, soundConfig);
                    soundIndex++;
                    // Schedule next sound loading asynchronously
                    setTimeout(loadNextSound, 0);
                } else {
                    // All sounds initiated, resolve the promise
                    resolve();
                }
            };
            loadNextSound();
        });
    }

    /**
     * Load a single sound instance
     */
    function loadSoundInstance(soundId, soundConfig) {
        // Check if it's an oscillator sound (fallback) or file-based
        if (soundConfig.type === 'oscillator') {
            // Oscillator sounds are handled differently - just store the config
            soundInstances.set(soundId, soundConfig);
            soundsLoaded++;
            _log('Loaded oscillator sound: ' + soundId);

            // Check if all sounds loaded
            if (soundsLoaded === totalSoundsToLoad) {
                loadingComplete = true;
                _log('All sounds loaded successfully!');
                _log('Total instances: ' + soundsLoaded);
            }
            return;
        }

        // File-based sound - load via Pizzicato
        // Calculate final volume: sound volume * master volume
        const soundVolume = soundConfig.volume !== undefined ? soundConfig.volume : 1.0;
        const finalVolume = soundVolume * masterVolume;

        const soundInstance = new Pizzicato.Sound({
            source: 'file',
            options: {
                path: soundConfig.path,
                volume: finalVolume,
                attack: soundConfig.attack !== undefined ? soundConfig.attack : 0.04,
                release: soundConfig.release !== undefined ? soundConfig.release : 0.0
            }
        }, function(error) {
            if (error) {
                console.error('[soundManager] Failed to load sound: ' + soundConfig.path, error);
                soundsLoaded++; // Count as finished even on error

                // Check if all sounds processed
                if (soundsLoaded === totalSoundsToLoad) {
                    loadingComplete = true;
                    _log('Sound loading complete (with errors)');
                }
                return;
            }

            // On successful load
            soundsLoaded++;

            // Log progress
            if (soundsLoaded % 5 === 0 || soundsLoaded === totalSoundsToLoad) {
                _log('Loading progress: ' + soundsLoaded + '/' + totalSoundsToLoad);
            }

            // Check if all sounds loaded
            if (soundsLoaded === totalSoundsToLoad) {
                loadingComplete = true;
                _log('All sounds loaded successfully!');
                _log('Total instances: ' + soundsLoaded);
            }
        });

        // Store the instance
        soundInstances.set(soundId, soundInstance);
    }

    /**
     * Check if a sound event can be played based on cooldown timing
     * @param {string} eventName - Name of the sound event
     * @returns {boolean} - True if event can be played, false if on cooldown
     */
    function canPlayEventSound(eventName) {
        const now = Date.now();
        const lastPlayTime = lastEventPlayTime.get(eventName) || 0;
        const timeSinceLastPlay = now - lastPlayTime;

        return timeSinceLastPlay >= soundEventsCooldownMs;
    }

    /**
     * Mark a sound event as played (update its cooldown timestamp)
     * @param {string} eventName - Name of the sound event
     */
    function markEventSoundPlayed(eventName) {
        lastEventPlayTime.set(eventName, Date.now());
    }

    /**
     * Play an event sound - routes to Pizzicato samples or oscillator fallback
     * @param {string} eventName - Name of the game event (e.g., 'buttonPress')
     */
    function playEventSound(eventName) {
        if (!isEnabled) {
            return;
        }

        // Check event cooldown for sample-based sounds
        if (samplesConfig.eventMap[eventName]) {
            if (!canPlayEventSound(eventName)) {
                _log(`Skipping sound event "${eventName}" - cooldown active`);
                return;
            }
        }

        // Priority 1: Check if event exists in sample-based system
        if (samplesConfig.eventMap[eventName]) {
            playSampleSound(eventName);
            markEventSoundPlayed(eventName);
            return;
        }

        // Priority 2: Fallback to oscillator system
        // Check if there's an oscillator sound with this name
        const oscillatorConfig = soundInstances.get(eventName);
        if (oscillatorConfig && oscillatorConfig.type === 'oscillator') {
            playOscillatorSound(oscillatorConfig);
            return;
        }

        _log('No sound found for event: ' + eventName);
    }

    /**
     * Play a sample-based sound using Pizzicato with no-repeat randomization
     */
    function playSampleSound(eventName) {
        if (!loadingComplete) {
            _log('Sounds still loading, skipping: ' + eventName);
            return;
        }

        const soundIds = samplesConfig.eventMap[eventName];
        if (!soundIds || soundIds.length === 0) {
            _log('No sounds mapped for event: ' + eventName);
            return;
        }

        let selectedSoundId;

        // Smart randomization: avoid immediate repetition
        if (soundIds.length === 1) {
            // Only one sound, always play it
            selectedSoundId = soundIds[0];
        } else {
            // Multiple sounds: pick random excluding last played
            const lastPlayed = lastPlayedSounds.get(eventName);
            const availableSounds = lastPlayed ? soundIds.filter(id => id !== lastPlayed) : soundIds;

            if (availableSounds.length === 0) {
                // Failsafe: if somehow all filtered out, use full array
                selectedSoundId = soundIds[Math.floor(Math.random() * soundIds.length)];
            } else {
                selectedSoundId = availableSounds[Math.floor(Math.random() * availableSounds.length)];
            }

            // Remember this choice for next time
            lastPlayedSounds.set(eventName, selectedSoundId);
        }

        // Play the selected sound
        playSoundById(selectedSoundId);
    }

    /**
     * Play sound by its ID
     */
    function playSoundById(soundId) {
        const soundInstance = soundInstances.get(soundId);

        if (!soundInstance) {
            _log('No sound instance found for: ' + soundId);
            return;
        }

        // Check if it's an oscillator sound
        if (soundInstance.type === 'oscillator') {
            playOscillatorSound(soundInstance);
            return;
        }

        // Pizzicato sound
        _log('Playing sound: ' + soundId);

        // Stop if already playing, then play
        soundInstance.stop();
        soundInstance.play();
    }

    /**
     * Play an oscillator-based sound effect
     * @param {object} config - Sound configuration
     */
    function playOscillatorSound(config) {
        _log('Playing oscillator sound');

        if (!isEnabled || !initialized || !audioContext) {
            // Silently skip if AudioContext not ready yet
            return;
        }

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            let lfoOscillator = null;
            let lfoGain = null;
            let tremoloOscillator = null;
            let tremoloGain = null;

            // Connect basic audio nodes
            oscillator.connect(gainNode);

            // Add frequency modulation (LFO) for wobbling effect if specified
            if (config.modulation) {
                lfoOscillator = audioContext.createOscillator();
                lfoGain = audioContext.createGain();

                lfoOscillator.type = 'sine';
                lfoOscillator.frequency.setValueAtTime(config.modulation.frequency, audioContext.currentTime);
                lfoGain.gain.setValueAtTime(config.modulation.depth, audioContext.currentTime);

                lfoOscillator.connect(lfoGain);
                lfoGain.connect(oscillator.frequency);
            }

            // Add tremolo (amplitude modulation) for absorption effect if specified
            let finalGainNode = gainNode;
            if (config.tremolo) {
                tremoloOscillator = audioContext.createOscillator();
                tremoloGain = audioContext.createGain();
                const tremoloDepthGain = audioContext.createGain();

                tremoloOscillator.type = 'sine';
                tremoloOscillator.frequency.setValueAtTime(config.tremolo.frequency, audioContext.currentTime);
                tremoloGain.gain.setValueAtTime(config.tremolo.depth, audioContext.currentTime);
                tremoloDepthGain.gain.setValueAtTime(1, audioContext.currentTime);

                // Create tremolo effect by modulating volume
                tremoloOscillator.connect(tremoloGain);
                tremoloGain.connect(tremoloDepthGain.gain);

                gainNode.connect(tremoloDepthGain);
                finalGainNode = tremoloDepthGain;
            }

            finalGainNode.connect(audioContext.destination);

            // Use custom waveform if provided
            oscillator.type = config.waveform;

            // Use custom frequency
            let startFreq = config.frequency.start;
            let endFreq = config.frequency.end;

            oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
            if (endFreq !== startFreq) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    Math.max(endFreq, 20), // Prevent frequency going too low
                    audioContext.currentTime + config.duration
                );
            }

            // Configure volume envelope
            const volume = config.volume * masterVolume;
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + config.envelope.attack);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + config.duration
            );

            // Play the sound and any modulation oscillators
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + config.duration);

            if (lfoOscillator) {
                lfoOscillator.start(audioContext.currentTime);
                lfoOscillator.stop(audioContext.currentTime + config.duration);
            }

            if (tremoloOscillator) {
                tremoloOscillator.start(audioContext.currentTime);
                tremoloOscillator.stop(audioContext.currentTime + config.duration);
            }
        } catch (e) {
            console.error('[soundManager] Error playing oscillator sound:', e);
        }
    }

    /**
     * Set master volume (0.0 to 1.0)
     */
    function setMasterVolume(volume) {
        masterVolume = Math.max(0, Math.min(1, volume));
        _log('Master volume set to: ' + masterVolume);
    }

    /**
     * Enable or disable all sound effects
     */
    function setEnabled(enabled) {
        isEnabled = enabled;
        _log('Sound effects ' + (enabled ? 'enabled' : 'disabled'));
    }

    /**
     * Get current audio state
     */
    function getState() {
        return {
            initialized,
            enabled: isEnabled,
            masterVolume,
            contextState: audioContext?.state || 'unavailable',
            pizzicatoReady: loadingComplete,
            soundsLoaded: soundsLoaded,
            totalSounds: totalSoundsToLoad
        };
    }

    // Initialize on first access
    function ensureInitialized() {
        if (!initialized) {
            init();
        }
    }

    // Expose the public API
    const soundManager = {
        // Core functionality
        init,
        playEventSound,

        // Configuration
        setMasterVolume,
        setEnabled,
        getState,

        // Getters
        get initialized() { return initialized; },
        get enabled() { return isEnabled; },
        get masterVolume() { return masterVolume; },
        get loadingProgress() { return totalSoundsToLoad > 0 ? soundsLoaded / totalSoundsToLoad : 1; }
    };

    // Auto-initialize when accessed
    const proxiedSoundManager = new Proxy(soundManager, {
        get(target, prop) {
            ensureInitialized();
            return target[prop];
        }
    });

    // Expose globally
    window.__headlines_sound = proxiedSoundManager;

    // Force initialization to set up event listeners
    ensureInitialized();

    // Always log that the module loaded
    _log('Sound Manager module loaded');
})();