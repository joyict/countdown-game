// Vibe messages that rotate
const vibeMessages = [
    "Ready to test your reflexes? 🔥",
    "Catch them all! ⚡",
    "Lightning fast reactions! 🚀",
    "Master of the dance floor! 🌟",
    "Unstoppable catcher! 💫",
    "Reflexes of steel! 🛠️",
    "Dance floor domination! ⚡",
    "Precision and speed! 🌈",
    "The ultimate challenge! 🌍",
    "Ready to be amazed! ✨"
];

let currentVibeIndex = 0;

function rotateVibeMessage() {
    const vibeElement = document.getElementById('vibeMessage');
    vibeElement.style.opacity = '0';
    
    setTimeout(() => {
        currentVibeIndex = (currentVibeIndex + 1) % vibeMessages.length;
        vibeElement.textContent = vibeMessages[currentVibeIndex];
        vibeElement.style.opacity = '1';
    }, 300);
}

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 3 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
    
    document.getElementById('particles').appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 5000);
}

// Initialize
// Rotate vibe messages every 3 seconds
setInterval(rotateVibeMessage, 3000);

// Create particles every 300ms for more sparkle
setInterval(createParticle, 300);

// Add sparkle effects
function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    sparkle.innerHTML = '✨';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
        sparkle.remove();
    }, 2000);
}

setInterval(createSparkle, 800);

// Game functionality
let score = 0;
let streak = 0;
let maxStreak = 0;
let gameActive = true;
let missedClicks = 0;
let speedMultiplier = 1;
let achievements = new Set();

// Game modes
let currentGameMode = 'normal';
let lives = 3;
let timeLeft = 30;
let rushTimer = null;
let chaosCount = 1;
let levelTimeLimit = 60; // 60 seconds per level
let levelTimer = null;
let currentLevel = 1;

// Power-ups
let activePowerUps = new Set();
let powerUpTimers = new Map();

// Dynamic backgrounds
let currentTheme = 'default';
const themes = [
    { name: 'default', minScore: 0, displayName: 'Deep Space' },
    { name: 'neon', minScore: 50, displayName: 'Neon City' },
    { name: 'cosmic', minScore: 150, displayName: 'Cosmic Void' },
    { name: 'retro', minScore: 300, displayName: 'Retro Grid' },
    { name: 'matrix', minScore: 500, displayName: 'Matrix Code' },
    { name: 'cyberpunk', minScore: 700, displayName: 'Cyberpunk Alley' }
];

// Leaderboard
let leaderboard = [];
const API_BASE = '/.netlify/functions';

// Test function for debugging
window.testAPI = async function() {
    try {
        console.log('Testing API connection...');
        const response = await fetch(`${API_BASE}/test`);
        const result = await response.json();
        console.log('API Test Result:', result);
        return result;
    } catch (error) {
        console.error('API Test Failed:', error);
        return { error: error.message };
    }
};

// Sound effects (using Web Audio API for better performance)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
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

// Movement patterns for variety
const movementPatterns = [
    'dance-across',
    'dance-diagonal', 
    'dance-wave',
    'dance-zigzag',
    'dance-top',
    'dance-middle',
    'dance-reverse',
    'dance-vertical-up',
    'dance-vertical-down',
    'dance-corner-to-corner',
    'dance-spiral',
    'dance-figure-eight',
    'dance-random-walk',
    'dance-stop-and-go',
    'dance-feint',
    'dance-invisible-phases',
    'dance-circular',
    'dance-pendulum'
];

let currentPatternIndex = 0;
let teleportMode = false;
let chasingMode = false;
let invisibilityTimer = null;
let evilGuyClones = [];
let cursorPosition = { x: 0, y: 0 };

