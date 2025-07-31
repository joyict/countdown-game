// js/leaderboard.js
import { gameState } from './gameState.js';
import { API_BASE } from './constants.js';
import { showStartScreen } from './startScreen.js';
import { SoundManager } from './soundManager.js';

const soundManager = new SoundManager();

let leaderboard = [];

export async function submitScore(playerName, score, mode, streak) {
    try {
        console.log('Submitting score to:', `${API_BASE}/submit-score`);
        const response = await fetch(`${API_BASE}/submit-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: score,
                mode: mode,
                streak: streak
            })
        });

        if (!response.ok) {
            console.error('Submit response not OK:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Score submitted successfully:', result);

        await loadLeaderboard(); // Refresh leaderboard

        // Show success message
        document.getElementById('vibeMessage').textContent = `${playerName} added to leaderboard! 🏆`;
        soundManager.playSuccess(); // Play success sound for submission

    } catch (error) {
        console.error('Error submitting score:', error);

        // Fallback to localStorage
        console.log('Falling back to localStorage');
        const newEntry = {
            name: playerName,
            score: score,
            mode: mode,
            streak: streak,
            created_at: new Date().toISOString()
        };

        let localLeaderboard = JSON.parse(localStorage.getItem('dancingManLeaderboard')) || [];
        localLeaderboard.push(newEntry);
        localLeaderboard.sort((a, b) => b.score - a.score);
        localLeaderboard = localLeaderboard.slice(0, 10);
        localStorage.setItem('dancingManLeaderboard', JSON.stringify(localLeaderboard));

        await loadLeaderboard();

        document.getElementById('vibeMessage').textContent = `${playerName} added to local leaderboard! 📱`;
        soundManager.playSuccess(); // Play success sound for submission
    }
}

export async function toggleLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        await loadLeaderboard();
        updateLeaderboardDisplay();
    }
}

export async function loadLeaderboard() {
    try {
        console.log('Loading leaderboard from:', `${API_BASE}/get-leaderboard`);
        const response = await fetch(`${API_BASE}/get-leaderboard`);

        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }\n        const data = await response.json();
        console.log('Leaderboard loaded:', data);
        leaderboard = data;
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        console.log('Falling back to localStorage');
        // Fallback to localStorage if API fails
        leaderboard = JSON.parse(localStorage.getItem('dancingManLeaderboard')) || [];

        // Show user that we're in offline mode
        if (document.getElementById('leaderboardModal').style.display === 'flex') {
            const list = document.getElementById('leaderboardList');
            list.insertAdjacentHTML('afterbegin', `
                <div style="background: rgba(255,165,0,0.2); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; text-align: center;">
                    ⚠️ Offline Mode - Scores saved locally only
                </div>
            `);
        }
    }
}

export function updateLeaderboardDisplay() {
    const list = document.getElementById('leaderboardList');

    if (leaderboard.length === 0) {
        list.innerHTML = '<div class="no-scores">No scores yet! Be the first! 🚀</div>';
        return;
    }

    list.innerHTML = leaderboard.map((entry, index) => {
        const date = new Date(entry.created_at || entry.date);
        const timeAgo = getTimeAgo(date);
        const isTopScore = index === 0;

        return `
            <div class="leaderboard-entry ${isTopScore ? 'top-score' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${entry.name} ${isTopScore ? '👑' : ''}</div>
                    <div class="player-details">
                        ${entry.mode} • Streak: ${entry.streak} • ${timeAgo}
                    </div>
                </div>
                <div class="player-score">${entry.score}</div>
            </div>
        `;
    }).join('');
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