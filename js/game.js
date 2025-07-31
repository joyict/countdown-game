// js/game.js
import { gameState, resetGameState } from './gameState.js';
import { soundManager, loadSoundPreference } from './soundManager.js';
import { rotateVibeMessage, createParticle, createSparkle } from './ui.js';
import { initEventHandlers } from './eventHandlers.js';
import { loadLeaderboard, updateLeaderboardDisplay } from './leaderboard.js';
import { changeMovementPattern } from './movement.js';
import { startLevelTimer, startRushTimer } from './gameLogic.js';

export function startGame() {
    if (gameState.gameStarted && gameState.gameActive) return;

    resetGameState();

    gameState.gameStarted = true;
    gameState.gameActive = true;
    document.getElementById('startScreen').classList.add('hidden');

    // Play start sound
    soundManager.playSuccess();

    // Start game mechanics
    changeMovementPattern();
    startLevelTimer();

    document.getElementById('vibeMessage').textContent = "Game Started! Catch the dancing man! 🎯";
}

export function resetGame() {
    loadSoundPreference(); // Load sound preference from localStorage
    resetGameState(); // Reset all game state variables
    document.getElementById('startScreen').classList.remove('hidden'); // Show start screen
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initEventHandlers(); // Set up all event listeners

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

    // Initialize UI effects
    setInterval(rotateVibeMessage, 3000);
    setInterval(createParticle, 300);
    setInterval(createSparkle, 800);

    // Load sound preferences
    loadSoundPreference();

    // Add fade-in effect
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});