// Sound System
class SoundManager {
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

// Initialize sound manager
const soundManager = new SoundManager();

// Game state
let gameStarted = false;

function startGame() {
    if (gameStarted && gameActive) return; // Prevent multiple starts only if game is already active
    
    // Reset all game state first
    resetGameState();
    
    // Now start the game
    gameStarted = true;
    gameActive = true;
    document.getElementById('startScreen').classList.add('hidden');
    
    // Initialize audio context on first interaction
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // Play start sound
    playSound(800, 0.3, 'triangle');
    setTimeout(() => playSound(1000, 0.2, 'sine'), 200);
    
    // Start game mechanics
    changeMovementPattern();
    startLevelTimer();
    
    document.getElementById('vibeMessage').textContent = "Game Started! Catch the dancing man! 🎯";
}

function resetGameState() {
    // Stop all existing timers and intervals
    if (levelTimer) {
        clearInterval(levelTimer);
        levelTimer = null;
    }
    if (rushTimer) {
        clearInterval(rushTimer);
        rushTimer = null;
    }
    if (invisibilityTimer) {
        clearTimeout(invisibilityTimer);
        invisibilityTimer = null;
    }
    
    // Clear all power-up timers
    powerUpTimers.forEach(timer => clearTimeout(timer));
    powerUpTimers.clear();
    
    // Clean up clones and advanced patterns
    cleanupEvilGuyClones();
    
    // Reset character states
    const dancer = document.getElementById('dancingMan');
    const evilGuy = document.getElementById('evilGuy');
    
    // Remove all special classes
    dancer.classList.remove('chasing-cursor', 'temporarily-invisible', 'caught', 'teleport-out', 'teleport-in', 'golden-dancer');
    evilGuy.classList.remove('chasing-cursor', 'temporarily-invisible');
    
    // Reset positions and animations
    dancer.style.animation = 'none';
    evilGuy.style.animation = 'none';
    dancer.style.left = '-100px';
    dancer.style.bottom = '-20px';
    evilGuy.style.left = '-100px';
    evilGuy.style.bottom = '-20px';
    dancer.style.transform = '';
    evilGuy.style.transform = '';
    
    // Reset visibility
    dancer.style.display = 'block';
    evilGuy.style.display = 'none';
    
    // Reset dancing man image to normal
    const dancerImg = dancer.querySelector('.dancing-svg');
    if (dancerImg.src.includes('golden-dancer.png')) {
        dancerImg.src = 'dancing-man.svg';
        dancerImg.style.background = '';
    }
    
    // Reset game variables
    score = 0;
    streak = 0;
    maxStreak = 0;
    speedMultiplier = 1;
    lives = 3;
    currentLevel = 1;
    levelTimeLimit = 60;
    currentTheme = 'default';
    chasingMode = false;
    teleportMode = false;
    
    // Clear power-ups
    activePowerUps.clear();
    
    // Reset theme to default
    document.body.className = '';
    
    // Clear displays
    document.getElementById('powerUps').innerHTML = '';
    document.getElementById('achievements').innerHTML = '';
    
    // Hide high score section
    const highscoreSection = document.getElementById('highscoreSection');
    if (highscoreSection) {
        highscoreSection.style.display = 'none';
    }
    
    // Update UI displays
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('streak').textContent = 'Streak: 0';
    document.getElementById('speed').textContent = 'Speed: 1x';
    document.getElementById('lives').textContent = 'Lives: 3';
    document.getElementById('levelTimer').textContent = 'Level Time: 60s';
    document.getElementById('levelTimer').style.color = '#ff006e';
    
    // Reset mode-specific displays
    document.getElementById('timer').style.display = 'none';
    document.getElementById('levelTimer').style.display = 'inline-block';
}

function showStartScreen() {
    gameStarted = false;
    gameActive = false;
    document.getElementById('startScreen').classList.remove('hidden');
    
    // Use the comprehensive reset function
    resetGameState();
}

function catchDancer(event) {
    if (!gameActive) return;
    
    // Prevent event bubbling to avoid triggering miss detection
    event.stopPropagation();
    
    // Play catch sound
    playSound(800, 0.1, 'square');
    
    // Check if it's a golden dancer (power-up)
    const dancer = document.getElementById('dancingMan');
    const dancerImg = dancer.querySelector('.dancing-svg');
    const isGolden = dancerImg.src.includes('golden-dancer.png');
    
    if (isGolden) {
        activatePowerUp();
        // Revert back to normal dancing man
        dancerImg.src = 'dancing-man.svg';
        dancerImg.style.background = '';
        dancer.classList.remove('golden-dancer');
    }
    
    // Calculate score with power-up multipliers
    let points = 1;
    if (activePowerUps.has('double')) points *= 2;
    if (activePowerUps.has('triple')) points *= 3;
    
    score += points;
    streak++;
    maxStreak = Math.max(maxStreak, streak);
    
    // Update displays
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('streak').textContent = `Streak: ${streak}`;
    
    // Check for theme changes
    checkThemeChange();
    
    // Speed up the dancer (unless slow motion is active)
    if (!activePowerUps.has('slow')) {
        speedMultiplier = Math.min(1 + (score * 0.05), 3); // Max 3x speed
    }
    
    const baseDuration = 8;
    let newDuration = Math.max(baseDuration / speedMultiplier, 2); // Minimum 2 seconds
    
    if (activePowerUps.has('slow')) {
        newDuration *= 2; // Slow motion effect
    }
    
    // Change movement pattern randomly
    changeMovementPattern();
    
    dancer.style.animationDuration = newDuration + 's';
    document.getElementById('speed').textContent = `Speed: ${speedMultiplier.toFixed(1)}x`;
    
    // Screen shake for high streaks
    if (streak >= 10 && streak % 5 === 0) {
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }
    
    // Check for achievements
    checkAchievements();
    
    // Add catch animation
    dancer.classList.add('caught');
    setTimeout(() => dancer.classList.remove('caught'), 300);
    
    // Create celebration effect
    createCelebration();
    
    // Update vibe message based on streak
    updateVibeMessage();
    
    // Spawn golden dancer occasionally
function checkThemeChange() {
    // Find the appropriate theme for current score
    let newTheme = 'default';
    for (let i = themes.length - 1; i >= 0; i--) {
        if (score >= themes[i].minScore) {
            newTheme = themes[i].name;
            break;
        }
    }
    
    // Change theme if different from current
    if (newTheme !== currentTheme) {
        changeTheme(newTheme);
    }
}

function changeTheme(newTheme) {
    const body = document.body;
    
    // Remove current theme class
    if (currentTheme !== 'default') {
        body.classList.remove(`theme-${currentTheme}`);
    }
    
    // Add new theme class
    if (newTheme !== 'default') {
        body.classList.add(`theme-${newTheme}`);
    }
    
    currentTheme = newTheme;
    
    // Find theme display name
    const themeData = themes.find(t => t.name === newTheme);
    const themeName = themeData ? themeData.displayName : 'Deep Space';
    
    // Show theme change message
    if (newTheme !== 'default') {
        document.getElementById('vibeMessage').textContent = `🌟 Theme Unlocked: ${themeName}! 🌟`;
        
        // Play theme change sound
        playSound(1000, 0.3, 'triangle');
        setTimeout(() => playSound(1200, 0.2, 'sine'), 200);
        
        // Create theme change celebration
        createThemeCelebration();
    }
}

function createThemeCelebration() {
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const celebration = document.createElement('div');
            celebration.innerHTML = ['🌟', '✨', '🎨', '🌈', '💫', '🎭'][Math.floor(Math.random() * 6)];
            celebration.style.position = 'fixed';
            celebration.style.left = Math.random() * 100 + '%';
            celebration.style.top = Math.random() * 100 + '%';
            celebration.style.fontSize = '2.5rem';
            celebration.style.pointerEvents = 'none';
            celebration.style.zIndex = '1000';
            celebration.style.animation = 'theme-celebration 2s ease-out forwards';
            
            document.body.appendChild(celebration);
            
            setTimeout(() => celebration.remove(), 2000);
        }, i * 150);
    }
}

    if (Math.random() < 0.1 && !isGolden) { // 10% chance
        setTimeout(() => spawnGoldenDancer(), 2000);
    }
    
    // Chance to spawn evil guy on next appearance
    setTimeout(() => {
        if (gameActive && !spawnEvilGuy()) {
            // If no evil guy spawned, continue normal pattern
            changeMovementPattern();
        }
    }, 1000);
}

