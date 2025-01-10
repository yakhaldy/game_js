import { spawnAliens, updateAliens, updateEnemyShooting } from './alien.js'
import { tryShoot, updateBullets, updatePlayerMovement } from './player.js'
// Game state and configuration objects

const sounds = {
    killEnemy: new Audio('assets/sounds/kill_enemy.mp3'),
    loseLife: new Audio('assets/sounds/lose_life.mp3'),
    shoot: new Audio('assets/sounds/8-bit-laser.mp3')
};

let enemySpeed = 0.2;
let timerInterval = null;

const config = {
    get GAME_WIDTH() {
        return elements.container.clientWidth;
    },
    get GAME_HEIGHT() {
        return elements.container.clientHeight;
    },
    MAX_SCORE: 500,
    MAX_LEVEL: 10,
    PLAYER_SPEED: 5,
    BULLET_SPEED: 10,
    RANDOM_BULLET: 0.01
};

const state = {
    isOver: false,
    isPaused: true,
    score: 0,
    lives: 3,
    timeRemaining: 60,
    currentLevel: 1,
    pauseTime: 0
};

const performance = {
    lastShootTime: 0
};

const elements = {
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

const input = {
    left: false,
    right: false,
    shootingInterval: null,
    sound: true
};

const gameObjects = {
    bullets: [],
    aliens: []
};


let overlay = document.getElementById('animated-overlay');
let offset = 0; 

function animateOverlay() {
    offset += 1; 
    if (offset > window.innerWidth) { 
        offset = -window.innerWidth;
    }
    overlay.style.transform = `translateX(${offset}px)`; 

    requestAnimationFrame(animateOverlay);
}

requestAnimationFrame(animateOverlay);

// Game functions
function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowLeft':
                case 'KeyA': 
                    input.left = true;
                    break;
            case 'ArrowRight':
                case 'KeyD': 
                    input.right = true;
                    break;
            case 'Escape': togglePause(); break;
            case 'KeyQ': toggleSound(); break;
            case 'Space':
                if (!input.shootingInterval) {
                    input.shootingInterval = setInterval(tryShoot);
                }
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'ArrowLeft': 
                case 'KeyA':
                    input.left = false; break;
            case 'ArrowRight': 
                case 'KeyD':
                    input.right = false; break;
            case 'Space':
                clearInterval(input.shootingInterval);
                input.shootingInterval = null;
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
        testSound.play()
    }
}

function initializeGame() {
    resetGameState();
    requestAnimationFrame(gameLoop);
}

function resetGameState() {
    Object.assign(state, {
        isOver: false,
        isPaused: false,
        score: 0,
        lives: 3,
        timeRemaining: 60
    });

    gameObjects.bullets.forEach(bullet => bullet.element.remove());
    gameObjects.aliens.forEach(alien => alien.element.remove());
    gameObjects.bullets = [];
    gameObjects.aliens = [];

    elements.player.style.left = `${config.GAME_WIDTH/2}px`;

    updateScoreboard();
    spawnAliens();
}



function togglePause() {
    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        clearInterval(timerInterval);
        state.pauseTime = 0
    } else {
        startTimer();
    }

    elements.pauseMenu.style.display = state.isPaused && !state.isOver ? 'block' : 'none';
}


document.getElementById('menu-toggle-btn').addEventListener('click', togglePause);

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    elements.scoreBoard.timer.classList.remove('low-time');
    elements.container.classList.remove('low-time');
    timerInterval = setInterval(() => {
        if (!state.isPaused) {
            if (state.timeRemaining <= 0) {
                clearInterval(timerInterval);

                gameOver();
            }
            if (state.timeRemaining <= 10) {
                elements.scoreBoard.timer.classList.add('low-time')
                elements.container.classList.add('low-time');

            } else {
                elements.scoreBoard.timer.classList.remove('low-time');
                elements.container.classList.remove('low-time');

            }
            state.timeRemaining--;
            updateScoreboard();
        }
    }, 1000);


}

function createScoreLabel(alien) {

    const scoreLabel = document.createElement('div');
    scoreLabel.classList.add('score-label');
    if (alien.element.dataset.type === '1') {
        scoreLabel.textContent = '+10';
    } else {
        scoreLabel.textContent = '+20';
    }
  
    scoreLabel.style.transform = `translate(${alien.x + 20}px, ${alien.y + 20}px)`;

    elements.container.appendChild(scoreLabel);
    return scoreLabel;
}

function animateScoreLabel(scoreLabel, alien) {
    setTimeout(() => {
        scoreLabel.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
        scoreLabel.style.transform = `translate(${alien.x + 20}px, ${alien.y - 30}px)`;
        scoreLabel.style.opacity = 0;
    }, 10);

    setTimeout(() => {
        scoreLabel.remove();
    }, 1000);
}

function updateScoreboard() {
    elements.scoreBoard.timer.textContent = `Time: ${state.timeRemaining}`;
    elements.scoreBoard.score.textContent = `Score: ${state.score}`;
    elements.scoreBoard.Level.textContent = `Level: ${state.currentLevel}`
    updateLivesDisplay();
    checkTopScore();
}

