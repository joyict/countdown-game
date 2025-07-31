// js/gameLogic.js
import { gameState } from './gameState.js';
import { soundManager } from './soundManager.js';
import { checkThemeChange } from './themes.js';
import { checkAchievements } from './achievements.js';
import { updateVibeMessage, createCelebration, showPowerUp, removePowerUp } from './ui.js';
import { changeMovementPattern } from './movement.js';
import { spawnEvilGuy } from './evilGuy.js';
import { checkHighScoreDisplay } from './startScreen.js';

export function catchDancer(event) {
    if (!gameState.gameActive) return;

    // Prevent event bubbling to avoid triggering miss detection
    event.stopPropagation();

    // Play catch sound
    soundManager.playSuccess();

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
    if (gameState.activePowerUps.has('double')) points *= 2;
    if (gameState.activePowerUps.has('triple')) points *= 3; // Assuming 'triple' is a possible power-up

    gameState.score += points;
    gameState.streak++;
    gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);

    // Update displays
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    document.getElementById('streak').textContent = `Streak: ${gameState.streak}`;

    // Check for theme changes
    checkThemeChange();

    // Speed up the dancer (unless slow motion is active)
    if (!gameState.activePowerUps.has('slow')) {
        gameState.speedMultiplier = Math.min(1 + (gameState.score * 0.05), 3); // Max 3x speed
    }

    const baseDuration = 8;
    let newDuration = Math.max(baseDuration / gameState.speedMultiplier, 2); // Minimum 2 seconds

    if (gameState.activePowerUps.has('slow')) {
        newDuration *= 2; // Slow motion effect
    }

    // Change movement pattern randomly
    changeMovementPattern();

    dancer.style.animationDuration = newDuration + 's';
    document.getElementById('speed').textContent = `Speed: ${gameState.speedMultiplier.toFixed(1)}x`;

    // Screen shake for high streaks
    if (gameState.streak >= 10 && gameState.streak % 5 === 0) {
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
    if (Math.random() < 0.1 && !isGolden) { // 10% chance
        setTimeout(() => spawnGoldenDancer(), 2000);
    }

    // Chance to spawn evil guy on next appearance
    setTimeout(() => {
        if (gameState.gameActive && !spawnEvilGuy()) {
            // If no evil guy spawned, continue normal pattern
            changeMovementPattern();
        }
    }, 1000);
}

export function handleMiss() {
    // All modes now have lives system
    gameState.lives--;
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;
    soundManager.playError(); // Miss sound

    if (gameState.lives <= 0) {
        gameState.gameActive = false;
        // Stop all animations
        const dancer = document.getElementById('dancingMan');
        const evilGuy = document.getElementById('evilGuy');
        dancer.style.animation = 'none';
        evilGuy.style.animation = 'none';
        dancer.style.display = 'none';
        evilGuy.style.display = 'none';

        // Clear any running timers
        if (gameState.levelTimer) {
            clearInterval(gameState.levelTimer);
            gameState.levelTimer = null;
        }
        if (gameState.rushTimer) {
            clearInterval(gameState.rushTimer);
            gameState.rushTimer = null;
        }

        document.getElementById('vibeMessage').textContent = `Game Over! Final Score: ${gameState.score} 💀`;
        endGame();
        return;
    }

    if (gameState.streak > 0) {
        gameState.streak = 0;
        document.getElementById('streak').textContent = `Streak: ${gameState.streak}`;
        document.getElementById('vibeMessage').textContent = `Missed! Lives: ${gameState.lives} 💔`;
    }
}

export function setGameMode(mode) {
    if (!gameState.gameActive && gameState.currentGameMode !== 'normal') return;

    resetGame(); // Use the global resetGame from game.js
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
            spawnChaosMode();
            break;
        default:
            document.getElementById('timer').style.display = 'none';
            document.getElementById('levelTimer').style.display = 'inline-block';
            document.getElementById('gameText').textContent = 'Catch the dancing man, avoid the evil guy!';
    }

    document.getElementById('lives').style.display = 'inline-block';
}

export function startLevelTimer() {
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
                handleMiss(); // This will call endGame()
            } else {
                gameState.currentLevel++;
                document.getElementById('vibeMessage').textContent = `Time's up! Level ${gameState.currentLevel} - Lives: ${gameState.lives} ⏰`;
                startLevelTimer();
            }
        }
    }, 1000);
}

export function startRushTimer() {
    gameState.rushTimer = setInterval(() => {
        gameState.timeLeft--;
        document.getElementById('timer').textContent = `Time: ${gameState.timeLeft}s`;

        if (gameState.timeLeft <= 0) {
            endRushMode();
        } else if (gameState.timeLeft <= 5) {
            soundManager.playTone(1000, 0.1, 'square');
        }
    }, 1000);
}

export function endGame() {
    gameState.gameActive = false;
    gameState.gameStarted = false; // Allow new games to start

    // Show start screen after a delay
    setTimeout(() => {
        checkHighScoreDisplay(); // Check and display high score input
    }, 3000);
}

function spawnChaosMode() {
    // This would require more complex implementation with multiple dancers
    // For now, just increase speed significantly
    gameState.speedMultiplier = 2;
}

export function endRushMode() {
    clearInterval(gameState.rushTimer);
    gameState.gameActive = false;
    document.getElementById('vibeMessage').textContent = `Rush Mode Complete! Final Score: ${gameState.score} 🏁`;
    soundManager.playGameOver();

    checkHighScoreDisplay();
}

export function activatePowerUp() {
    const powerUps = ['slow', 'double', 'freeze', 'giant'];
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];

    soundManager.playTone(1200, 0.2, 'triangle'); // Power-up sound

    switch(powerUp) {
        case 'slow':
            gameState.activePowerUps.add('slow');
            showPowerUp('🐌 Slow Motion', 10000);
            gameState.powerUpTimers.set('slow', setTimeout(() => {
                gameState.activePowerUps.delete('slow');
                removePowerUp('🐌 Slow Motion');
            }, 10000));
            break;
        case 'double':
            gameState.activePowerUps.add('double');
            showPowerUp('⚡ Double Points', 15000);
            gameState.powerUpTimers.set('double', setTimeout(() => {
                gameState.activePowerUps.delete('double');
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
            gameState.activePowerUps.add('giant');
            const dancerGiant = document.getElementById('dancingMan');
            dancerGiant.style.transform += ' scale(1.5)';
            showPowerUp('🔍 Giant Mode', 8000);
            gameState.powerUpTimers.set('giant', setTimeout(() => {
                gameState.activePowerUps.delete('giant');
                dancerGiant.style.transform = dancerGiant.style.transform.replace(' scale(1.5)', '');
                removePowerUp('🔍 Giant Mode');
            }, 8000));
            break;
    }
}

export function spawnGoldenDancer() {
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