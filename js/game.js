// Main game controller
import { gameState, resetGameState } from './gameState.js';
import { SoundManager, loadSoundPreference } from './soundManager.js';
import { rotateVibeMessage, createParticle, createSparkle } from './ui.js';
import { catchDancer, catchEvilGuy, handleMiss, changeMovementPattern } from './gameLogic.js';
import { loadLeaderboard, updateLeaderboardDisplay, submitScoreFromStart, skipHighScore, toggleLeaderboard } from './leaderboard.js';

// Initialize sound manager
const soundManager = new SoundManager();

// Make functions globally available
window.startGame = startGame;
window.catchDancer = (event) => catchDancer(event, soundManager);
window.catchEvilGuy = (event) => catchEvilGuy(event, soundManager);
window.resetGame = resetGame;
window.setGameMode = setGameMode;
window.submitScoreFromStart = submitScoreFromStart;
window.skipHighScore = skipHighScore;
window.toggleLeaderboard = toggleLeaderboard;

export function startGame() {
    if (gameState.gameStarted && gameState.gameActive) return;
    
    resetGameState();
    
    gameState.gameStarted = true;
    gameState.gameActive = true;
    document.getElementById('startScreen').classList.add('hidden');
    
    // Initialize audio context on first interaction
    if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
        soundManager.audioContext.resume();
    }
    
    // Play start sound
    soundManager.playSuccess();
    
    // Start game mechanics
    changeMovementPattern();
    startLevelTimer();
    
    document.getElementById('vibeMessage').textContent = "Game Started! Catch the dancing man! 🎯";
}

export function showStartScreen() {
    gameState.gameStarted = false;
    gameState.gameActive = false;
    document.getElementById('startScreen').classList.remove('hidden');
    resetGameState();
}

function resetGame() {
    loadSoundPreference(soundManager);
    showStartScreen();
}

function setGameMode(mode) {
    if (!gameState.gameActive && gameState.currentGameMode !== 'normal') return;
    
    resetGame();
    gameState.currentGameMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(mode + 'Mode').classList.add('active');
    
    // Configure mode-specific settings
    switch(mode) {
        case 'survival':
            document.getElementById('gameText').textContent = 'Survival Mode - Avoid the evil guy!';
            break;
        case 'rush':
            gameState.timeLeft = 30;
            document.getElementById('timer').style.display = 'inline-block';
            document.getElementById('timer').textContent = `Time: ${gameState.timeLeft}s`;
            document.getElementById('levelTimer').style.display = 'none';
            document.getElementById('gameText').textContent = 'Rush Mode - 30 seconds!';
            if (gameState.levelTimer) {
                clearInterval(gameState.levelTimer);
                gameState.levelTimer = null;
            }
            startRushTimer();
            break;
        case 'chaos':
            gameState.chaosCount = 2;
            document.getElementById('gameText').textContent = 'Chaos Mode - Watch out for traps!';
            break;
        default:
            document.getElementById('timer').style.display = 'none';
            document.getElementById('levelTimer').style.display = 'inline-block';
            document.getElementById('gameText').textContent = 'Catch the dancing man, avoid the evil guy!';
    }
    
    document.getElementById('lives').style.display = 'inline-block';
}

function startLevelTimer() {
    if (gameState.currentGameMode === 'rush') return;
    
    gameState.levelTimeLimit = Math.max(60 - (gameState.currentLevel * 5), 20);
    let timeLeft = gameState.levelTimeLimit;
    
    document.getElementById('levelTimer').textContent = `Level Time: ${timeLeft}s`;
    
    gameState.levelTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('levelTimer').textContent = `Level Time: ${timeLeft}s`;
        
        if (timeLeft <= 5) {
            soundManager.playTone(800, 0.1, 'square');
            document.getElementById('levelTimer').style.color = '#ff0000';
        }
        
        if (timeLeft <= 0) {
            clearInterval(gameState.levelTimer);
            gameState.lives--;
            document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;
            document.getElementById('levelTimer').style.color = '#ff006e';
            
            if (gameState.lives <= 0) {
                handleMiss();
            } else {
                gameState.currentLevel++;
                document.getElementById('vibeMessage').textContent = `Time's up! Level ${gameState.currentLevel} - Lives: ${gameState.lives} ⏰`;
                startLevelTimer();
            }
        }
    }, 1000);
}

function startRushTimer() {
    gameState.rushTimer = setInterval(() => {
        gameState.timeLeft--;
        document.getElementById('timer').textContent = `Time: ${gameState.timeLeft}s`;
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.rushTimer);
            gameState.gameActive = false;
            document.getElementById('vibeMessage').textContent = `Rush Mode Complete! Final Score: ${gameState.score} 🏁`;
            soundManager.playGameOver();
            
            import('./leaderboard.js').then(({ checkHighScore }) => {
                checkHighScore();
            });
        } else if (gameState.timeLeft <= 5) {
            soundManager.playTone(1000, 0.1, 'square');
        }
    }, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Track cursor position for chasing behavior
    document.addEventListener('mousemove', (e) => {
        gameState.cursorPosition.x = e.clientX;
        gameState.cursorPosition.y = e.clientY;
    });
    
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            gameState.cursorPosition.x = e.touches[0].clientX;
            gameState.cursorPosition.y = e.touches[0].clientY;
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
        if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
            soundManager.audioContext.resume();
        }
    }, { once: true });
    
    // Handle Enter key in name input
    document.getElementById('startScreenPlayerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitScoreFromStart();
        }
    });
    
    // Initialize UI effects
    setInterval(rotateVibeMessage, 3000);
    setInterval(createParticle, 300);
    setInterval(createSparkle, 800);
    
    // Load sound preferences
    loadSoundPreference(soundManager);
    
    // Add fade-in effect
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

// Event listeners for miss detection
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.evil-guy') &&
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        !e.target.closest('.mode-btn') &&
        !e.target.closest('.power-ups') &&
        !e.target.closest('.leaderboard-modal') &&
        !e.target.closest('.start-screen') &&
        gameState.gameActive) {
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
        !e.target.closest('.start-screen') &&
        gameState.gameActive) {
        handleMiss();
    }
});