function checkTopScore() {
    if (state.score >= config.MAX_SCORE) {
        showGameTop();
    }
}

function updateLivesDisplay() {
    const livesContainer = document.getElementById('lives-container');
    livesContainer.innerHTML = '';

    for (let i = 0; i < 3; i++) { // Loop through maxLives
        const heart = document.createElement('img');

        // If we still have this life, display the regular heart
        if (i < state.lives) {
            heart.src = 'assets/images/heart.png'; // For remaining lives
        } else {
            heart.src = 'assets/images/heart-lose.png'; // For lost lives
        }

        heart.alt = 'Heart';
        heart.width = 20; // Ensure consistent size
        livesContainer.appendChild(heart);
    }
}

function gameLoop() {
    if (!state.isPaused || state.isOver) {
        updatePlayerMovement();
        updateBullets();
        updateAliens();
        updateEnemyShooting();
        updateScoreboard();
    }
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    state.isOver = true;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    gameObjects.bullets.forEach(bullet => bullet.element.remove());
    gameObjects.aliens.forEach(alien => alien.element.remove());
    gameObjects.bullets = [];
    gameObjects.aliens = [];
    const overlay = createOverlay('Game Over', state.score, '#ff4d4d');
    elements.container.appendChild(overlay);
    
   // cancelAnimationFrame(gameLoop);
}

function showGameTop() {
    state.isPaused = true;
    if (state.currentLevel >= config.MAX_LEVEL) {
        endOfGame()
        return;
    }
    const overlay = createOverlay('Congratulations!', state.score, '#4CAF50', true);
    elements.container.appendChild(overlay);
   if (!state.isOver) {
    document.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            const button = document.getElementById("restart-game-btn");
            if (button) {
                button.click();
            }
        }
    });
    }
}

function createOverlay(title, score, buttonColor, isTop = false) {
    let text
    if (state.isOver) {
        text = 'Try again'
    } else {
        text = 'Next level'
    }
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
        ">${text}</button>
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
    config.BULLET_SPEED += 3
    config.RANDOM_BULLET += 0.01
    enemySpeed += 0.5

    resetGameState();
    startTimer();
    elements.pauseMenu.style.display = 'none';

    document.querySelectorAll('.game-over-overlay, .congratulations-overlay').forEach(overlay => {
        overlay.remove();
    });

    updateScoreboard();
}

function endOfGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    const congratulationsOverlay = document.createElement('div');
    congratulationsOverlay.classList.add('congratulations-overlay');

    const message = document.createElement('h1');
    message.textContent = 'Congratulations! You completed the game!';
    congratulationsOverlay.appendChild(message);

    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    restartButton.classList.add('restart-button');
    restartButton.addEventListener('click', () => {
        location.reload()
    });
    congratulationsOverlay.appendChild(restartButton);

    elements.container.innerHTML = '';
    elements.container.appendChild(congratulationsOverlay);

    state.isPaused = true;
    return;
}

function restartGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    resetGameState();
    state.timeRemaining = 60;
    state.isPaused = false;

    startTimer();
    elements.pauseMenu.style.display = 'none';

    document.querySelectorAll('.game-over-overlay, .congratulations-overlay').forEach(overlay => {
        overlay.remove();
    });

    updateScoreboard();
}
window.addEventListener('resize', () => {
    updateAlienPositions()
    updatePlayerSize()
})
function updatePlayerSize() {
    const playerHeight = (config.GAME_HEIGHT * 6) / 100;
    const playerWidth = (config.GAME_WIDTH * 6) / 100;
    elements.player.style.height = `${playerHeight}px`;
    elements.player.style.width = `${playerWidth}px`;
    elements.player.style.left = `${config.GAME_WIDTH/2}px`;
}
function updateAlienPositions() {
    const rows = 5;
    const cols = 10;
    const alienWidth = config.GAME_WIDTH / (cols + 5);
    const alienHeight = config.GAME_HEIGHT / (rows + 15);
    
    const offsetX = (config.GAME_WIDTH - (alienWidth * cols)) / 2;
    const offsetY = (config.GAME_HEIGHT - (alienHeight * rows)) / 8;
    
    gameObjects.aliens.forEach((alien, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const alienLeft = offsetX + col * alienWidth;
        const alienTop = offsetY + row * alienHeight;
        alien.element.style.width = `${alienWidth}px`;
        alien.element.style.height = `${alienHeight}px`;
        alien.element.style.transform = `translate(${alienLeft}px, ${alienTop}px)`;

        alien.x = alienLeft;
        alien.y = alienTop;
    });
}
document.getElementById('startButton').addEventListener('click', function() {
    const startScreen = document.getElementById('start');
    startScreen.remove()
    initializeGame();
});
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    startTimer()
});


export {sounds, state, elements, enemySpeed, config, performance, input, gameObjects};
export {createScoreLabel, animateScoreLabel, updateScoreboard, updateLivesDisplay, gameOver };