// Game state and configuration objects

const sounds = {
    killEnemy: new Audio('assets/sounds/kill_enemy.mp3'),
    loseLife: new Audio('assets/sounds/lose_life.mp3')
};



let enemyDirection = 1;
let enemySpeed = 6//0.2;
let timerInterval = null;

const config = {
    GAME_WIDTH: 800,
    GAME_HEIGHT: 900,
    PLAYER_SPEED: 5,
    BULLET_SPEED: 10
};

const state = {
    isRunning: false,
    isPaused: false,
    score: 0,
    lives: 3,
    timeRemaining: 60,
    currentLevel: 1
};

const performance = {
    lastFrameTime: 0,
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
    shoot: false,
    sound: true
};

const gameObjects = {
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

function spawnAliens() {
    const rows = 5;
    const cols = 10;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const alien = document.createElement('img');
            alien.src = 'alien.png';
            alien.classList.add('alien');
            alien.style.left = `${col * 60 + 100}px`;
            alien.style.top = `${row * 60 + 50}px`;
            elements.container.appendChild(alien);

            gameObjects.aliens.push({
                element: alien,
                x: col * 60 + 100,
                y: row * 60 + 50
            });
        }
    }
}

function tryShoot() {
    const currentTime = Date.now();
    if (currentTime - performance.lastShootTime < 250) return;

    const playerLeft = parseInt(elements.player.style.left || '375');
    const playerWidth = elements.player.offsetWidth;
    const bulletStartX = playerLeft + (playerWidth / 2) - 2.5;
    const bulletStartY = config.GAME_HEIGHT - 70;

    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${bulletStartX}px`;
    bullet.style.top = `${bulletStartY}px`;
    elements.container.appendChild(bullet);

    gameObjects.bullets.push({
        element: bullet,
        x: bulletStartX,
        y: bulletStartY
    });

    performance.lastShootTime = currentTime;
}

function updateBullets() {
    gameObjects.bullets = gameObjects.bullets.filter(bullet => {
        const currentTop = parseFloat(bullet.element.style.top || 0);

        if (bullet.isEnemyBullet) {
            bullet.element.style.top = `${currentTop + config.BULLET_SPEED / 5}px`;

            const playerRect = elements.player.getBoundingClientRect();
            const bulletRect = bullet.element.getBoundingClientRect();

            if (isColliding(playerRect, bulletRect)) {
                bullet.element.remove();
                loseLife();
                return false;
            }

            if (currentTop > config.GAME_HEIGHT) {
                bullet.element.remove();
                return false;
            }
        } else {
            bullet.element.style.top = `${currentTop - config.BULLET_SPEED}px`;

            if (currentTop < 0) {
                bullet.element.remove();
                return false;
            }

            checkBulletAlienCollision(bullet);
        }

        return true;
    });
}

function isColliding(rect1, rect2) {
    return !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom);
}

function updatePlayerMovement() {
    const playerSpeed = config.PLAYER_SPEED;
    const currentLeft = parseInt(elements.player.style.left || '375');

    if (input.left && currentLeft > 0) {
        elements.player.style.left = `${currentLeft - playerSpeed}px`;
    }
    if (input.right && currentLeft < config.GAME_WIDTH - 50) {
        elements.player.style.left = `${currentLeft + playerSpeed}px`;
    }
}

function updateAliens() {
    gameObjects.aliens.forEach((alien) => {
        alien.x += enemyDirection * enemySpeed;
        alien.element.style.left = `${alien.x}px`;
        
    });
    
    

    const aliensAtEdge = gameObjects.aliens.some((alien) =>
        alien.x <= 0 || alien.x >= config.GAME_WIDTH - 50
    );

    if (aliensAtEdge) {
        enemyDirection *= -1;
        gameObjects.aliens.forEach((alien) => {
            alien.y += 20;
            alien.element.style.top = `${alien.y}px`;
        });
    }
}

function checkBulletAlienCollision(bullet) {
    gameObjects.aliens = gameObjects.aliens.filter(alien => {
        const alienRect = alien.element.getBoundingClientRect();
        const bulletRect = bullet.element.getBoundingClientRect();

        if (isColliding(bulletRect, alienRect)) {
            alien.element.classList.add('destroyed');
            if (input.sound) {
                sounds.killEnemy.currentTime = 0;
                sounds.killEnemy.play();
            }

            state.score += 10;
            updateScoreboard();

            const scoreLabel = createScoreLabel(alien);
            animateScoreLabel(scoreLabel, alien);

            setTimeout(() => {
                alien.element.remove();
            }, 500);

            bullet.element.remove();
            return false;
        }
        return true;
    });
}

function createScoreLabel(alien) {
    const scoreLabel = document.createElement('div');
    scoreLabel.classList.add('score-label');
    scoreLabel.textContent = '+10';
    scoreLabel.style.left = `${alien.x + 20}px`;
    scoreLabel.style.top = `${alien.y + 20}px`;
    elements.container.appendChild(scoreLabel);
    return scoreLabel;
}

function animateScoreLabel(scoreLabel, alien) {
    setTimeout(() => {
        scoreLabel.style.transition = 'all 1s ease-out';
        scoreLabel.style.top = `${alien.y - 30}px`;
        scoreLabel.style.opacity = 0;
    }, 10);

    setTimeout(() => {
        scoreLabel.remove();
    }, 1000);
}

function updateEnemyShooting() {
    if (gameObjects.aliens.length === 0) return;

    const randomAlienIndex = Math.floor(Math.random() * gameObjects.aliens.length);
    const alien = gameObjects.aliens[randomAlienIndex];

    if (Math.random() < 0.01) {
        const bullet = document.createElement('div');
        bullet.classList.add('enemy-bullet');
        bullet.style.left = `${alien.x + 20}px`;
        bullet.style.top = `${alien.y + 20}px`;

        elements.container.appendChild(bullet);

        gameObjects.bullets.push({
            element: bullet,
            x: alien.x,
            y: alien.y,
            isEnemyBullet: true
        });
    }
}

function loseLife() {
    state.lives--;
    updateScoreboard();
    if (input.sound) {
        sounds.loseLife.currentTime = 0;
        sounds.loseLife.play();
    }

    flashPlayer();

    if (state.lives <= 0) {
        gameOver();
    }
}

function flashPlayer() {
    elements.player.classList.add('flash');
    setTimeout(() => {
        elements.player.classList.remove('flash');
    }, 300);
}

function updateScoreboard() {
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
    //const deltaTime = timestamp - performance.lastFrameTime;
    performance.lastFrameTime = timestamp;

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

function gameOver() {
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
            console.log('--');
            nextLevel();
        } else {
            console.log('+++');   
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
    config.BULLET_SPEED += 5
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
    setupEventListeners();
    initializeGame();
});