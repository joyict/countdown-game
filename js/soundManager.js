// Sound System
export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Resume audio context (required for user interaction)
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Generate a tone with specified frequency, duration, and type
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;

        this.resumeContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;

        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Success sound for catching dancing man
    playSuccess() {
        // Happy ascending chord
        this.playTone(523, 0.15, 'sine', 0.2); // C5
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.2), 50); // E5
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.25), 100); // G5
    }

    // Special sound for golden dancer
    playGoldenSuccess() {
        // Magical ascending arpeggio
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'triangle', 0.15), i * 80);
        });
    }

    // Negative sound for evil guy
    playError() {
        // Descending buzz
        this.playTone(200, 0.3, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.15), 100);
    }

    // Game over sound
    playGameOver() {
        // Sad descending sequence
        const notes = [392, 349, 311, 262]; // G4, F4, Eb4, C4
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.4, 'triangle', 0.2), i * 200);
        });
    }

    // Combo sound (gets higher with combo count)
    playCombo(comboCount) {
        const baseFreq = 440 + (comboCount * 50);
        this.playTone(baseFreq, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(baseFreq * 1.5, 0.1, 'square', 0.1), 50);
    }

    // Theme unlock sound
    playUnlock() {
        // Triumphant fanfare
        this.playTone(523, 0.2, 'triangle', 0.2); // C5
        setTimeout(() => this.playTone(659, 0.2, 'triangle', 0.2), 100); // E5
        setTimeout(() => this.playTone(784, 0.2, 'triangle', 0.2), 200); // G5
        setTimeout(() => this.playTone(1047, 0.4, 'triangle', 0.25), 300); // C6
    }
}

// Legacy sound function for backward compatibility
export function playSound(frequency, duration, type = 'sine') {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

export function toggleSound(soundManager) {
    soundManager.enabled = !soundManager.enabled;
    const soundBtn = document.getElementById('sound-btn');
    
    if (soundManager.enabled) {
        soundBtn.textContent = '🔊 Sound';
        soundBtn.classList.remove('muted');
        // Play a test sound
        soundManager.playSuccess();
    } else {
        soundBtn.textContent = '🔇 Sound';
        soundBtn.classList.add('muted');
    }
    
    // Save sound preference
    localStorage.setItem('soundEnabled', soundManager.enabled);
}

export function loadSoundPreference(soundManager) {
    const savedSoundEnabled = localStorage.getItem('soundEnabled');
    if (savedSoundEnabled !== null) {
        soundManager.enabled = savedSoundEnabled === 'true';
        const soundBtn = document.getElementById('sound-btn');
        
        if (!soundManager.enabled) {
            soundBtn.textContent = '🔇 Sound';
            soundBtn.classList.add('muted');
        }
    }
}