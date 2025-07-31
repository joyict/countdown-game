// Game state management
export let gameState = {
    score: 0,
    streak: 0,
    maxStreak: 0,
    gameActive: true,
    gameStarted: false,
    missedClicks: 0,
    speedMultiplier: 1,
    achievements: new Set(),
    
    // Game modes
    currentGameMode: 'normal',
    lives: 3,
    timeLeft: 30,
    rushTimer: null,
    chaosCount: 1,
    levelTimeLimit: 60,
    levelTimer: null,
    currentLevel: 1,
    
    // Power-ups
    activePowerUps: new Set(),
    powerUpTimers: new Map(),
    
    // Dynamic backgrounds
    currentTheme: 'default',
    
    // Movement patterns
    currentPatternIndex: 0,
    teleportMode: false,
    chasingMode: false,
    invisibilityTimer: null,
    evilGuyClones: [],
    cursorPosition: { x: 0, y: 0 },
    
    // Leaderboard
    leaderboard: []
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
    
    // Clear power-ups
    gameState.activePowerUps.clear();
    
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

export function updateScore(points) {
    gameState.score += points;
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
}

export function updateStreak(newStreak) {
    gameState.streak = newStreak;
    gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);
    document.getElementById('streak').textContent = `Streak: ${gameState.streak}`;
}

export function updateLives(newLives) {
    gameState.lives = newLives;
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;
}

export function updateSpeed(newSpeed) {
    gameState.speedMultiplier = newSpeed;
    document.getElementById('speed').textContent = `Speed: ${gameState.speedMultiplier.toFixed(1)}x`;