// Set the target date (July 26th, 2025 at 19:00)
const targetDate = new Date('2025-07-26T19:00:00');

// Vibe messages that rotate
const vibeMessages = [
    "The anticipation is real! 🔥",
    "Bolt.new builders unite! ⚡",
    "The wait is almost over! 🚀",
    "Innovation at lightning speed! 🌟",
    "History in the making! 💫",
    "The future is being built! 🛠️",
    "Bolt-powered creativity! ⚡",
    "Dreams becoming reality! 🌈",
    "World's largest hackathon! 🌍",
    "Ready to be amazed! ✨"
];

let currentVibeIndex = 0;

function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;
    
    if (distance < 0) {
        document.getElementById('countdown').innerHTML = '<div class="time-unit"><span class="number">🎉</span><span class="label">Results are here!</span></div>';
        document.getElementById('vibeMessage').textContent = "The moment has arrived! 🎊";
        return;
    }
    
    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

function rotateVibeMessage() {
    const vibeElement = document.getElementById('vibeMessage');
    vibeElement.style.opacity = '0';
    
    setTimeout(() => {
        currentVibeIndex = (currentVibeIndex + 1) % vibeMessages.length;
        vibeElement.textContent = vibeMessages[currentVibeIndex];
        vibeElement.style.opacity = '1';
    }, 300);
}

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 3 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
    
    document.getElementById('particles').appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 5000);
}

// Initialize
updateCountdown();
setInterval(updateCountdown, 1000);

// Rotate vibe messages every 3 seconds
setInterval(rotateVibeMessage, 3000);

// Create particles every 300ms for more sparkle
setInterval(createParticle, 300);

// Add sparkle effects
function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    sparkle.innerHTML = '✨';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
        sparkle.remove();
    }, 2000);
}

setInterval(createSparkle, 800);

// Game functionality
let score = 0;
let streak = 0;
let maxStreak = 0;
let gameActive = true;
let missedClicks = 0;
let speedMultiplier = 1;
let achievements = new Set();

// Game modes
let currentGameMode = 'normal';
let lives = 3;
let timeLeft = 30;
let rushTimer = null;
let chaosCount = 1;

// Power-ups
let activePowerUps = new Set();
let powerUpTimers = new Map();

// Leaderboard
let leaderboard = JSON.parse(localStorage.getItem('hackathonLeaderboard')) || [];
let gameEndTime = new Date('2025-07-26T19:00:00');

// Sound effects (using Web Audio API for better performance)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Movement patterns for variety
const movementPatterns = [
    'dance-across',
    'dance-diagonal', 
    'dance-wave',
    'dance-zigzag',
    'dance-top',
    'dance-middle',
    'dance-reverse',
    'dance-vertical-up',
    'dance-vertical-down',
    'dance-corner-to-corner',
    'dance-spiral'
];

let currentPatternIndex = 0;
let teleportMode = false;

function catchDancer(event) {
    if (!gameActive) return;
    
    // Prevent event bubbling to avoid triggering miss detection
    event.stopPropagation();
    
    // Play catch sound
    playSound(800, 0.1, 'square');
    
    // Check if it's a golden dancer (power-up)
    const dancer = document.getElementById('dancingMan');
    const isGolden = dancer.classList.contains('golden-dancer');
    
    if (isGolden) {
        activatePowerUp();
        dancer.classList.remove('golden-dancer');
    }
    
    // Calculate score with power-up multipliers
    let points = 1;
    if (activePowerUps.has('double')) points *= 2;
    if (activePowerUps.has('triple')) points *= 3;
    
    score += points;
    streak++;
    maxStreak = Math.max(maxStreak, streak);
    
    // Update displays
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('streak').textContent = `Streak: ${streak}`;
    
    // Speed up the dancer (unless slow motion is active)
    if (!activePowerUps.has('slow')) {
        speedMultiplier = Math.min(1 + (score * 0.05), 3); // Max 3x speed
    }
    
    const baseDuration = 8;
    let newDuration = Math.max(baseDuration / speedMultiplier, 2); // Minimum 2 seconds
    
    if (activePowerUps.has('slow')) {
        newDuration *= 2; // Slow motion effect
    }
    
    // Change movement pattern randomly
    changeMovementPattern();
    
    dancer.style.animationDuration = newDuration + 's';
    document.getElementById('speed').textContent = `Speed: ${speedMultiplier.toFixed(1)}x`;
    
    // Screen shake for high streaks
    if (streak >= 10 && streak % 5 === 0) {
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
}

function changeMovementPattern() {
    const dancer = document.getElementById('dancingMan');
    
    // 30% chance for teleport mode
    teleportMode = Math.random() < 0.3;
    
    if (teleportMode) {
        teleportDancer();
        return;
    }
    
    // Choose a random pattern (but not the same as current)
    let newPatternIndex;
    do {
        newPatternIndex = Math.floor(Math.random() * movementPatterns.length);
    } while (newPatternIndex === currentPatternIndex && movementPatterns.length > 1);
    
    currentPatternIndex = newPatternIndex;
    const newPattern = movementPatterns[currentPatternIndex];
    
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
            const newPattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
            dancer.style.animation = `${newPattern} ${dancer.style.animationDuration || '8s'} infinite linear`;
            
            // Reset position after animation completes
            setTimeout(() => {
                dancer.style.left = '-100px';
                dancer.style.bottom = '-20px';
            }, parseFloat(dancer.style.animationDuration || '8') * 1000);
            
        }, 300);
    }, 300);
}

