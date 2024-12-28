import { elements, gameObjects, enemySpeed, config } from './game.js';

let enemyDirection = 1;

export function spawnAliens() {
    // Check if elements are initialized
    if (!elements || !elements.container) {
        console.error('Game elements not initialized');
        return;
    }

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

export function updateAliens() {
    if (!elements) return;

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

export function updateEnemyShooting() {
    if (!elements || gameObjects.aliens.length === 0) return;

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