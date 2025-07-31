// js/evilGuy.js
import { gameState } from './gameState.js';
import { SoundManager } from './soundManager.js';
import { createNegativeEffect } from './ui.js';
import { endGame, startLevelTimer, startRushTimer } from './gameLogic.js'; // Import necessary game logic functions
import { changeMovementPattern, startChasingCursor, startTemporaryInvisibility } from './movement.js';
import { MOVEMENT_PATTERNS } from './constants.js';

const soundManager = new SoundManager();

let evilGuyClones = [];

export function spawnEvilGuy() {
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
            const pattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
            evilGuy.style.animation = 'none';
            evilGuy.offsetHeight; // Trigger reflow
            evilGuy.style.animation = `${pattern} ${8 / gameState.speedMultiplier}s infinite linear`;
        }

        // Hide evil guy after animation and show dancing man
        setTimeout(() => {
            evilGuy.style.display = 'none';
            evilGuy.classList.remove('chasing-cursor', 'temporarily-invisible');
            document.getElementById('dancingMan').style.display = 'block';
            cleanupEvilGuyClones();
        }, (8 / gameState.speedMultiplier) * 1000);

        return true;
    }
    return false;
}

export function catchEvilGuy(event) {
    if (!gameState.gameActive) return;

    event.stopPropagation();

    // Play evil sound
    soundManager.playError();

    // Lose a life
    gameState.lives--;
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;

    // Reset streak
    gameState.streak = 0;
    document.getElementById('streak').textContent = `Streak: ${gameState.streak}`;

    // Hide evil guy immediately
    document.getElementById('evilGuy').style.display = 'none';
    document.getElementById('dancingMan').style.display = 'block';

    // Create negative effect
    createNegativeEffect();

    // Check if game over
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
    } else {
        document.getElementById('vibeMessage').textContent = `Evil guy caught you! Lives: ${gameState.lives} 😈`;
    }
}

function spawnEvilGuyGroup() {
    const mainEvilGuy = document.getElementById('evilGuy');
    const groupSize = Math.floor(Math.random() * 3) + 2; // 2-4 evil guys

    // Apply pattern to main evil guy
    const pattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
    mainEvilGuy.style.animation = 'none';
    mainEvilGuy.offsetHeight;
    mainEvilGuy.style.animation = `${pattern} ${8 / gameState.speedMultiplier}s infinite linear`;

    // Create clones
    for (let i = 0; i < groupSize - 1; i++) {
        setTimeout(() => {
            const clone = document.createElement('div');
            clone.className = 'evil-guy-clone';
            clone.innerHTML = '<img src="evil-guy.svg" alt="Evil Guy Clone" class="evil-svg" />';
            clone.onclick = (e) => catchEvilGuyClone(e, clone);
            clone.ontouchstart = (e) => catchEvilGuyClone(e, clone);

            // Random starting position and pattern
            const clonePattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
            const delay = Math.random() * 2; // Random delay up to 2 seconds

            clone.style.animationDelay = delay + 's';
            clone.style.animation = `${clonePattern} ${(8 / gameState.speedMultiplier) + delay}s infinite linear`;

            document.body.appendChild(clone);
            evilGuyClones.push(clone);

            // Remove clone after animation
            setTimeout(() => {
                if (clone.parentNode) {
                    clone.parentNode.removeChild(clone);
                }
                evilGuyClones = evilGuyClones.filter(c => c !== clone);
            }, ((8 / gameState.speedMultiplier) + delay) * 1000);

        }, i * 500); // Stagger clone appearances
    }

    // Play group spawn sound
    soundManager.playTone(400, 0.5, 'sawtooth');
    setTimeout(() => soundManager.playTone(350, 0.3, 'sawtooth'), 200);
}

export function catchEvilGuyClone(event, clone) {
    if (!gameState.gameActive) return;

    event.stopPropagation();

    // Same penalty as main evil guy
    soundManager.playError();

    gameState.lives--;
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;

    gameState.streak = 0;
    document.getElementById('streak').textContent = `Streak: ${gameState.streak}`;

    // Remove the clone immediately
    if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
    }
    evilGuyClones = evilGuyClones.filter(c => c !== clone);

    createNegativeEffect();

    if (gameState.lives <= 0) {
        gameState.gameActive = false;
        // Stop all animations and clean up
        const dancer = document.getElementById('dancingMan');
        const evilGuy = document.getElementById('evilGuy');
        dancer.style.animation = 'none';
        evilGuy.style.animation = 'none';
        dancer.style.display = 'none';
        evilGuy.style.display = 'none';

        cleanupEvilGuyClones();

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
    } else {
        document.getElementById('vibeMessage').textContent = `Evil clone got you! Lives: ${gameState.lives} 😈`;
    }
}

export function cleanupEvilGuyClones() {
    evilGuyClones.forEach(clone => {
        if (clone.parentNode) {
            clone.parentNode.removeChild(clone);
        }
    });
    evilGuyClones = [];
}