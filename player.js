import { elements, gameObjects, config, performance, updateScoreboard, animateScoreLabel, createScoreLabel, input, sounds, state, gameOver } from './game.js';

function updatePlayerMovement() {
    if (state.isPaused || state.isOver) return;
    const playerXY = elements.player.getBoundingClientRect();
    const containerXY = elements.container.getBoundingClientRect();
    const playerSpeed = config.PLAYER_SPEED;
    const currentX = parseInt(elements.player.dataset.currentX || '0');

    let newX = currentX;

    if (input.left && playerXY.left - playerSpeed >= containerXY.left) {
        newX = currentX - playerSpeed;
    }
    if (input.right && playerXY.right + playerSpeed <= containerXY.right) {
        newX = currentX + playerSpeed;
    }

    if (newX !== currentX) {
        elements.player.style.transform = `translateX(${newX}px)`;
        elements.player.dataset.currentX = newX.toString();
    }
}

function tryShoot() {
    if (state.isPaused || state.isOver) return;
    const currentTime = Date.now();
    if (currentTime - performance.lastShootTime < 250) return;
    
    const playerXY = elements.player.getBoundingClientRect();
    const containerRect = elements.container.getBoundingClientRect();
    
    const bulletStartX = playerXY.left + (playerXY.width / 2) - containerRect.left - 2.5;
    const bulletStartY = config.GAME_HEIGHT - 70;
    
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    
    // Set initial position using transform
    bullet.style.transform = `translate(${bulletStartX}px, ${bulletStartY}px)`;
    bullet.style.willChange = 'transform';
    elements.container.appendChild(bullet);
    gameObjects.bullets.push({
        element: bullet,
        x: bulletStartX,
        y: bulletStartY,
        initialY: bulletStartY
    });
    
    sounds.shoot.play();
    performance.lastShootTime = currentTime;
}

function updateBullets() {
    gameObjects.bullets = gameObjects.bullets.filter(bullet => {
        const transform = getComputedStyle(bullet.element).transform;  
        const matrix = new DOMMatrix(transform);
        const currentY = matrix.m42; 
        if (bullet.isEnemyBullet) {
            const newY = currentY + config.BULLET_SPEED / 5;
            bullet.element.style.transform = `translate(${matrix.m41}px, ${newY}px)`;

            const playerRect = elements.player.getBoundingClientRect();
            const bulletRect = bullet.element.getBoundingClientRect();

            if (isColliding(playerRect, bulletRect)) {
                bullet.element.remove();
                loseLife();
                return false;
            }
            if (newY > config.GAME_HEIGHT) {
                bullet.element.remove();
                return false;
            }
        } else {
            const newY = currentY - config.BULLET_SPEED;
            bullet.element.style.transform = `translate(${matrix.m41}px, ${newY}px)`;
            if (newY < 0) {
                bullet.element.remove();
                return false;
            }
            checkBulletAlienCollision(bullet);
        }
        return true;
    });
}

function checkBulletAlienCollision(bullet) {
     gameObjects.aliens.forEach(alien => {
        const alienRect = alien.element.getBoundingClientRect();
        const bulletRect = bullet.element.getBoundingClientRect();
        if (!alien.element.classList.contains('destroyed')) {
            if (isColliding(bulletRect, alienRect)) {
                alien.element.classList.add('destroyed');
                if (input.sound) {
                    sounds.killEnemy.currentTime = 0;
                    sounds.killEnemy.play();
                }

                if (alien.element.dataset.type === '1') {
                    state.score += 10;
                } else {
                    state.score += 20;
                }
                updateScoreboard();

                const scoreLabel = createScoreLabel(alien);
                animateScoreLabel(scoreLabel, alien);
                bullet.element.remove();
            }
        }
    });
}

function isColliding(rect1, rect2) {
    return !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom);
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
    elements.container.classList.add('low-time');
    elements.scoreBoard.lives.classList.add('lose-live');
    setTimeout(() => {
        elements.player.classList.remove('flash');
        elements.container.classList.remove('low-time');
        elements.scoreBoard.lives.classList.remove('lose-live');
    }, 300);
}

export {updatePlayerMovement, tryShoot, updateBullets, isColliding};