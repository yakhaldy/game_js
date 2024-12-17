// Space Invaders Game
class SpaceInvadersGame {
    constructor() {
        this.sounds = {
            killEnemy: new Audio('assets/sounds/kill_enemy.mp3'),
            loseLife: new Audio('assets/sounds/lose_life.mp3')
        };
        this.enemyDirection = 1; 
        this.enemySpeed = 0.2;
        // Game Configuration
        this.config = {
            FPS: 60,
            FRAME_TIME: 1000 / 60,
            GAME_WIDTH: 800,
            GAME_HEIGHT: 900,
            PLAYER_SPEED: 5,
            BULLET_SPEED: 10 
        }; 

        // Game State
        this.state = {
            isRunning: false,
            isPaused: false,
            score: 0,
            lives: 3,
            timeRemaining: 60
        };
        

        // Performance Tracking
        this.performance = {
            frameCount: 0,
            lastFrameTime: 0,
            lastShootTime: 0
        };

        // DOM Elements
        this.elements = {
            container: document.getElementById('game-container'),
            player: document.getElementById('player'),
            pauseMenu: document.getElementById('pause-menu'),
            scoreBoard: {
                timer: document.getElementById('timer'),
                score: document.getElementById('score'),
                lives: document.getElementById('lives')
            }
        };

        // Input State
        this.input = {
            left: false,
            right: false,
            shoot: false
        };

        // Game Collections
        this.gameObjects = {
            bullets: [],
            aliens: []
        };
        this.test_timeRemaining()
        this.setupEventListeners();
        this.initializeGame();
    }

    setupEventListeners() {
        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft': this.input.left = true; break;
                case 'ArrowRight': this.input.right = true; break;
                case 'Space': 
                    this.input.shoot = true; 
                    this.tryShoot();
                    break;
                case 'Escape': this.togglePause(); break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowLeft': this.input.left = false; break;
                case 'ArrowRight': this.input.right = false; break;
                case 'Space': this.input.shoot = false; break;
            }
        });

        // Pause Menu Buttons
        document.getElementById('continue-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
    }

    initializeGame() {
        this.resetGameState();
        this.startGameLoop();
    }

    resetGameState() {
        this.state = {
            isRunning: true,
            isPaused: false,
            score: 0,
            lives: 3, // Start with 3 lives
            timeRemaining: 60
        };
    
        // Clear existing bullets and aliens
        this.gameObjects.bullets.forEach(bullet => bullet.element.remove());
        this.gameObjects.aliens.forEach(alien => alien.element.remove());
        this.gameObjects.bullets = [];
        this.gameObjects.aliens = [];
    
        // Reset player position
        this.elements.player.style.left = '375px';
    
        this.updateScoreboard();
        this.spawnAliens();
    }
    togglePause() {
        this.state.isPaused = !this.state.isPaused;
    
        if (this.state.isPaused) {
            // Pause the timer
            clearInterval(this.timerInterval);
        } else {
            // Resume the timer
            this.test_timeRemaining();
        }
    
        // Show or hide the pause menu
        this.elements.pauseMenu.style.display = this.state.isPaused ? 'block' : 'none';
    }
    restartGame() {
        this.resetGameState();
    
        // Clear any existing timers to avoid duplication
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null; // Reset timer reference
        }
    
        // Reset the game state
        this.state.timeRemaining = 60; // Set the timer to the initial value (e.g., 60 seconds)
        this.state.isPaused = false;
        this.state.isRunning = true;
    
        // Restart the timer
        this.test_timeRemaining();
    
        // Hide all overlays (Pause menu, Game Over, etc.)
        this.elements.pauseMenu.style.display = 'none';
        document.querySelectorAll('.game-over-overlay, .congratulations-overlay').forEach(overlay => {
            overlay.remove();
        });
    
        // Update the scoreboard display
        this.updateScoreboard();
    }
    
    spawnAliens() {
        const rows = 5;
        const cols = 10;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const alien = document.createElement('img');
                alien.src = 'alien.png'
                alien.classList.add('alien');
                alien.style.left = `${col * 60 + 100}px`;
                alien.style.top = `${row * 60 + 50}px`;
                this.elements.container.appendChild(alien);
                
                this.gameObjects.aliens.push({
                    element: alien,
                    x: col * 60 + 100,
                    y: row * 60 + 50
                });
            }
        }
    }
   
    // Update the tryShoot method in the previous implementation