function changeMovementPattern() {
    const dancer = document.getElementById('dancingMan');
    
    // 25% chance for teleport mode, 15% for chasing mode, 10% for temporary invisibility
    const randomValue = Math.random();
    teleportMode = randomValue < 0.25;
    chasingMode = !teleportMode && randomValue < 0.4;
    const invisibilityMode = !teleportMode && !chasingMode && randomValue < 0.5;
    
    if (teleportMode) {
        teleportDancer();
        return;
    }
    
    if (chasingMode) {
        startChasingCursor(dancer);
        return;
    }
    
    if (invisibilityMode) {
        startTemporaryInvisibility(dancer);
        return;
    }
    
    // Choose a random pattern (but not the same as current)
    let newPatternIndex;
    do {
        newPatternIndex = Math.floor(Math.random() * movementPatterns.length);
    } while (newPatternIndex === currentPatternIndex && movementPatterns.length > 1);
    
    currentPatternIndex = newPatternIndex;
    const newPattern = movementPatterns[currentPatternIndex];
    
    // Reset animation to start the new pattern
    dancer.style.animation = 'none';
    dancer.offsetHeight; // Trigger reflow
    dancer.style.animation = `${newPattern} ${dancer.style.animationDuration || '8s'} infinite linear`;
}

function teleportDancer() {
    const dancer = document.getElementById('dancingMan');
    
    // Teleport out sound
    playSound(1500, 0.2, 'sawtooth');
    
    // Puff out effect
    dancer.classList.add('teleport-out');
    
    setTimeout(() => {
        // Move to random position
        const randomX = Math.random() * (window.innerWidth - 200);
        const randomY = Math.random() * (window.innerHeight - 200) + 50;
        
        dancer.style.left = randomX + 'px';
        dancer.style.bottom = randomY + 'px';
        dancer.style.animation = 'none';
        
        // Teleport in sound
        playSound(800, 0.2, 'triangle');
        
        // Puff in effect
        dancer.classList.remove('teleport-out');
        dancer.classList.add('teleport-in');
        
        setTimeout(() => {
            dancer.classList.remove('teleport-in');
            
            // Start a new movement pattern from this position
            const newPattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
            dancer.style.animation = `${newPattern} ${dancer.style.animationDuration || '8s'} infinite linear`;
            
            // Reset position after animation completes
            setTimeout(() => {
                dancer.style.left = '-100px';
                dancer.style.bottom = '-20px';
            }, parseFloat(dancer.style.animationDuration || '8') * 1000);
            
        }, 300);
    }, 300);
}

function checkAchievements() {
    const newAchievements = [];
    
    if (score === 1 && !achievements.has('first')) {
        achievements.add('first');
        newAchievements.push('🎯 First Catch!');
    }
    if (score === 10 && !achievements.has('ten')) {
        achievements.add('ten');
        newAchievements.push('🔥 Double Digits!');
    }
    if (score === 25 && !achievements.has('quarter')) {
        achievements.add('quarter');
        newAchievements.push('⚡ Quarter Century!');
    }
    if (streak === 5 && !achievements.has('streak5')) {
        achievements.add('streak5');
        newAchievements.push('🌟 5 Streak!');
    }
    if (streak === 10 && !achievements.has('streak10')) {
        achievements.add('streak10');
        newAchievements.push('🚀 10 Streak Master!');
    }
    if (speedMultiplier >= 2 && !achievements.has('speed2x')) {
        achievements.add('speed2x');
        newAchievements.push('💨 Speed Demon!');
    }
    if (score === 50 && !achievements.has('fifty')) {
        achievements.add('fifty');
        newAchievements.push('👑 Half Century King!');
    }
    if (teleportMode && !achievements.has('teleport')) {
        achievements.add('teleport');
        newAchievements.push('✨ Teleport Master!');
    }
    
    // Display new achievements
    newAchievements.forEach(achievement => {
        const achievementEl = document.createElement('div');
        achievementEl.className = 'achievement';
        achievementEl.textContent = achievement;
        document.getElementById('achievements').appendChild(achievementEl);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (achievementEl.parentNode) {
                achievementEl.parentNode.removeChild(achievementEl);
            }
        }, 5000);
    });
}

