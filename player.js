import { elements, gameObjects, config, performance, updateScoreboard, animateScoreLabel, createScoreLabel, input, sounds, state, gameOver } from './game.js';


export function updatePlayerMovement() {
    const containerXY = elements.container.getBoundingClientRect()
    const playerXY = elements.player.getBoundingClientRect();
    const playerSpeed = config.PLAYER_SPEED

    if (input.left) {
        if (playerXY.left - playerSpeed >= containerXY.left) {
            elements.player.style.left = `${playerXY.left - containerXY.left - playerSpeed}px`;
        }
    }
    if (input.right) {
        if (playerXY.right + playerSpeed <= containerXY.right) {
            elements.player.style.left = `${playerXY.left - containerXY.left + playerSpeed}px`;
        }
    }
 
}

export function tryShoot() {
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
export function isColliding(rect1, rect2) {
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
    setTimeout(() => {
        elements.player.classList.remove('flash');
    }, 300);
}


export function updateBullets() {
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