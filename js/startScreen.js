// js/startScreen.js
import { gameState, resetGameState } from './gameState.js';
import { loadLeaderboard, updateLeaderboardDisplay } from './leaderboard.js';
import { SoundManager } from './soundManager.js'; // Import SoundManager
import { playSound } from './soundManager.js'; // Import playSound directly

const soundManager = new SoundManager(); // Instantiate SoundManager

export function showStartScreen() {
    gameState.gameStarted = false;
    gameState.gameActive = false;
    document.getElementById('startScreen').classList.remove('hidden');

    // Hide high score section by default
    document.getElementById('highscoreSection').style.display = 'none';
    document.getElementById('startScreenPlayerName').value = '';

    resetGameState();
}

export function submitScoreFromStart() {
    const playerNameInput = document.getElementById('startScreenPlayerName');
    const playerName = playerNameInput.value.trim() || 'Anonymous';

    if (gameState.score === 0) {
        // If score is 0, just skip and restart
        skipHighScore();
        return;
    }

    // Submit score to leaderboard (API or localStorage fallback)
    import('./leaderboard.js').then(({ submitScore }) => {
        submitScore(playerName, gameState.score, gameState.currentGameMode, gameState.maxStreak);
    });

    // Hide high score section
    document.getElementById('highscoreSection').style.display = 'none';
    playerNameInput.value = ''; // Clear input
    showStartScreen(); // Go back to main start screen
}

export function skipHighScore() {
    document.getElementById('highscoreSection').style.display = 'none';
    document.getElementById('startScreenPlayerName').value = '';
    showStartScreen(); // Go back to main start screen
}

export function checkHighScoreDisplay() {
    if (gameState.score > 0) { // Only show if score is greater than 0
        document.getElementById('startScreenScore').textContent = gameState.score;
        document.getElementById('highscoreSection').style.display = 'block';
        document.getElementById('startScreenPlayerName').focus();
        playSound(1000, 0.3, 'triangle'); // Play a sound for new high score prompt
    } else {
        document.getElementById('highscoreSection').style.display = 'none';
    }
}