function checkAchievements() {
    const newAchievements = [];
    
    if (score === 1 && !achievements.has('first')) {
        achievements.add('first');
        newAchievements.push('🎯 First Catch!');
    }
    if (score === 10 && !achievements.has('ten')) {
        achievements.add('ten');
        newAchievements.push('🔥 Double Digits!');
    }
    if (score === 25 && !achievements.has('quarter')) {
        achievements.add('quarter');
        newAchievements.push('⚡ Quarter Century!');
    }
    if (streak === 5 && !achievements.has('streak5')) {
        achievements.add('streak5');
        newAchievements.push('🌟 5 Streak!');
    }
    if (streak === 10 && !achievements.has('streak10')) {
        achievements.add('streak10');
        newAchievements.push('🚀 10 Streak Master!');
    }
    if (speedMultiplier >= 2 && !achievements.has('speed2x')) {
        achievements.add('speed2x');
        newAchievements.push('💨 Speed Demon!');
    }
    if (score === 50 && !achievements.has('fifty')) {
        achievements.add('fifty');
        newAchievements.push('👑 Half Century King!');
    }
    if (teleportMode && !achievements.has('teleport')) {
        achievements.add('teleport');
        newAchievements.push('✨ Teleport Master!');
    }
    
    // Display new achievements
    newAchievements.forEach(achievement => {
        const achievementEl = document.createElement('div');
        achievementEl.className = 'achievement';
        achievementEl.textContent = achievement;
        document.getElementById('achievements').appendChild(achievementEl);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (achievementEl.parentNode) {
                achievementEl.parentNode.removeChild(achievementEl);
            }
        }, 5000);
    });
}

function updateVibeMessage() {
    let messages;
    
    if (streak >= 10) {
        messages = ["UNSTOPPABLE! 🔥🔥", "LEGENDARY STREAK! 👑", "DANCING GOD! ⚡⚡"];
    } else if (streak >= 5) {
        messages = ["ON FIRE! 🔥", "STREAK MASTER! ⚡", "UNSTOPPABLE! 🚀"];
    } else if (score >= 25) {
        messages = ["EXPERT CATCHER! 🎯", "DANCE MASTER! 💃", "LIGHTNING FAST! ⚡"];
    } else {
        messages = [
            "Nice catch! 🎯",
            "Smooth moves! 💃",
            "You got him! 🔥",
            "Dancing master! ⚡",
            "Keep it up! 🌟",
            "On fire! 🚀"
        ];
    }
    
    const vibeElement = document.getElementById('vibeMessage');
    vibeElement.textContent = messages[Math.floor(Math.random() * messages.length)];
}

// Reset streak on miss (clicking empty space)
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        gameActive) {
        if (streak > 0) {
            streak = 0;
            document.getElementById('streak').textContent = `Streak: ${streak}`;
            document.getElementById('vibeMessage').textContent = "Missed! Streak reset! 💔";
        }
    }
});

// Add touch support for mobile
document.addEventListener('touchstart', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        gameActive) {
        if (streak > 0) {
            streak = 0;
            document.getElementById('streak').textContent = `Streak: ${streak}`;
            document.getElementById('vibeMessage').textContent = "Missed! Streak reset! 💔";
        }
    }
});