function updateVibeMessage() {
    let messages;
    
    if (streak >= 10) {
        messages = ["UNSTOPPABLE! 🔥🔥", "LEGENDARY STREAK! 👑", "DANCING GOD! ⚡⚡"];
    } else if (streak >= 5) {
        messages = ["ON FIRE! 🔥", "STREAK MASTER! ⚡", "UNSTOPPABLE! 🚀"];
    } else if (score >= 25) {
        messages = ["EXPERT CATCHER! 🎯", "DANCE MASTER! 💃", "LIGHTNING FAST! ⚡"];
    } else {
        messages = [
            "Nice catch! 🎯",
            "Smooth moves! 💃",
            "You got him! 🔥",
            "Dancing master! ⚡",
            "Keep it up! 🌟",
            "On fire! 🚀"
        ];
    }
    
    const vibeElement = document.getElementById('vibeMessage');
    vibeElement.textContent = messages[Math.floor(Math.random() * messages.length)];
}

// Reset streak on miss (clicking empty space)
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        gameActive) {
        if (streak > 0) {
            streak = 0;
            document.getElementById('streak').textContent = `Streak: ${streak}`;
            document.getElementById('vibeMessage').textContent = "Missed! Streak reset! 💔";
        }
    }
});

// Add touch support for mobile
document.addEventListener('touchstart', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        gameActive) {
        if (streak > 0) {
            streak = 0;
            document.getElementById('streak').textContent = `Streak: ${streak}`;
            document.getElementById('vibeMessage').textContent = "Missed! Streak reset! 💔";
        }
    }
});

// Game mode functions
function setGameMode(mode) {
    if (!gameActive && currentGameMode !== 'normal') return;
    
    // Reset game state
    resetGame();
    currentGameMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(mode + 'Mode').classList.add('active');
    
    // Configure mode-specific settings
    switch(mode) {
        case 'survival':
            document.getElementById('gameText').textContent = 'Survival Mode - Avoid the evil guy!';
            break;
        case 'rush':
            timeLeft = 30;
            document.getElementById('timer').style.display = 'inline-block';
            document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
            document.getElementById('levelTimer').style.display = 'none';
            document.getElementById('gameText').textContent = 'Rush Mode - 30 seconds!';
            if (levelTimer) {
                clearInterval(levelTimer);
                levelTimer = null;
            }
            startRushTimer();
            break;
        case 'chaos':
            chaosCount = 2;
            document.getElementById('gameText').textContent = 'Chaos Mode - Watch out for traps!';
            spawnChaosMode();
            break;
        default:
            document.getElementById('timer').style.display = 'none';
            document.getElementById('levelTimer').style.display = 'inline-block';
            document.getElementById('gameText').textContent = 'Catch the dancing man, avoid the evil guy!';
    }
    
    // Always show lives in all modes now
    document.getElementById('lives').style.display = 'inline-block';
}

function resetGame() {
    score = 0;
    streak = 0;
    speedMultiplier = 1;
    lives = 3;
    currentLevel = 1;
    levelTimeLimit = 60;
    currentTheme = 'default';
    activePowerUps.clear();
    powerUpTimers.forEach(timer => clearTimeout(timer));
    powerUpTimers.clear();
    
    if (rushTimer) {
        clearInterval(rushTimer);
        rushTimer = null;
    }
    
    if (levelTimer) {
        clearInterval(levelTimer);
        levelTimer = null;
    }
    
    // Reset theme to default
    document.body.className = '';
    
    // Clear power-up display
    document.getElementById('powerUps').innerHTML = '';
    
    // Hide evil guy
    document.getElementById('evilGuy').style.display = 'none';
    document.getElementById('dancingMan').style.display = 'block';
    
    // Update displays
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('streak').textContent = 'Streak: 0';
    document.getElementById('speed').textContent = 'Speed: 1x';
    document.getElementById('lives').textContent = 'Lives: 3';
    document.getElementById('levelTimer').textContent = 'Level Time: 60s';
    
    gameActive = true;
    startLevelTimer();
}

function startRushTimer() {
    rushTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            endRushMode();
        } else if (timeLeft <= 5) {
            // Urgent beeping
            playSound(1000, 0.1, 'square');
        }
    }, 1000);
}

function endRushMode() {
    clearInterval(rushTimer);
    gameActive = false;
    document.getElementById('vibeMessage').textContent = `Rush Mode Complete! Final Score: ${score} 🏁`;
    playSound(400, 0.5, 'sawtooth'); // End sound
    
    // Check if it's a high score
    checkHighScore();
}

function endGame() {
    gameActive = false;
    gameStarted = false; // Allow new games to start
    
    // Show start screen after a delay
    setTimeout(() => {
        showStartScreen();
    }, 3000);
    
    checkHighScore();
}

function handleMiss() {
    // All modes now have lives system
    lives--;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    playSound(200, 0.3, 'sawtooth'); // Miss sound
    
    if (lives <= 0) {
        gameActive = false;
        // Stop all animations
        const dancer = document.getElementById('dancingMan');
        const evilGuy = document.getElementById('evilGuy');
        dancer.style.animation = 'none';
        evilGuy.style.animation = 'none';
        dancer.style.display = 'none';
        evilGuy.style.display = 'none';
        
        // Clear any running timers
        if (levelTimer) {
            clearInterval(levelTimer);
            levelTimer = null;
        }
        if (rushTimer) {
            clearInterval(rushTimer);
            rushTimer = null;
        }
        
        document.getElementById('vibeMessage').textContent = `Game Over! Final Score: ${score} 💀`;
        endGame();
        return;
    }
    
    if (streak > 0) {
        streak = 0;
        document.getElementById('streak').textContent = `Streak: ${streak}`;
        document.getElementById('vibeMessage').textContent = `Missed! Lives: ${lives} 💔`;
    }
}

