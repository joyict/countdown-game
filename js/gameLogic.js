// Core game logic
import { gameState, updateScore, updateStreak, updateLives, updateSpeed } from './gameState.js';
import { MOVEMENT_PATTERNS, POWER_UPS } from './constants.js';
import { playSound } from './soundManager.js';
import { createCelebration, createNegativeEffect, updateVibeMessage } from './ui.js';
import { checkThemeChange } from './themes.js';
import { checkAchievements } from './achievements.js';

export function catchDancer(event, soundManager) {
    if (!gameState.gameActive) return;
    
    // Prevent event bubbling to avoid triggering miss detection
    event.stopPropagation();
    
    // Play catch sound
    if (soundManager) {
        soundManager.playSuccess();
    } else {
        playSound(800, 0.1, 'square');
    }
    
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
    if (gameState.activePowerUps.has('triple')) points *= 3;
    
    updateScore(points);
    updateStreak(gameState.streak + 1);
    
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
    updateSpeed(gameState.speedMultiplier);
    
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
    updateVibeMessage(gameState.streak, gameState.score);
    
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

export function catchEvilGuy(event, soundManager) {
    if (!gameState.gameActive) return;
    
    event.stopPropagation();
    
    // Play evil sound
    if (soundManager) {
        soundManager.playError();
    } else {
        playSound(150, 0.5, 'sawtooth');
    }
    
    // Lose a life
    updateLives(gameState.lives - 1);
    
    // Reset streak
    updateStreak(0);
    
    // Hide evil guy immediately
    document.getElementById('evilGuy').style.display = 'none';
    document.getElementById('dancingMan').style.display = 'block';
    
    // Create negative effect
    createNegativeEffect();
    
    // Check if game over
    if (gameState.lives <= 0) {
        endGame();
    } else {
        document.getElementById('vibeMessage').textContent = `Evil guy caught you! Lives: ${gameState.lives} 😈`;
    }
}

export function handleMiss() {
    // All modes now have lives system
    updateLives(gameState.lives - 1);
    playSound(200, 0.3, 'sawtooth'); // Miss sound
    
    if (gameState.lives <= 0) {
        endGame();
        return;
    }
    
    if (gameState.streak > 0) {
        updateStreak(0);
        document.getElementById('vibeMessage').textContent = `Missed! Lives: ${gameState.lives} 💔`;
    }
}

function endGame() {
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
    
    // Import and call checkHighScore
    import('./leaderboard.js').then(({ checkHighScore }) => {
        checkHighScore();
    });
    
    // Show start screen after a delay
    setTimeout(() => {
        import('./game.js').then(({ showStartScreen }) => {
            showStartScreen();
        });
    }, 3000);
}

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

function startChasingCursor(element, isEvilGuy = false) {
    element.classList.add('chasing-cursor');
    element.style.animation = 'none';
    
    const chaseDuration = isEvilGuy ? 6000 : 8000;
    const chaseSpeed = isEvilGuy ? 200 : 300;
    
    const chaseInterval = setInterval(() => {
        if (!gameState.gameActive) {
            clearInterval(chaseInterval);
            return;
        }
        
        const rect = element.getBoundingClientRect();
        const targetX = gameState.cursorPosition.x - 40;
        const targetY = window.innerHeight - gameState.cursorPosition.y - 40;
        
        const randomOffsetX = (Math.random() - 0.5) * 50;
        const randomOffsetY = (Math.random() - 0.5) * 50;
        
        const finalX = Math.max(0, Math.min(window.innerWidth - 80, targetX + randomOffsetX));
        const finalY = Math.max(0, Math.min(window.innerHeight - 80, targetY + randomOffsetY));
        
        element.style.left = finalX + 'px';
        element.style.bottom = finalY + 'px';
        
    }, chaseSpeed);
    
    setTimeout(() => {
        clearInterval(chaseInterval);
        element.classList.remove('chasing-cursor');
        
        if (gameState.gameActive) {
            const pattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
            element.style.animation = `${pattern} ${8 / gameState.speedMultiplier}s infinite linear`;
            
            setTimeout(() => {
                element.style.left = '-100px';
                element.style.bottom = '-20px';
            }, (8 / gameState.speedMultiplier) * 1000);
        }
    }, chaseDuration);
    
    playSound(600, 0.3, 'sawtooth');
}

function startTemporaryInvisibility(element) {
    const totalDuration = 8000;
    const invisiblePhases = [
        { start: 2000, duration: 1500 },
        { start: 5000, duration: 1000 },
        { start: 6500, duration: 800 }
    ];
    
    const pattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = `${pattern} ${totalDuration / 1000}s infinite linear`;
    
    invisiblePhases.forEach(phase => {
        setTimeout(() => {
            element.classList.add('temporarily-invisible');
            playSound(1200, 0.2, 'triangle');
            
            setTimeout(() => {
                element.classList.remove('temporarily-invisible');
                playSound(800, 0.2, 'sine');
            }, phase.duration);
        }, phase.start);
    });
}

function activatePowerUp() {
    const powerUp = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
    
    playSound(1200, 0.2, 'triangle');
    
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
    
    dancerImg.src = 'golden-dancer.png';
    dancerImg.style.background = 'transparent';
    dancer.classList.add('golden-dancer');
    
    setTimeout(() => {
        if (dancerImg.src.includes('golden-dancer.png')) {
            dancerImg.src = 'dancing-man.svg';
            dancerImg.style.background = '';
        }
        dancer.classList.remove('golden-dancer');
    }, 5000);
}

function spawnEvilGuy() {
    if (Math.random() < 0.25) {
        document.getElementById('dancingMan').style.display = 'none';
        const evilGuy = document.getElementById('evilGuy');
        evilGuy.style.display = 'block';
        
        const behaviorRandom = Math.random();
        
        if (behaviorRandom < 0.3) {
            startChasingCursor(evilGuy, true);
        } else {
            const pattern = MOVEMENT_PATTERNS[Math.floor(Math.random() * MOVEMENT_PATTERNS.length)];
            evilGuy.style.animation = 'none';
            evilGuy.offsetHeight;
            evilGuy.style.animation = `${pattern} ${8 / gameState.speedMultiplier}s infinite linear`;
        }
        
        setTimeout(() => {
            evilGuy.style.display = 'none';
            evilGuy.classList.remove('chasing-cursor', 'temporarily-invisible');
            document.getElementById('dancingMan').style.display = 'block';
        }, (8 / gameState.speedMultiplier) * 1000);
        
        return true;
    }
    return false;
}