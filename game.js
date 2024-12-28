import { spawnAliens, updateAliens, updateEnemyShooting } from './alien.js'
import { tryShoot, updateBullets, updatePlayerMovement } from './player.js'
// Game state and configuration objects

export const sounds = {
    killEnemy: new Audio('assets/sounds/kill_enemy.mp3'),
    loseLife: new Audio('assets/sounds/lose_life.mp3')
};

export let enemySpeed = 0.2;
let timerInterval = null;

export const config = {
    get GAME_WIDTH() {
        return elements.container.clientWidth;
    },
    get GAME_HEIGHT() {
        return elements.container.clientHeight;
    },

    PLAYER_SPEED: 5,
    BULLET_SPEED: 10

};

export const state = {
    isRunning: false,
    isPaused: false,
    score: 0,
    lives: 3,
    timeRemaining: 60,
    currentLevel: 1
};

export const performance = {
    lastShootTime: 0
};

export const elements = {
    container: document.getElementById('game-container'),
    player: document.getElementById('player'),
    pauseMenu: document.getElementById('pause-menu'),
    scoreBoard: {
        timer: document.getElementById('timer'),
        score: document.getElementById('score'),
        lives: document.getElementById('lives'),
        Level: document.getElementById('Level')
    },
    soundButton: document.getElementById('Sound')
};

export const input = {
    left: false,
    right: false,
    shoot: false,
    sound: true
};

export const gameObjects = {
    bullets: [],
    aliens: []
};

// Game functions
function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowLeft': input.left = true; break;
            case 'ArrowRight': input.right = true; break;
            case 'Space':
                input.shoot = true;
                tryShoot();
                break;
            case 'Escape': togglePause(); break;
            case 'KeyQ':
                toggleSound();
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'ArrowLeft': input.left = false; break;
            case 'ArrowRight': input.right = false; break;
            case 'Space':
                input.shoot = false;
                break;
        }
    });

    document.getElementById('continue-btn').addEventListener('click', togglePause);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    if (elements.soundButton) {
        elements.soundButton.addEventListener('click', toggleSound);
        updateSoundDisplay();
    }
}
function updateSoundDisplay() {
    const soundButton = elements.soundButton;
    if (soundButton) {
        soundButton.textContent = `Sound: ${input.sound ? 'On' : 'Off'}`;
        soundButton.style.backgroundColor = input.sound ? '#4CAF50' : '#ff4d4d';
    }
}
function toggleSound() {
    input.sound = !input.sound;
    updateSoundDisplay();

    if (input.sound) {
        const testSound = sounds.killEnemy;
        testSound.currentTime = 0;
        //testSound.volume = 0.2; // Lower volume for test sound
        testSound.play().catch(error => console.log('Error playing sound:', error));
    }
}
function initializeGame() {
    resetGameState();
    startGameLoop();
}
function resetGameState() {
    Object.assign(state, {
        isRunning: true,
        isPaused: false,
        score: 0,
        lives: 3,
        timeRemaining: 60
    });

    gameObjects.bullets.forEach(bullet => bullet.element.remove());
    gameObjects.aliens.forEach(alien => alien.element.remove());
    gameObjects.bullets = [];
    gameObjects.aliens = [];

    elements.player.style.left = '375px';

    updateScoreboard();
    spawnAliens();
}
function togglePause() {
    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        clearInterval(timerInterval);
    } else {
        startTimer();
    }

    elements.pauseMenu.style.display = state.isPaused ? 'block' : 'none';
}
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (!state.isPaused) {
            if (state.timeRemaining <= 0) {
                clearInterval(timerInterval);
                gameOver();
            }
            state.timeRemaining--;
            updateScoreboard();
        }
    }, 1000);
}

export function createScoreLabel(alien) {
    const scoreLabel = document.createElement('div');
    scoreLabel.classList.add('score-label');
    scoreLabel.textContent = '+10';
    scoreLabel.style.left = `${alien.x + 20}px`;
    scoreLabel.style.top = `${alien.y + 20}px`;
    elements.container.appendChild(scoreLabel);
    return scoreLabel;
}

export function animateScoreLabel(scoreLabel, alien) {
    setTimeout(() => {
        scoreLabel.style.transition = 'all 1s ease-out';
        scoreLabel.style.top = `${alien.y - 30}px`;
        scoreLabel.style.opacity = 0;
    }, 10);

    setTimeout(() => {
        scoreLabel.remove();
    }, 1000);
}

export function updateScoreboard() {
    elements.scoreBoard.timer.textContent = `Time: ${state.timeRemaining}`;
    elements.scoreBoard.score.textContent = `Score: ${state.score}`;
    elements.scoreBoard.lives.textContent = `Lives: ${state.lives}`;
    elements.scoreBoard.Level.textContent = `Level: ${state.currentLevel}`
    checkTopScore();
}

function checkTopScore() {
    if (state.score >= 500) {
        showGameTop();
    }
}

function gameLoop(timestamp) {
    if (!state.isPaused && state.isRunning) {
        updatePlayerMovement();
        updateBullets();
        updateAliens();
        updateEnemyShooting();
        updateScoreboard();
    }

    requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    requestAnimationFrame(gameLoop);
}

export function gameOver() {
    state.isRunning = false;
    state.isPaused = true;

    const overlay = createOverlay('Game Over', state.score, '#ff4d4d');
    elements.container.appendChild(overlay);
}

function showGameTop() {
    state.isRunning = false;
    state.isPaused = true;

    const overlay = createOverlay('Congratulations!', state.score, '#4CAF50', true);
    elements.container.appendChild(overlay);
}

function createOverlay(title, score, buttonColor, isTop = false) {
    const overlay = document.createElement('div');
    overlay.classList.add(isTop ? 'congratulations-overlay' : 'game-over-overlay');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    overlay.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">${title}</h1>
        <p style="font-size: 1.5rem; margin-bottom: 2rem;">Final Score: ${score}</p>
        <button id="restart-game-btn" style="
            padding: 10px 20px;
            font-size: 1rem;
            background-color: ${buttonColor};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        ">Restart Game</button>
    `;

    overlay.querySelector('#restart-game-btn').addEventListener('click', () => {
        overlay.remove();
        if (title === 'Congratulations!') {
            nextLevel();
        } else {
            restartGame()
        }
    });

    return overlay;
}
function nextLevel() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    state.currentLevel += 1
    state.timeRemaining = 60;
    state.isPaused = false;
    state.isRunning = true;
    config.BULLET_SPEED += 3
    enemySpeed += 0.5

    resetGameState();
    startTimer();
    elements.pauseMenu.style.display = 'none';

    document.querySelectorAll('.game-over-overlay, .congratulations-overlay').forEach(overlay => {
        overlay.remove();
    });

    updateScoreboard();
}
function restartGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    resetGameState();
    state.timeRemaining = 60;
    state.isPaused = false;
    state.isRunning = true;

    startTimer();
    elements.pauseMenu.style.display = 'none';

    document.querySelectorAll('.game-over-overlay, .congratulations-overlay').forEach(overlay => {
        overlay.remove();
    });

    updateScoreboard();
}

// Initialize game when DOM is loaded 
document.addEventListener('DOMContentLoaded', () => {
    //initializeElements();
    setupEventListeners();
    startTimer()
    initializeGame();
});