// Power-up system
function activatePowerUp() {
    const powerUps = ['slow', 'double', 'freeze', 'giant'];
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    playSound(1200, 0.2, 'triangle'); // Power-up sound
    
    switch(powerUp) {
        case 'slow':
            activePowerUps.add('slow');
            showPowerUp('🐌 Slow Motion', 10000);
            powerUpTimers.set('slow', setTimeout(() => {
                activePowerUps.delete('slow');
                removePowerUp('🐌 Slow Motion');
            }, 10000));
            break;
        case 'double':
            activePowerUps.add('double');
            showPowerUp('⚡ Double Points', 15000);
            powerUpTimers.set('double', setTimeout(() => {
                activePowerUps.delete('double');
                removePowerUp('⚡ Double Points');
            }, 15000));
            break;
        case 'freeze':
            const dancer = document.getElementById('dancingMan');
            dancer.style.animationPlayState = 'paused';
            showPowerUp('❄️ Freeze', 3000);
            setTimeout(() => {
                dancer.style.animationPlayState = 'running';
                removePowerUp('❄️ Freeze');
            }, 3000);
            break;
        case 'giant':
            activePowerUps.add('giant');
            const dancerGiant = document.getElementById('dancingMan');
            dancerGiant.style.transform += ' scale(1.5)';
            showPowerUp('🔍 Giant Mode', 8000);
            powerUpTimers.set('giant', setTimeout(() => {
                activePowerUps.delete('giant');
                dancerGiant.style.transform = dancerGiant.style.transform.replace(' scale(1.5)', '');
                removePowerUp('🔍 Giant Mode');
            }, 8000));
            break;
    }
}

function showPowerUp(text, duration) {
    const powerUpEl = document.createElement('div');
    powerUpEl.className = 'power-up';
    powerUpEl.textContent = text;
    powerUpEl.dataset.powerup = text;
    document.getElementById('powerUps').appendChild(powerUpEl);
}

function removePowerUp(text) {
    const powerUpEl = document.querySelector(`[data-powerup="${text}"]`);
    if (powerUpEl) powerUpEl.remove();
}

function spawnGoldenDancer() {
    const dancer = document.getElementById('dancingMan');
    const dancerImg = dancer.querySelector('.dancing-svg');
    
    // Change to golden dancer image
    dancerImg.src = 'golden-dancer.png';
    dancerImg.style.background = 'transparent';
    dancer.classList.add('golden-dancer');
    
    // Remove golden effect after 5 seconds if not caught
    setTimeout(() => {
        // Revert back to normal dancing man if still golden
        if (dancerImg.src.includes('golden-dancer.png')) {
            dancerImg.src = 'dancing-man.svg';
            dancerImg.style.background = '';
        }
        dancer.classList.remove('golden-dancer');
    }, 5000);
}

function spawnEvilGuy() {
    // 25% chance to spawn evil guy instead of dancing man
    if (Math.random() < 0.25) {
        document.getElementById('dancingMan').style.display = 'none';
        const evilGuy = document.getElementById('evilGuy');
        evilGuy.style.display = 'block';
        
        // 30% chance for chasing behavior, 20% for group spawn, 10% for invisibility
        const behaviorRandom = Math.random();
        
        if (behaviorRandom < 0.3) {
            // Chasing cursor behavior
            startChasingCursor(evilGuy, true);
        } else if (behaviorRandom < 0.5) {
            // Group spawn behavior
            spawnEvilGuyGroup();
        } else if (behaviorRandom < 0.6) {
            // Temporary invisibility
            startTemporaryInvisibility(evilGuy);
        } else {
            // Regular movement pattern
            const pattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
            evilGuy.style.animation = 'none';
            evilGuy.offsetHeight; // Trigger reflow
            evilGuy.style.animation = `${pattern} ${8 / speedMultiplier}s infinite linear`;
        }
        
        // Hide evil guy after animation and show dancing man
        setTimeout(() => {
            evilGuy.style.display = 'none';
            evilGuy.classList.remove('chasing-cursor', 'temporarily-invisible');
            document.getElementById('dancingMan').style.display = 'block';
            cleanupEvilGuyClones();
        }, (8 / speedMultiplier) * 1000);
        
        return true;
    }
    return false;
}

function catchEvilGuy(event) {
    if (!gameActive) return;
    
    event.stopPropagation();
    
    // Play evil sound
    playSound(150, 0.5, 'sawtooth');
    
    // Lose a life
    lives--;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    
    // Reset streak
    streak = 0;
    document.getElementById('streak').textContent = `Streak: ${streak}`;
    
    // Hide evil guy immediately
    document.getElementById('evilGuy').style.display = 'none';
    document.getElementById('dancingMan').style.display = 'block';
    
    // Create negative effect
    createNegativeEffect();
    
    // Check if game over
    if (lives <= 0) {
        gameActive = false;
        // Stop all animations
        const dancer = document.getElementById('dancingMan');
        const evilGuy = document.getElementById('evilGuy');
        dancer.style.animation = 'none';
        evilGuy.style.animation = 'none';
        dancer.style.display = 'none';
        evilGuy.style.display = 'none';
        
        // Clear any running timers
        if (levelTimer) {
            clearInterval(levelTimer);
            levelTimer = null;
        }
        if (rushTimer) {
            clearInterval(rushTimer);
            rushTimer = null;
        }
        
        document.getElementById('vibeMessage').textContent = `Game Over! Final Score: ${score} 💀`;
        endGame();
    } else {
        document.getElementById('vibeMessage').textContent = `Evil guy caught you! Lives: ${lives} 😈`;
    }
}