// Game mode functions
function setGameMode(mode) {
    if (!gameActive && currentGameMode !== 'normal') return;
    
    // Reset game state
    resetGame();
    currentGameMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(mode + 'Mode').classList.add('active');
    
    // Configure mode-specific settings
    switch(mode) {
        case 'survival':
            lives = 3;
            document.getElementById('lives').style.display = 'inline-block';
            document.getElementById('lives').textContent = `Lives: ${lives}`;
            document.getElementById('gameText').textContent = 'Survival Mode - Don\'t miss!';
            break;
        case 'rush':
            timeLeft = 30;
            document.getElementById('timer').style.display = 'inline-block';
            document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
            document.getElementById('gameText').textContent = 'Rush Mode - 30 seconds!';
            startRushTimer();
            break;
        case 'chaos':
            chaosCount = 2;
            document.getElementById('gameText').textContent = 'Chaos Mode - Multiple dancers!';
            spawnChaosMode();
            break;
        default:
            document.getElementById('lives').style.display = 'none';
            document.getElementById('timer').style.display = 'none';
            document.getElementById('gameText').textContent = 'Click the dancing man!';
    }
}

function resetGame() {
    score = 0;
    streak = 0;
    speedMultiplier = 1;
    activePowerUps.clear();
    powerUpTimers.forEach(timer => clearTimeout(timer));
    powerUpTimers.clear();
    
    if (rushTimer) {
        clearInterval(rushTimer);
        rushTimer = null;
    }
    
    // Clear power-up display
    document.getElementById('powerUps').innerHTML = '';
    
    // Update displays
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('streak').textContent = 'Streak: 0';
    document.getElementById('speed').textContent = 'Speed: 1x';
    
    gameActive = true;
}

function startRushTimer() {
    rushTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            endRushMode();
        } else if (timeLeft <= 5) {
            // Urgent beeping
            playSound(1000, 0.1, 'square');
        }
    }, 1000);
}

function endRushMode() {
    clearInterval(rushTimer);
    gameActive = false;
    document.getElementById('vibeMessage').textContent = `Rush Mode Complete! Final Score: ${score} 🏁`;
    playSound(400, 0.5, 'sawtooth'); // End sound
    
    // Check if it's a high score
    checkHighScore();
}

function endGame() {
    gameActive = false;
    checkHighScore();
}

function handleMiss() {
    if (currentGameMode === 'survival') {
        lives--;
        document.getElementById('lives').textContent = `Lives: ${lives}`;
        playSound(200, 0.3, 'sawtooth'); // Miss sound
        
        if (lives <= 0) {
            gameActive = false;
            document.getElementById('vibeMessage').textContent = `Game Over! Final Score: ${score} 💀`;
            endGame();
        }
    }
    
    if (streak > 0) {
        streak = 0;
        document.getElementById('streak').textContent = `Streak: ${streak}`;
        if (currentGameMode !== 'survival') {
            document.getElementById('vibeMessage').textContent = "Missed! Streak reset! 💔";
        }
    }
}

