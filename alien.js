import { elements, gameObjects, enemySpeed, config,state } from './game.js';

let enemyDirection = 1;

export function spawnAliens() {
    const rows = 5;
    const cols = 10;
    
    const alienWidth = config.GAME_WIDTH / (cols + 5);
    const alienHeight = config.GAME_HEIGHT / (rows + 15);
    
    const offsetX = (config.GAME_WIDTH - (alienWidth * cols)) / 2;  
    const offsetY = (config.GAME_HEIGHT - (alienHeight * rows)) / 8;  

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const alien = document.createElement('img');          
            if (row == 0 && state.currentLevel > 2) {
                alien.src = 'alien2.png';
                alien.dataset.type = '2';
            } else {
                alien.src = 'alien.png';
                alien.dataset.type = '1';
            }
            alien.classList.add('alien');
            alien.style.width = `${alienWidth}px`;
            alien.style.height = `${alienHeight}px`;
            alien.style.willChange = 'transform';

            const alienLeft = offsetX + col * alienWidth;
            const alienTop = offsetY + row * alienHeight;

           
            alien.style.transform = `translate(${alienLeft}px, ${alienTop}px)`;

            elements.container.appendChild(alien);
            gameObjects.aliens.push({
                element: alien,
                x: alienLeft,
                y: alienTop
            });
        }
    }
}


export function updateAliens() {
    const movement = enemyDirection * enemySpeed;
    let needsDirectionChange = false;
   // requestAnimationFrame(() => {
        gameObjects.aliens.forEach((alien) => {
            alien.x += movement; 
            if (!needsDirectionChange) {
                needsDirectionChange = alien.x <= 0 || alien.x >= config.GAME_WIDTH - 50;
            }
            alien.element.style.transform = `translate(${alien.x}px, ${alien.y}px)`;
        });
        
        if (needsDirectionChange) {
            enemyDirection *= -1;
        }
   // });
}



export function updateEnemyShooting() {
    if (!elements || gameObjects.aliens.length === 0) return;

    const randomAlienIndex = Math.floor(Math.random() * gameObjects.aliens.length);
    const alien = gameObjects.aliens[randomAlienIndex];

    if (Math.random() < config.RANDOM_BULLET) {
        const bullet = document.createElement('div');
        bullet.classList.add('enemy-bullet');
        bullet.style.transform = `translate(${alien.x + 20}px, ${alien.y + 20}px)`;
        bullet.style.willChange = 'transform';

        elements.container.appendChild(bullet);

        gameObjects.bullets.push({
            element: bullet,
            x: alien.x,
            y: alien.y,
            isEnemyBullet: true
        });
    }
}