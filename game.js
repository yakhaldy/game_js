// Space Invaders Game
class SpaceInvadersGame {
    constructor() {
        // Game Configuration
        this.config = {
            FPS: 60,
            FRAME_TIME: 1000 / 60,
            GAME_WIDTH: 800,
            GAME_HEIGHT: 600,
            PLAYER_SPEED: 5,
            BULLET_SPEED: 10
        };

        // Game State
        this.state = {
            isRunning: false,
            isPaused: false,
            score: 0,
            lives: 1,
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
            lives: 1,
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
        this.elements.pauseMenu.style.display = this.state.isPaused ? 'block' : 'none';
    }

    restartGame() {
        this.resetGameState();
        this.togglePause(); // Hide pause menu
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
        // Move existing bullets
        this.gameObjects.bullets = this.gameObjects.bullets.filter(bullet => {
            const currentTop = parseFloat(bullet.element.style.top || 0);
            
            // Move bullet up
            bullet.element.style.top = `${currentTop - this.config.BULLET_SPEED}px`;

            // Remove bullet if it goes off screen
            if (currentTop < 0) {
                bullet.element.remove();
                return false;
            }

            // Basic collision detection with aliens
            this.checkBulletAlienCollision(bullet);

            return true;
        });
    }

    checkBulletAlienCollision(bullet) {
        this.gameObjects.aliens = this.gameObjects.aliens.filter(alien => {
            const bulletRect = bullet.element.getBoundingClientRect();
            const alienRect = alien.element.getBoundingClientRect();

            if (this.isColliding(bulletRect, alienRect)) {
                // Remove alien and bullet
                alien.element.remove();
                bullet.element.remove();
                
                // Increase score
                this.state.score += 10;
                
                this.updateScoreboard();
                
                
                return false; // Remove alien from tracking
            }
            return true;
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
    test_timeRemaining(){
        const count = setInterval(() => {
            // this.state.timeRemaining = timeRemaining
            if ( this.state.timeRemaining <= 0){
                clearInterval(count)
                this.gameOver();
            }
            this.state.timeRemaining--;
         }, 1000);
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
        // Performance tracking
        const deltaTime = timestamp - this.performance.lastFrameTime;
        this.performance.lastFrameTime = timestamp;

        if (!this.state.isPaused && this.state.isRunning) {
            this.updatePlayerMovement();
            this.updateBullets();
            this.updateScoreboard();

            this.performance.frameCount++;
        }

        // Always request next animation frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    startGameLoop() {
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SpaceInvadersGame();
});