tryShoot() {
    // Prevent rapid-fire by adding a small cooldown
    const currentTime = Date.now();
    if (currentTime - this.performance.lastShootTime < 250) return;

    // Get player position directly from style
    const playerLeft = parseInt(this.elements.player.style.left || '375');
    const playerWidth = this.elements.player.offsetWidth;

    // Calculate bullet start position precisely
    const bulletStartX = playerLeft + (playerWidth / 2) - 2.5; // Center of player, adjust bullet width
    const bulletStartY = this.config.GAME_HEIGHT - 70; // Just above player

    // Create bullet
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${bulletStartX}px`;
    bullet.style.top = `${bulletStartY}px`;
    this.elements.container.appendChild(bullet);

    // Store bullet object
    this.gameObjects.bullets.push({
        element: bullet,
        x: bulletStartX,
        y: bulletStartY
    });

    this.performance.lastShootTime = currentTime;
}
updateBullets() {
    this.gameObjects.bullets = this.gameObjects.bullets.filter(bullet => {
        const currentTop = parseFloat(bullet.element.style.top || 0);

        if (bullet.isEnemyBullet) {
            // Move enemy bullets down
            bullet.element.style.top = `${currentTop + this.config.BULLET_SPEED / 5}px`; // Enemy bullets are slower

            // Check for collision with player
            const playerRect = this.elements.player.getBoundingClientRect();
            const bulletRect = bullet.element.getBoundingClientRect();

            if (this.isColliding(playerRect, bulletRect)) {
                bullet.element.remove();
                this.loseLife(); // Lose a life when hit
                return false; // Remove bullet
            }

            // Remove bullet if off-screen
            if (currentTop > this.config.GAME_HEIGHT) {
                bullet.element.remove();
                return false;
            }
        } else {
            // Move player bullets up
            bullet.element.style.top = `${currentTop - this.config.BULLET_SPEED}px`;

            // Remove player bullets if off-screen
            if (currentTop < 0) {
                bullet.element.remove();
                return false;
            }

            // Check collision with aliens
            this.checkBulletAlienCollision(bullet);
        }

        return true;
    });
}

checkBulletAlienCollision(bullet) {
    this.gameObjects.aliens = this.gameObjects.aliens.filter(alien => {
        const alienRect = alien.element.getBoundingClientRect();
        const bulletRect = bullet.element.getBoundingClientRect();

        if (this.isColliding(bulletRect, alienRect)) {
            // Add destroyed class for animation
            alien.element.classList.add('destroyed');
            
            // Play kill enemy sound
            this.sounds.killEnemy.currentTime = 0; // Reset sound playback
            this.sounds.killEnemy.play();

            // Increase score
            this.state.score += 10;
            this.updateScoreboard();

            // Create temporary score label at alien position
            const scoreLabel = document.createElement('div');
            scoreLabel.classList.add('score-label');
            scoreLabel.textContent = '+10';
            scoreLabel.style.left = `${alien.x + 20}px`; // Position near the alien
            scoreLabel.style.top = `${alien.y + 20}px`;
            this.elements.container.appendChild(scoreLabel);

            // Smoothly animate the score label (move it upwards and fade out)
            setTimeout(() => {
                scoreLabel.style.transition = 'all 1s ease-out'; // Smooth transition
                scoreLabel.style.top = `${alien.y - 30}px`; // Move it upwards
                scoreLabel.style.opacity = 0; // Fade out
            }, 10);

            // Remove the label after animation completes
            setTimeout(() => {
                scoreLabel.remove();
            }, 1000); // Duration of the animation

            // Remove alien after animation completes (0.5s)
            setTimeout(() => {
                alien.element.remove(); // Remove the alien after the animation
            }, 500); // Delay removal for animation time

            // Remove bullet
            bullet.element.remove();

            return false; // Remove alien from game objects
        }

        return true; // Keep alien if not hit
    });
}

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }

    updatePlayerMovement() {
        const playerSpeed = this.config.PLAYER_SPEED;
        const currentLeft = parseInt(this.elements.player.style.left || '375');

        if (this.input.left && currentLeft > 0) {
            this.elements.player.style.left = `${currentLeft - playerSpeed}px`;
        }
        if (this.input.right && currentLeft < this.config.GAME_WIDTH - 50) {
            this.elements.player.style.left = `${currentLeft + playerSpeed}px`;
        }
    }
    test_timeRemaining() {
        if (this.timerInterval) clearInterval(this.timerInterval); // Clear existing timer if any
    
        this.timerInterval = setInterval(() => {
            if (!this.state.isPaused) { // Decrease time only when not paused
                if (this.state.timeRemaining <= 0) {
                    clearInterval(this.timerInterval);
                    this.gameOver();
                }
                this.state.timeRemaining--;
                this.updateScoreboard();
            }
        }, 1000);
    }
    updateAliens() {
        this.gameObjects.aliens.forEach((alien) => {
            alien.x += this.enemyDirection * this.enemySpeed;
            alien.element.style.left = `${alien.x}px`;
        });
    
        // Check if any alien hits the screen edge and reverse direction
        const aliensAtEdge = this.gameObjects.aliens.some((alien) => 
            alien.x <= 0 || alien.x >= this.config.GAME_WIDTH - 50
        );
    
        if (aliensAtEdge) {
            this.enemyDirection *= -1; // Reverse direction
            this.gameObjects.aliens.forEach((alien) => {
                alien.y += 20; // Move aliens down slightly
                alien.element.style.top = `${alien.y}px`;
            });
        }
    }
    updateEnemyShooting() {
        const randomAlienIndex = Math.floor(Math.random() * this.gameObjects.aliens.length);
        const alien = this.gameObjects.aliens[randomAlienIndex];
    
        // Random chance to shoot
        if (Math.random() < 0.01) { // ~1% chance per frame
            const bullet = document.createElement('div');
            bullet.classList.add('enemy-bullet');
            bullet.style.left = `${alien.x + 20}px`;
            bullet.style.top = `${alien.y + 20}px`;
    
            this.elements.container.appendChild(bullet);
    
            this.gameObjects.bullets.push({
                element: bullet,
                x: alien.x,
                y: alien.y,
                isEnemyBullet: true // Mark as enemy bullet
            });
        }
    }
    loseLife() {
        this.state.lives--;
        this.updateScoreboard();
    
        // Play lose life sound
        this.sounds.loseLife.currentTime = 0; // Reset sound playback
        this.sounds.loseLife.play();
    
        // Add visual effect
        this.flashPlayer();
    
        if (this.state.lives <= 0) {
            this.gameOver();
        }
    }
    flashPlayer() {
        const player = this.elements.player;
        player.classList.add('flash');
    
        // Remove the class after the animation completes
        setTimeout(() => {
            player.classList.remove('flash');
        }, 300);
    }
    gameOver() {
        // Stop the game
        this.state.isRunning = false;
        this.state.isPaused = true;
    
        // Create game over overlay
        const gameOverElement = document.createElement('div');
        gameOverElement.classList.add('game-over-overlay');
        gameOverElement.style.cssText = `
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
        gameOverElement.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 1rem;">Game Over</h1>
            <p style="font-size: 1.5rem; margin-bottom: 2rem;">Final Score: ${this.state.score}</p>
            <button id="restart-game-btn" style="
                padding: 10px 20px;
                font-size: 1rem;
                background-color: #ff4d4d;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">Restart Game</button>
        `;
    
        // Add to container
        this.elements.container.appendChild(gameOverElement);
    
        // Add restart event listener
        gameOverElement.querySelector('#restart-game-btn').addEventListener('click', () => {
            gameOverElement.remove();
            this.restartGame();
        });
    }
    test_score(){
        if (this.state.score >= 300) {
            this.gameTop();
        }
    }
    gameTop() {
        // Stop the game
        this.state.isRunning = false;
        this.state.isPaused = true;
    
        // Create congratulations overlay
        const gameTopElement = document.createElement('div');
        gameTopElement.classList.add('congratulations-overlay');
        gameTopElement.style.cssText = `
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
        gameTopElement.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 1rem;">Congratulations!</h1>
            <p style="font-size: 1.5rem; margin-bottom: 2rem;">You Reached the Top Score: ${this.state.score}</p>
            <button id="restart-game-btn" style="
                padding: 10px 20px;
                font-size: 1rem;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">Restart Game</button>
        `;
    
        // Add to container
        this.elements.container.appendChild(gameTopElement);
    
        // Add restart event listener
        gameTopElement.querySelector('#restart-game-btn').addEventListener('click', () => {
            gameTopElement.remove();
            this.restartGame();
        });
    }
     

    updateScoreboard() {
        this.elements.scoreBoard.timer.textContent = `Time: ${this.state.timeRemaining}`;
        this.elements.scoreBoard.score.textContent = `Score: ${this.state.score}`;
        this.elements.scoreBoard.lives.textContent = `Lives: ${this.state.lives}`;
        this.test_score()
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.performance.lastFrameTime;
        this.performance.lastFrameTime = timestamp;
    
        if (!this.state.isPaused && this.state.isRunning) {
            this.updatePlayerMovement();
            this.updateBullets();
            this.updateAliens(); // Move enemies
            this.updateEnemyShooting(); // Make enemies shoot
            this.updateScoreboard();
    
            this.performance.frameCount++;
        }
    
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    startGameLoop() {
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}


function updateTimer() {
   
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `Time: ${timeRemaining}`;

    if (timeRemaining <= 10) {    
        timerElement.classList.add('timer-warning');
    } else {
        timerElement.classList.remove('timer-warning');
    }

    if (timeRemaining <= 0) {
        // Handle game over or restart
    }
}

setInterval(updateTimer, 1000);
// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SpaceInvadersGame();
});
