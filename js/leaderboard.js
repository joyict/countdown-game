// Leaderboard system
import { gameState } from './gameState.js';
import { API_BASE } from './constants.js';

export function checkHighScore() {
    // Show high score section if score is greater than 0
    if (gameState.score > 0) {
        // Show the high score section on start screen
        document.getElementById('startScreenScore').textContent = gameState.score;
        document.getElementById('highscoreSection').style.display = 'block';
        
        // Focus on the name input
        const nameInput = document.getElementById('startScreenPlayerName');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 500);
        }
    }
}

export async function submitScoreFromStart() {
    const playerName = document.getElementById('startScreenPlayerName').value.trim() || 'Anonymous';
    
    try {
        console.log('Submitting score to:', `${API_BASE}/submit-score`);
        const response = await fetch(`${API_BASE}/submit-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: gameState.score,
                mode: gameState.currentGameMode,
                streak: gameState.maxStreak
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Score submitted successfully:', result);
        
        // Hide high score section
        document.getElementById('highscoreSection').style.display = 'none';
        document.getElementById('startScreenPlayerName').value = '';
        
        await loadLeaderboard();
        document.getElementById('vibeMessage').textContent = `${playerName} added to leaderboard! 🏆`;
        
    } catch (error) {
        console.error('Error submitting score:', error);
        
        // Fallback to localStorage
        const newEntry = {
            name: playerName,
            score: gameState.score,
            mode: gameState.currentGameMode,
            streak: gameState.maxStreak,
            created_at: new Date().toISOString()
        };
        
        let localLeaderboard = JSON.parse(localStorage.getItem('dancingManLeaderboard')) || [];
        localLeaderboard.push(newEntry);
        localLeaderboard.sort((a, b) => b.score - a.score);
        localLeaderboard = localLeaderboard.slice(0, 10);
        localStorage.setItem('dancingManLeaderboard', JSON.stringify(localLeaderboard));
        
        document.getElementById('highscoreSection').style.display = 'none';
        document.getElementById('startScreenPlayerName').value = '';
        
        await loadLeaderboard();
        document.getElementById('vibeMessage').textContent = `${playerName} added to local leaderboard! 📱`;
    }
}

export function skipHighScore() {
    document.getElementById('highscoreSection').style.display = 'none';
    document.getElementById('startScreenPlayerName').value = '';
    document.getElementById('vibeMessage').textContent = "Ready for another round? 🎮";
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
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Leaderboard loaded:', data);
        gameState.leaderboard = data;
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        // Fallback to localStorage if API fails
        gameState.leaderboard = JSON.parse(localStorage.getItem('dancingManLeaderboard')) || [];
        
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
    
    if (gameState.leaderboard.length === 0) {
        list.innerHTML = '<div class="no-scores">No scores yet! Be the first! 🚀</div>';
        return;
    }
    
    list.innerHTML = gameState.leaderboard.map((entry, index) => {
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