function createNegativeEffect() {
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const effect = document.createElement('div');
            effect.innerHTML = ['💀', '😈', '🔥', '💥', '⚡'][Math.floor(Math.random() * 5)];
            effect.style.position = 'fixed';
            effect.style.left = Math.random() * 100 + '%';
            effect.style.top = Math.random() * 100 + '%';
            effect.style.fontSize = '2rem';
            effect.style.pointerEvents = 'none';
            effect.style.zIndex = '1000';
            effect.style.color = '#ff0000';
            effect.style.animation = 'negative-effect 1s ease-out forwards';
            
            document.body.appendChild(effect);
            
            setTimeout(() => effect.remove(), 1000);
        }, i * 100);
    }
}

function startLevelTimer() {
    if (currentGameMode === 'rush') return; // Rush mode has its own timer
    
    levelTimeLimit = Math.max(60 - (currentLevel * 5), 20); // Decrease time per level, minimum 20s
    let timeLeft = levelTimeLimit;
    
    document.getElementById('levelTimer').textContent = `Level Time: ${timeLeft}s`;
    
    levelTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('levelTimer').textContent = `Level Time: ${timeLeft}s`;
        
        if (timeLeft <= 5) {
            // Urgent warning
            playSound(800, 0.1, 'square');
            document.getElementById('levelTimer').style.color = '#ff0000';
        }
        
        if (timeLeft <= 0) {
            // Time's up - lose a life
            clearInterval(levelTimer);
            lives--;
            document.getElementById('lives').textContent = `Lives: ${lives}`;
            document.getElementById('levelTimer').style.color = '#ff006e';
            
            if (lives <= 0) {
                gameActive = false;
                // Stop all animations
                const dancer = document.getElementById('dancingMan');
                const evilGuy = document.getElementById('evilGuy');
                dancer.style.animation = 'none';
                evilGuy.style.animation = 'none';
                dancer.style.display = 'none';
                evilGuy.style.display = 'none';
                
                // Clear any running timers
                if (levelTimer) {
                    clearInterval(levelTimer);
                    levelTimer = null;
                }
                if (rushTimer) {
                    clearInterval(rushTimer);
                    rushTimer = null;
                }
                
                document.getElementById('vibeMessage').textContent = `Time's up! Final Score: ${score} ⏰`;
                endGame();
            } else {
                // Start next level
                currentLevel++;
                document.getElementById('vibeMessage').textContent = `Time's up! Level ${currentLevel} - Lives: ${lives} ⏰`;
                startLevelTimer();
            }
        }
    }, 1000);
}

function spawnChaosMode() {
    // This would require more complex implementation with multiple dancers
    // For now, just increase speed significantly
    speedMultiplier = 2;
}

// Update miss detection to handle game modes
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.evil-guy') &&
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        !e.target.closest('.mode-btn') &&
        !e.target.closest('.power-ups') &&
        !e.target.closest('.leaderboard-modal') &&
        !e.target.closest('.score-modal') &&
        gameActive) {
        handleMiss();
    }
});

document.addEventListener('touchstart', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.evil-guy') &&
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        !e.target.closest('.mode-btn') &&
        !e.target.closest('.power-ups') &&
        !e.target.closest('.leaderboard-modal') &&
        !e.target.closest('.score-modal') &&
        gameActive) {
        handleMiss();
    }
});

// Leaderboard functions
function checkHighScore() {
    // Show high score section if score is greater than 0
    if (score > 0) {
        // Show the high score section on start screen
        document.getElementById('startScreenScore').textContent = score;
        document.getElementById('highscoreSection').style.display = 'block';
        
        // Focus on the name input
        const nameInput = document.getElementById('startScreenPlayerName');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 500);
        }
    }
}
    
    if (score > minScoreForLeaderboard) {
        document.getElementById('startScreenScore').textContent = score;
        document.getElementById('scoreModal').style.display = 'flex';
        document.getElementById('playerName').focus();
    }
}

