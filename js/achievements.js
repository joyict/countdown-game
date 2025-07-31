// Achievement system
import { gameState } from './gameState.js';

export function checkAchievements() {
    const newAchievements = [];
    
    if (gameState.score === 1 && !gameState.achievements.has('first')) {
        gameState.achievements.add('first');
        newAchievements.push('🎯 First Catch!');
    }
    if (gameState.score === 10 && !gameState.achievements.has('ten')) {
        gameState.achievements.add('ten');
        newAchievements.push('🔥 Double Digits!');
    }
    if (gameState.score === 25 && !gameState.achievements.has('quarter')) {
        gameState.achievements.add('quarter');
        newAchievements.push('⚡ Quarter Century!');
    }
    if (gameState.streak === 5 && !gameState.achievements.has('streak5')) {
        gameState.achievements.add('streak5');
        newAchievements.push('🌟 5 Streak!');
    }
    if (gameState.streak === 10 && !gameState.achievements.has('streak10')) {
        gameState.achievements.add('streak10');
        newAchievements.push('🚀 10 Streak Master!');
    }
    if (gameState.speedMultiplier >= 2 && !gameState.achievements.has('speed2x')) {
        gameState.achievements.add('speed2x');
        newAchievements.push('💨 Speed Demon!');
    }
    if (gameState.score === 50 && !gameState.achievements.has('fifty')) {
        gameState.achievements.add('fifty');
        newAchievements.push('👑 Half Century King!');
    }
    if (gameState.teleportMode && !gameState.achievements.has('teleport')) {
        gameState.achievements.add('teleport');
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