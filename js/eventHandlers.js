// js/eventHandlers.js
import { gameState } from './gameState.js';
import { catchDancer, setGameMode, resetGame } from './gameLogic.js';
import { catchEvilGuy, cleanupEvilGuyClones } from './evilGuy.js';
import { submitScoreFromStart, skipHighScore, showStartScreen } from './startScreen.js';
import { toggleLeaderboard } from './leaderboard.js';
import { SoundManager } from './soundManager.js';

// Initialize sound manager
const soundManager = new SoundManager();

export function initEventHandlers() {
    // Make functions globally available for HTML onclick attributes
    window.startGame = () => {
        // Ensure audio context is resumed on first user interaction
        if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
            soundManager.audioContext.resume();
        }
        // Call the actual startGame from game.js
        import('./game.js').then(({ startGame }) => startGame());
    };
    window.catchDancer = (event) => catchDancer(event);
    window.catchEvilGuy = (event) => catchEvilGuy(event);
    window.resetGame = () => resetGame();
    window.setGameMode = (mode) => setGameMode(mode);
    window.submitScoreFromStart = () => submitScoreFromStart();
    window.skipHighScore = () => skipHighScore();
    window.toggleLeaderboard = () => toggleLeaderboard();

    // Track cursor position for chasing behavior
    document.addEventListener('mousemove', (e) => {
        gameState.cursorPosition.x = e.clientX;
        gameState.cursorPosition.y = e.clientY;
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            gameState.cursorPosition.x = e.touches.clientX;
            gameState.cursorPosition.y = e.touches.clientY;
        }
    });

    // Initialize audio context on first user interaction
    document.addEventListener('click', () => {
        if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
            soundManager.audioContext.resume();
        }
    }, { once: true });

    // Handle Enter key in name input on start screen
    document.getElementById('startScreenPlayerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitScoreFromStart();
        }
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

    // Sound toggle button
    document.getElementById('sound-btn').addEventListener('click', () => {
        soundManager.toggleSound();
    });
}