async function submitScore() {
    const playerName = document.getElementById('playerName').value.trim() || 'Anonymous';
    
    try {
        console.log('Submitting score to:', `${API_BASE}/submit-score`);
        const response = await fetch(`${API_BASE}/submit-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: score,
                mode: currentGameMode,
                streak: maxStreak
            })
        });
        
        if (!response.ok) {
            console.error('Submit response not OK:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Score submitted successfully:', result);
        
        closeScoreModal();
        await loadLeaderboard(); // Refresh leaderboard
        
        // Show success message
        document.getElementById('vibeMessage').textContent = `${playerName} added to leaderboard! 🏆`;
        
    } catch (error) {
        console.error('Error submitting score:', error);
        
        // Fallback to localStorage
        console.log('Falling back to localStorage');
        const newEntry = {
            name: playerName,
            score: score,
            mode: currentGameMode,
            streak: maxStreak,
            created_at: new Date().toISOString()
        };
        
        let localLeaderboard = JSON.parse(localStorage.getItem('dancingManLeaderboard')) || [];
        localLeaderboard.push(newEntry);
        localLeaderboard.sort((a, b) => b.score - a.score);
        localLeaderboard = localLeaderboard.slice(0, 10);
        localStorage.setItem('dancingManLeaderboard', JSON.stringify(localLeaderboard));
        
        closeScoreModal();
        await loadLeaderboard();
        
        document.getElementById('vibeMessage').textContent = `${playerName} added to local leaderboard! 📱`;
    }
}

function closeScoreModal() {
    document.getElementById('scoreModal').style.display = 'none';
    document.getElementById('playerName').value = '';
}

async function toggleLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        await loadLeaderboard();
        updateLeaderboardDisplay();
    }
}

async function loadLeaderboard() {
    try {
        console.log('Loading leaderboard from:', `${API_BASE}/get-leaderboard`);
        const response = await fetch(`${API_BASE}/get-leaderboard`);
        
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Leaderboard loaded:', data);
        leaderboard = data;
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        console.log('Falling back to localStorage');
        // Fallback to localStorage if API fails
        leaderboard = JSON.parse(localStorage.getItem('dancingManLeaderboard')) || [];
        
        // Show user that we're in offline mode
        if (document.getElementById('leaderboardModal').style.display === 'flex') {
            const list = document.getElementById('leaderboardList');
            list.insertAdjacentHTML('afterbegin', `
                <div style="background: rgba(255,165,0,0.2); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; text-align: center;">
                    ⚠️ Offline Mode - Scores saved locally only
                </div>
            `);
        }
    }
}

function updateLeaderboardDisplay() {
    const list = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
        list.innerHTML = '<div class="no-scores">No scores yet! Be the first! 🚀</div>';
        return;
    }
    
    list.innerHTML = leaderboard.map((entry, index) => {
        const date = new Date(entry.created_at || entry.date);
        const timeAgo = getTimeAgo(date);
        const isTopScore = index === 0;
        
        return `
            <div class="leaderboard-entry ${isTopScore ? 'top-score' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${entry.name} ${isTopScore ? '👑' : ''}</div>
                    <div class="player-details">
                        ${entry.mode} • Streak: ${entry.streak} • ${timeAgo}
                    </div>
                </div>
                <div class="player-score">${entry.score}</div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Initialize with random pattern
document.addEventListener('DOMContentLoaded', async () => {
    // Track cursor position for chasing behavior
    document.addEventListener('mousemove', (e) => {
        cursorPosition.x = e.clientX;
        cursorPosition.y = e.clientY;
    });
    
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            cursorPosition.x = e.touches[0].clientX;
            cursorPosition.y = e.touches[0].clientY;
        }
    });
    
    await loadLeaderboard();
    updateLeaderboardDisplay();
    
    // Refresh leaderboard every 30 seconds
    setInterval(async () => {
        await loadLeaderboard();
        if (document.getElementById('leaderboardModal').style.display === 'flex') {
            updateLeaderboardDisplay();
        }
    }, 30000);
    
    // Add mobile-specific styling
    if (window.innerWidth <= 768) {
        document.body.style.touchAction = 'manipulation';
        document.querySelector('.vibes-section').style.minHeight = '200px';
    }
    
    // Initialize audio context on first user interaction
    document.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
    
    // Handle Enter key in name input
    document.getElementById('startScreenPlayerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitScoreFromStart();
        }
    });
});

function createCelebration() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const celebration = document.createElement('div');
            celebration.innerHTML = ['🎉', '✨', '🔥', '⚡', '🌟'][Math.floor(Math.random() * 5)];
            celebration.style.position = 'fixed';
            celebration.style.left = Math.random() * 100 + '%';
            celebration.style.top = Math.random() * 100 + '%';
            celebration.style.fontSize = '2rem';
            celebration.style.pointerEvents = 'none';
            celebration.style.zIndex = '1000';
            celebration.style.animation = 'celebration-pop 1s ease-out forwards';
            
            document.body.appendChild(celebration);
            
            setTimeout(() => celebration.remove(), 1000);
        }, i * 100);
    }
}

