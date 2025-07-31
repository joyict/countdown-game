// js/gameState.js
import { MOVEMENT_PATTERNS } from './constants.js';
import { cleanupEvilGuyClones } from './evilGuy.js';

export let gameState = {
    score: 0,
    streak: 0,
    maxStreak: 0,
    gameActive: false,
    gameStarted: false,
    speedMultiplier: 1,
    achievements: new Set(),
    currentGameMode: 'normal',
    lives: 3,
    timeLeft: 30, // For rush mode
    rushTimer: null,
    chaosCount: 1,
    levelTimeLimit: 60,
    levelTimer: null,
    currentLevel: 1,
    currentTheme: 'default',
    activePowerUps: new Set(),
    powerUpTimers: new Map(),
    currentPatternIndex: 0,
    teleportMode: false,
    chasingMode: false,
    invisibilityTimer: null,
    cursorPosition: { x: 0, y: 0 },
    currentVibeIndex: 0, // For vibe messages
};

export function resetGameState() {
    // Stop all existing timers and intervals
    if (gameState.levelTimer) {
        clearInterval(gameState.levelTimer);
        gameState.levelTimer = null;
    }
    if (gameState.rushTimer) {
        clearInterval(gameState.rushTimer);
        gameState.rushTimer = null;
    }
    if (gameState.invisibilityTimer) {
        clearTimeout(gameState.invisibilityTimer);
        gameState.invisibilityTimer = null;
    }

    // Clear all power-up timers
    gameState.powerUpTimers.forEach(timer => clearTimeout(timer));
    gameState.powerUpTimers.clear();

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
    gameState.score = 0;
    gameState.streak = 0;
    gameState.maxStreak = 0;
    gameState.speedMultiplier = 1;
    gameState.lives = 3;
    gameState.currentLevel = 1;
    gameState.levelTimeLimit = 60;
    gameState.currentTheme = 'default';
    gameState.chasingMode = false;
    gameState.teleportMode = false;
    gameState.currentGameMode = 'normal'; // Reset game mode to normal
    gameState.currentPatternIndex = 0; // Reset movement pattern index
    gameState.currentVibeIndex = 0; // Reset vibe message index

    // Clear power-ups
    gameState.activePowerUps.clear();

    // Reset theme to default
    document.body.className = '';

    // Clear displays
    document.getElementById('powerUps').innerHTML = '';
    document.getElementById('achievements').innerHTML = '';

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

    // Reset mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('normalMode').classList.add('active');