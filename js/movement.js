// js/movement.js
import { gameState } from './gameState.js';
import { MOVEMENT_PATTERNS } from './constants.js';
import { SoundManager } from './soundManager.js';

const soundManager = new SoundManager();

export function changeMovementPattern() {
    const dancer = document.getElementById('dancingMan');

    // 25% chance for teleport mode, 15% for chasing mode, 10% for temporary invisibility
    const randomValue = Math.random();
    gameState.teleportMode = randomValue < 0.25;
    gameState.chasingMode = !gameState.teleportMode && randomValue < 0.4;
    const invisibilityMode = !gameState.teleportMode && !gameState.chasingMode && randomValue < 0.5;

    if (gameState.teleportMode) {
        teleportDancer();
        return;
    }

    if (gameState.chasingMode) {
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
        newPatternIndex = Math.floor(Math.random() * MOVEMENT_PATTERNS.length);
    } while (newPatternIndex === gameState.currentPatternIndex && MOVEMENT_PATTERNS.length > 1);

    gameState.currentPatternIndex = newPatternIndex;
    const newPattern = MOVEMENT_PATTERNS[gameState.currentPatternIndex];

    // Reset animation to start the new pattern
    dancer.style.animation = 'none';
    dancer.offsetHeight; // Trigger reflow
    dancer.style.animation = `${newPattern} ${dancer.style.animationDuration || '8s'} infinite linear`;
}

function teleportDancer() {
    const dancer = document.getElementById('dancingMan');

    // Teleport out sound
    soundManager.playTone(1500, 0.2, 'sawtooth');

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
        soundManager.playTone(800, 0.2, 'triangle');

        // Puff in effect
        dancer.classList.remove('teleport-out');
        dancer.classList.add('teleport-in');

        setTimeout(() => {
            dancer.classList.remove('teleport-in');

            // Start a new movement pattern from this position
            const newPattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
            dancer.style.animation = `${newPattern} ${dancer.style.animationDuration || '8s'} infinite linear`;

            // Reset position after animation completes
            setTimeout(() => {
                dancer.style.left = '-100px';
                dancer.style.bottom = '-20px';
            }, parseFloat(dancer.style.animationDuration || '8') * 1000);

        }, 300);
    }, 300);
}

export function startChasingCursor(element, isEvilGuy = false) {
    element.classList.add('chasing-cursor');
    element.style.animation = 'none';

    const chaseDuration = isEvilGuy ? 6000 : 8000; // Evil guy chases for shorter time
    const chaseSpeed = isEvilGuy ? 200 : 300; // Evil guy is faster

    const chaseInterval = setInterval(() => {
        if (!gameState.gameActive) {
            clearInterval(chaseInterval);
            return;
        }

        const rect = element.getBoundingClientRect();
        const currentX = rect.left;
        const currentY = window.innerHeight - rect.bottom;

        // Calculate direction to cursor with some lag for more natural movement
        const targetX = gameState.cursorPosition.x - 40; // Center on cursor
        const targetY = window.innerHeight - gameState.cursorPosition.y - 40;

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
        if (gameState.gameActive) {
            const pattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
            element.style.animation = `${pattern} ${8 / gameState.speedMultiplier}s infinite linear`;

            // Reset position after animation
            setTimeout(() => {
                element.style.left = '-100px';
                element.style.bottom = '-20px';
            }, (8 / gameState.speedMultiplier) * 1000);
        }
    }, chaseDuration);

    // Play chasing sound
    soundManager.playTone(600, 0.3, 'sawtooth');
}

export function startTemporaryInvisibility(element) {
    const totalDuration = 8000;
    const invisiblePhases = [
        { start: 2000, duration: 1500 },
        { start: 5000, duration: 1000 },
        { start: 6500, duration: 800 }
    ];

    // Apply normal movement pattern first
    const pattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = `${pattern} ${totalDuration / 1000}s infinite linear`;

    // Schedule invisibility phases
    invisiblePhases.forEach(phase => {
        setTimeout(() => {
            element.classList.add('temporarily-invisible');
            soundManager.playTone(1200, 0.2, 'triangle'); // Disappear sound

            setTimeout(() => {
                element.classList.remove('temporarily-invisible');
                soundManager.playTone(800, 0.2, 'sine'); // Reappear sound
            }, phase.duration);
        }, phase.start);
    });
}