// Add celebration animation to CSS dynamically
const celebrationStyle = document.createElement('style');
celebrationStyle.textContent = `
    @keyframes celebration-pop {
        0% { transform: scale(0) rotate(0deg); opacity: 1; }
        50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
        100% { transform: scale(0) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(celebrationStyle);

// Advanced movement pattern functions
function startChasingCursor(element, isEvilGuy = false) {
    element.classList.add('chasing-cursor');
    element.style.animation = 'none';
    
    const chaseDuration = isEvilGuy ? 6000 : 8000; // Evil guy chases for shorter time
    const chaseSpeed = isEvilGuy ? 200 : 300; // Evil guy is faster
    
    const chaseInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(chaseInterval);
            return;
        }
        
        const rect = element.getBoundingClientRect();
        const currentX = rect.left;
        const currentY = window.innerHeight - rect.bottom;
        
        // Calculate direction to cursor with some lag for more natural movement
        const targetX = cursorPosition.x - 40; // Center on cursor
        const targetY = window.innerHeight - cursorPosition.y - 40;
        
        // Add some randomness to make it less perfect
        const randomOffsetX = (Math.random() - 0.5) * 50;
        const randomOffsetY = (Math.random() - 0.5) * 50;
        
        const finalX = Math.max(0, Math.min(window.innerWidth - 80, targetX + randomOffsetX));
        const finalY = Math.max(0, Math.min(window.innerHeight - 80, targetY + randomOffsetY));
        
        element.style.left = finalX + 'px';
        element.style.bottom = finalY + 'px';
        
    }, chaseSpeed);
    
    // Stop chasing after duration
    setTimeout(() => {
        clearInterval(chaseInterval);
        element.classList.remove('chasing-cursor');
        
        // Return to normal movement
        if (gameActive) {
            const pattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
            element.style.animation = `${pattern} ${8 / speedMultiplier}s infinite linear`;
            
            // Reset position after animation
            setTimeout(() => {
                element.style.left = '-100px';
                element.style.bottom = '-20px';
            }, (8 / speedMultiplier) * 1000);
        }
    }, chaseDuration);
    
    // Play chasing sound
    playSound(600, 0.3, 'sawtooth');
}

function startTemporaryInvisibility(element) {
    const totalDuration = 8000;
    const invisiblePhases = [
        { start: 2000, duration: 1500 },
        { start: 5000, duration: 1000 },
        { start: 6500, duration: 800 }
    ];
    
    // Apply normal movement pattern first
    const pattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = `${pattern} ${totalDuration / 1000}s infinite linear`;
    
    // Schedule invisibility phases
    invisiblePhases.forEach(phase => {
        setTimeout(() => {
            element.classList.add('temporarily-invisible');
            playSound(1200, 0.2, 'triangle'); // Disappear sound
            
            setTimeout(() => {
                element.classList.remove('temporarily-invisible');
                playSound(800, 0.2, 'sine'); // Reappear sound
            }, phase.duration);
        }, phase.start);
    });
}

function spawnEvilGuyGroup() {
    const mainEvilGuy = document.getElementById('evilGuy');
    const groupSize = Math.floor(Math.random() * 3) + 2; // 2-4 evil guys
    
    // Apply pattern to main evil guy
    const pattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
    mainEvilGuy.style.animation = 'none';
    mainEvilGuy.offsetHeight;
    mainEvilGuy.style.animation = `${pattern} ${8 / speedMultiplier}s infinite linear`;
    
    // Create clones
    for (let i = 0; i < groupSize - 1; i++) {
        setTimeout(() => {
            const clone = document.createElement('div');
            clone.className = 'evil-guy-clone';
            clone.innerHTML = '<img src="evil-guy.svg" alt="Evil Guy Clone" class="evil-svg" />';
            clone.onclick = (e) => catchEvilGuyClone(e, clone);
            clone.ontouchstart = (e) => catchEvilGuyClone(e, clone);
            
            // Random starting position and pattern
            const clonePattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
            const delay = Math.random() * 2; // Random delay up to 2 seconds
            
            clone.style.animationDelay = delay + 's';
            clone.style.animation = `${clonePattern} ${(8 / speedMultiplier) + delay}s infinite linear`;
            
            document.body.appendChild(clone);
            evilGuyClones.push(clone);
            
            // Remove clone after animation
            setTimeout(() => {
                if (clone.parentNode) {
                    clone.parentNode.removeChild(clone);
                }
                evilGuyClones = evilGuyClones.filter(c => c !== clone);
            }, ((8 / speedMultiplier) + delay) * 1000);
            
        }, i * 500); // Stagger clone appearances
    }
    
    // Play group spawn sound
    playSound(400, 0.5, 'sawtooth');
    setTimeout(() => playSound(350, 0.3, 'sawtooth'), 200);
}

function catchEvilGuyClone(event, clone) {
    if (!gameActive) return;
    
    event.stopPropagation();
    
    // Same penalty as main evil guy
    playSound(150, 0.5, 'sawtooth');
    
    lives--;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    
    streak = 0;
    document.getElementById('streak').textContent = `Streak: ${streak}`;
    
    // Remove the clone immediately
    if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
    }
    evilGuyClones = evilGuyClones.filter(c => c !== clone);
    
    createNegativeEffect();
    
    if (lives <= 0) {
        gameActive = false;
        // Stop all animations and clean up
        const dancer = document.getElementById('dancingMan');
        const evilGuy = document.getElementById('evilGuy');
        dancer.style.animation = 'none';
        evilGuy.style.animation = 'none';
        dancer.style.display = 'none';
        evilGuy.style.display = 'none';
        
        cleanupEvilGuyClones();
        
        if (levelTimer) {
            clearInterval(levelTimer);
            levelTimer = null;
        }
        if (rushTimer) {
            clearInterval(rushTimer);
            rushTimer = null;
        }
        
        document.getElementById('vibeMessage').textContent = `Game Over! Final Score: ${score} 💀`;
        endGame();
    } else {
        document.getElementById('vibeMessage').textContent = `Evil clone got you! Lives: ${lives} 😈`;
    }
}

function cleanupEvilGuyClones() {
    evilGuyClones.forEach(clone => {
        if (clone.parentNode) {
            clone.parentNode.removeChild(clone);
        }
    });
    evilGuyClones = [];
}
function toggleSound() {
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

// Load sound preference
function loadSoundPreference() {
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


// Update reset game to clean up advanced patterns
function resetGame() {
    loadSoundPreference();
    // Show start screen instead of auto-starting
    showStartScreen();
}
// Add some extra flair on load
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});