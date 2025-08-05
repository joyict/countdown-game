// Theme system
import { gameState } from './gameState.js';
import { THEMES } from './constants.js';
import { playSound } from './soundManager.js';
import { createThemeCelebration } from './ui.js';

export function checkThemeChange() {
    // Find the appropriate theme for current score
    let newTheme = 'default';
    for (let i = THEMES.length - 1; i >= 0; i--) {
        if (gameState.score >= THEMES[i].minScore) {
            newTheme = THEMES[i].name;
            break;
        }
    }

    // Change theme if different from current
    if (newTheme !== gameState.currentTheme) {
        changeTheme(newTheme);
    }
}

export function changeTheme(newTheme) {
    const body = document.body;

    // Remove current theme class
    if (gameState.currentTheme !== 'default') {
        body.classList.remove(`theme-${gameState.currentTheme}`);
    }

    // Add new theme class
    if (newTheme !== 'default') {
        body.classList.add(`theme-${newTheme}`);
    }

    gameState.currentTheme = newTheme;

    // Find theme display name
    const themeData = THEMES.find(t => t.name === newTheme);
    const themeName = themeData ? themeData.displayName : 'Deep Space';

    // Show theme change message
    if (newTheme !== 'default') {
        document.getElementById('vibeMessage').textContent = `🌟 Theme Unlocked: ${themeName}! 🌟`;

        // Play theme change sound
        playSound(1000, 0.3, 'triangle');
        setTimeout(() => playSound(1200, 0.2, 'sine'), 200);

        // Create theme change celebration
        createThemeCelebration();
    }
}