// Power-up system
function activatePowerUp() {
    const powerUps = ['slow', 'double', 'freeze', 'giant'];
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    playSound(1200, 0.2, 'triangle'); // Power-up sound
    
    switch(powerUp) {
        case 'slow':
            activePowerUps.add('slow');
            showPowerUp('🐌 Slow Motion', 10000);
            powerUpTimers.set('slow', setTimeout(() => {
                activePowerUps.delete('slow');
                removePowerUp('🐌 Slow Motion');
            }, 10000));
            break;
        case 'double':
            activePowerUps.add('double');
            showPowerUp('⚡ Double Points', 15000);
            powerUpTimers.set('double', setTimeout(() => {
                activePowerUps.delete('double');
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
            activePowerUps.add('giant');
            const dancerGiant = document.getElementById('dancingMan');
            dancerGiant.style.transform += ' scale(1.5)';
            showPowerUp('🔍 Giant Mode', 8000);
            powerUpTimers.set('giant', setTimeout(() => {
                activePowerUps.delete('giant');
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
    dancer.classList.add('golden-dancer');
    
    // Remove golden effect after 5 seconds if not caught
    setTimeout(() => {
        dancer.classList.remove('golden-dancer');
    }, 5000);
}

function spawnChaosMode() {
    // This would require more complex implementation with multiple dancers
    // For now, just increase speed significantly
    speedMultiplier = 2;
}

// Update miss detection to handle game modes
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        !e.target.closest('.mode-btn') &&
        !e.target.closest('.power-ups') &&
        gameActive) {
        handleMiss();
    }
});

document.addEventListener('touchstart', function(e) {
    if (!e.target.closest('.dancing-man') && 
        !e.target.closest('.link-button') && 
        !e.target.closest('.game-stats') &&
        !e.target.closest('.achievements') &&
        !e.target.closest('.mode-btn') &&
        !e.target.closest('.power-ups') &&
        gameActive) {
        handleMiss();
    }
});

// Leaderboard functions
function checkHighScore() {
    const minScoreForLeaderboard = leaderboard.length < 10 ? 0 : leaderboard[9].score;
    
    if (score > minScoreForLeaderboard) {
        document.getElementById('finalScore').textContent = score;
        document.getElementById('scoreModal').style.display = 'flex';
        document.getElementById('playerName').focus();
    }
}

function submitScore() {
    const playerName = document.getElementById('playerName').value.trim() || 'Anonymous';
    const newEntry = {
        name: playerName,
        score: score,
        mode: currentGameMode,
        date: new Date().toISOString(),
        streak: maxStreak
    };
    
    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Keep top 10
    
    localStorage.setItem('hackathonLeaderboard', JSON.stringify(leaderboard));
    
    closeScoreModal();
    updateLeaderboardDisplay();
    
    // Show success message
    document.getElementById('vibeMessage').textContent = `${playerName} added to leaderboard! 🏆`;
}

function closeScoreModal() {
    document.getElementById('scoreModal').style.display = 'none';
    document.getElementById('playerName').value = '';
}

function toggleLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        updateLeaderboardDisplay();
    }
}

function updateLeaderboardDisplay() {
    const list = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
        list.innerHTML = '<div class="no-scores">No scores yet! Be the first! 🚀</div>';
        return;
    }
    
    const now = new Date();
    const timeUntilEnd = gameEndTime - now;
    const isGameEnded = timeUntilEnd <= 0;
    
    list.innerHTML = leaderboard.map((entry, index) => {
        const date = new Date(entry.date);
        const timeAgo = getTimeAgo(date);
        const isWinner = isGameEnded && index === 0;
        
        return `
            <div class="leaderboard-entry ${isWinner ? 'winner' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${entry.name} ${isWinner ? '👑' : ''}</div>
                    <div class="player-details">
                        ${entry.mode} • Streak: ${entry.streak} • ${timeAgo}
                    </div>
                </div>
                <div class="player-score">${entry.score}</div>
            </div>
        `;
    }).join('');
    
    if (isGameEnded && leaderboard.length > 0) {
        list.insertAdjacentHTML('afterbegin', `
            <div class="winner-announcement">
                🎉 WINNER: ${leaderboard[0].name} with ${leaderboard[0].score} points! 🎉
            </div>
        `);
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Check for winner when countdown ends
function checkForWinner() {
    const now = new Date();
    if (now >= gameEndTime && leaderboard.length > 0) {
        const winner = leaderboard[0];
        document.getElementById('vibeMessage').textContent = 
            `🏆 WINNER: ${winner.name} with ${winner.score} points! 🏆`;
        
        // Show confetti or celebration effect
        createWinnerCelebration();
    }
}

function createWinnerCelebration() {
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.innerHTML = ['🎉', '🏆', '👑', '⭐', '🎊'][Math.floor(Math.random() * 5)];
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-50px';
            confetti.style.fontSize = '2rem';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '1000';
            confetti.style.animation = 'confetti-fall 3s ease-out forwards';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 100);
    }
}

// Initialize with random pattern
document.addEventListener('DOMContentLoaded', () => {
    changeMovementPattern();
    updateLeaderboardDisplay();
    
    // Check for winner every minute after game ends
    setInterval(checkForWinner, 60000);
    
    // Add mobile-specific styling
    if (window.innerWidth <= 768) {
        document.body.style.touchAction = 'manipulation';
        document.querySelector('.vibes-section').style.minHeight = '200px';
    }
    
    // Initialize audio context on first user interaction
    document.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
    
    // Handle Enter key in name input
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitScore();
        }
    });
});

function createCelebration() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const celebration = document.createElement('div');
            celebration.innerHTML = ['🎉', '✨', '🔥', '⚡', '🌟'][Math.floor(Math.random() * 5)];
            celebration.style.position = 'fixed';
            celebration.style.left = Math.random() * 100 + '%';
            celebration.style.top = Math.random() * 100 + '%';
            celebration.style.fontSize = '2rem';
            celebration.style.pointerEvents = 'none';
            celebration.style.zIndex = '1000';
            celebration.style.animation = 'celebration-pop 1s ease-out forwards';
            
            document.body.appendChild(celebration);
            
            setTimeout(() => celebration.remove(), 1000);
        }, i * 100);
    }
}

// Add celebration animation to CSS dynamically
const celebrationStyle = document.createElement('style');
celebrationStyle.textContent = `
    @keyframes celebration-pop {
        0% { transform: scale(0) rotate(0deg); opacity: 1; }
        50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
        100% { transform: scale(0) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(celebrationStyle);

// Add some extra flair on load
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});