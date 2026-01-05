  // Game variables
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');
        const livesElement = document.getElementById('lives');
        const levelElement = document.getElementById('level');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScoreElement = document.getElementById('finalScore');
        const finalLevelElement = document.getElementById('finalLevel');
        
        // Game state
        let game = {
            running: false,
            paused: false,
            score: 0,
            lives: 3,
            level: 1,
            soundEnabled: true,
            lastTime: 0,
            enemies: [],
            bullets: [],
            enemyBullets: [],
            powerUps: [],
            particles: []
        };
        
        // Player object
        const player = {
            x: canvas.width / 2 - 25,
            y: canvas.height - 80,
            width: 50,
            height: 60,
            speed: 6,
            color: '#4a9eff',
            lastShot: 0,
            shotDelay: 300,
            isMovingLeft: false,
            isMovingRight: false
        };
        
        // Keyboard state
        const keys = {};
        
        // Event Listeners
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            
            // Prevent arrow keys from scrolling the page
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
        
        // Button event listeners
        document.getElementById('startBtn').addEventListener('click', startGame);
        document.getElementById('pauseBtn').addEventListener('click', togglePause);
        document.getElementById('resetBtn').addEventListener('click', resetGame);
        document.getElementById('soundBtn').addEventListener('click', toggleSound);
        document.getElementById('restartBtn').addEventListener('click', restartGame);
        
        // Mobile controls
        document.getElementById('leftBtn').addEventListener('touchstart', () => player.isMovingLeft = true);
        document.getElementById('leftBtn').addEventListener('touchend', () => player.isMovingLeft = false);
        document.getElementById('rightBtn').addEventListener('touchstart', () => player.isMovingRight = true);
        document.getElementById('rightBtn').addEventListener('touchend', () => player.isMovingRight = false);
        document.getElementById('shootBtn').addEventListener('touchstart', () => {
            if (game.running && !game.paused) {
                shootBullet();
            }
        });
        
        // For mouse support on mobile buttons
        document.getElementById('leftBtn').addEventListener('mousedown', () => player.isMovingLeft = true);
        document.getElementById('leftBtn').addEventListener('mouseup', () => player.isMovingLeft = false);
        document.getElementById('rightBtn').addEventListener('mousedown', () => player.isMovingRight = true);
        document.getElementById('rightBtn').addEventListener('mouseup', () => player.isMovingRight = false);
        document.getElementById('shootBtn').addEventListener('mousedown', () => {
            if (game.running && !game.paused) {
                shootBullet();
            }
        });
        
        // Game functions
        function startGame() {
            if (!game.running) {
                game.running = true;
                game.paused = false;
                game.score = 0;
                game.lives = 3;
                game.level = 1;
                game.enemies = [];
                game.bullets = [];
                game.enemyBullets = [];
                game.powerUps = [];
                game.particles = [];
                
                scoreElement.textContent = game.score;
                livesElement.textContent = game.lives;
                levelElement.textContent = game.level;
                
                gameOverScreen.style.display = 'none';
                
                // Initial enemies
                spawnEnemies();
                
                // Start game loop
                game.lastTime = performance.now();
                requestAnimationFrame(gameLoop);
            } else if (game.paused) {
                game.paused = false;
                game.lastTime = performance.now();
                requestAnimationFrame(gameLoop);
            }
        }
        
        function togglePause() {
            if (game.running) {
                game.paused = !game.paused;
                document.getElementById('pauseBtn').textContent = game.paused ? 'Resume' : 'Pause';
                
                if (!game.paused) {
                    game.lastTime = performance.now();
                    requestAnimationFrame(gameLoop);
                }
            }
        }
        
        function resetGame() {
            game.running = false;
            game.paused = false;
            document.getElementById('pauseBtn').textContent = 'Pause';
            gameOverScreen.style.display = 'none';
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw reset screen
            drawResetScreen();
        }
        
        function toggleSound() {
            game.soundEnabled = !game.soundEnabled;
            document.getElementById('soundBtn').textContent = `Sound: ${game.soundEnabled ? 'ON' : 'OFF'}`;
        }
        
        function restartGame() {
            gameOverScreen.style.display = 'none';
            startGame();
        }
        
        function gameLoop(currentTime) {
            if (!game.running || game.paused) return;
            
            const deltaTime = currentTime - game.lastTime;
            game.lastTime = currentTime;
            
            // Update game state
            update(deltaTime);
            
            // Draw everything
            draw();
            
            // Continue game loop
            requestAnimationFrame(gameLoop);
        }
        
        function update(deltaTime) {
            // Move player based on keyboard or mobile controls
            if ((keys['ArrowLeft'] || keys['a'] || player.isMovingLeft) && player.x > 0) {
                player.x -= player.speed;
            }
            if ((keys['ArrowRight'] || keys['d'] || player.isMovingRight) && player.x < canvas.width - player.width) {
                player.x += player.speed;
            }
            
            // Shooting with spacebar or up arrow
            if ((keys[' '] || keys['ArrowUp'] || keys['w']) && currentTime - player.lastShot > player.shotDelay) {
                shootBullet();
                player.lastShot = currentTime;
             // Update bullets
            for (let i = game.bullets.length - 1; i >= 0; i--) {
                game.bullets[i].y -= game.bullets[i].speed;
                
                // Remove bullets that go off screen
                if (game.bullets[i].y < 0) {
                    game.bullets.splice(i, 1);
                    continue;
                }
                
                // Check collision with enemies
                for (let j = game.enemies.length - 1; j >= 0; j--) {
                    if (checkCollision(game.bullets[i], game.enemies[j])) {
                        // Create explosion particles
                        createExplosion(game.enemies[j].x + game.enemies[j].width/2, game.enemies[j].y + game.enemies[j].height/2);
                        
                        // Remove bullet and enemy
                        game.bullets.splice(i, 1);
                        game.enemies.splice(j, 1);
                        
                        // Increase score
                        game.score += 100;
                        scoreElement.textContent = game.score;
                        
                        // Occasionally drop a power-up
                        if (Math.random() < 0.2) {
                            createPowerUp(game.enemies[j].x + game.enemies[j].width/2, game.enemies[j].y);
                        }
                        
                        break;
                    }
                }
            }
            
            // Update enemies
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                game.enemies[i].y += game.enemies[i].speed;
                
                // Remove enemies that go off screen
                if (game.enemies[i].y > canvas.height) {
                    game.enemies.splice(i, 1);
                    continue;
                }
                
                // Enemy shooting
                if (Math.random() < 0.002 * game.level) {
                    shootEnemyBullet(game.enemies[i]);
                }
                
                // Check collision with player
                if (checkCollision(player, game.enemies[i])) {
                    // Create explosion particles
                    createExplosion(player.x + player.width/2, player.y + player.height/2);
                    
                    // Remove enemy
                    game.enemies.splice(i, 1);
                    
                    // Lose a life
                    game.lives--;
                    livesElement.textContent = game.lives;
                    
                    // Reset player position
                    player.x = canvas.width / 2 - 25;
                    
                    // Check game over
                    if (game.lives <= 0) {
                        gameOver();
                    }
                }
            }
            
            // Update enemy bullets
            for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
                game.enemyBullets[i].y += game.enemyBullets[i].speed;
                
                // Remove bullets that go off screen
                if (game.enemyBullets[i].y > canvas.height) {
                    game.enemyBullets.splice(i, 1);
                    continue;
                }
                
                // Check collision with player
                if (checkCollision(player, game.enemyBullets[i])) {
                    // Create explosion particles
                    createExplosion(player.x + player.width/2, player.y + player.height/2);
                    
                    // Remove bullet
                    game.enemyBullets.splice(i, 1);
                    
                    // Lose a life
                    game.lives--;
                    livesElement.textContent = game.lives;
                    
                    // Reset player position
                    player.x = canvas.width / 2 - 25;
                    
                    // Check game over
                    if (game.lives <= 0) {
                        gameOver();
                    }
                }
            }
            
            // Update power-ups
            for (let i = game.powerUps.length - 1; i >= 0; i--) {
                game.powerUps[i].y += game.powerUps[i].speed;
                
                // Remove power-ups that go off screen
                if (game.powerUps[i].y > canvas.height) {
                    game.powerUps.splice(i, 1);
                    continue;
                }
                
                // Check collision with player
                if (checkCollision(player, game.powerUps[i])) {
                    // Apply power-up effect
                    applyPowerUp(game.powerUps[i].type);
                    
                    // Remove power-up
                    game.powerUps.splice(i, 1);
                }
            }
            
            // Update particles
            for (let i = game.particles.length - 1; i >= 0; i--) {
                game.particles[i].x += game.particles[i].vx;
                game.particles[i].y += game.particles[i].vy;
                game.particles[i].life--;
                
                // Remove dead particles
                if (game.particles[i].life <= 0) {
                    game.particles.splice(i, 1);
                }
            }
            
            // Spawn new enemies if needed
            if (game.enemies.length < 5 + game.level * 2) {
                spawnEnemy();
            }
            
            // Check level progression
            if (game.score >= game.level * 1000) {
                levelUp();
            }
        }
        
        function draw() {
            // Clear canvas with a space-like background
            ctx.fillStyle = 'rgba(0, 5, 20, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw stars in the background
            drawStars();
            
            // Draw player
            drawPlayer();
            
            // Draw enemies
            game.enemies.forEach(enemy => drawEnemy(enemy));
            
            // Draw bullets
            game.bullets.forEach(bullet => drawBullet(bullet));
            
            // Draw enemy bullets
            game.enemyBullets.forEach(bullet => drawEnemyBullet(bullet));
            
            // Draw power-ups
            game.powerUps.forEach(powerUp => drawPowerUp(powerUp));
            
            // Draw particles
            game.particles.forEach(particle => drawParticle(particle));
            
            // Draw HUD
            drawHUD();
        }
        
        function drawPlayer() {
            // Draw player ship
            ctx.fillStyle = player.color;
            
            // Ship body
            ctx.beginPath();
            ctx.moveTo(player.x + player.width/2, player.y);
            ctx.lineTo(player.x + player.width, player.y + player.height);
            ctx.lineTo(player.x, player.y + player.height);
            ctx.closePath();
            ctx.fill();
            
            // Ship details
            ctx.fillStyle = '#6ab8ff';
            ctx.fillRect(player.x + player.width/2 - 10, player.y + 10, 20, 20);
            
            // Engine glow
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.ellipse(player.x + player.width/2, player.y + player.height + 5, 10, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function drawEnemy(enemy) {
            // Draw enemy ship
            ctx.fillStyle = enemy.color;
            
            // Enemy ship body
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/2, enemy.y + enemy.height);
            ctx.lineTo(enemy.x + enemy.width, enemy.y);
            ctx.lineTo(enemy.x, enemy.y);
            ctx.closePath();
            ctx.fill();
            
            // Enemy details
            ctx.fillStyle = '#ff5555';
            ctx.fillRect(enemy.x + enemy.width/2 - 8, enemy.y + 15, 16, 10);
        }
        
        function drawBullet(bullet) {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.ellipse(bullet.x, bullet.y, 3, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function drawEnemyBullet(bullet) {
            ctx.fillStyle = '#ff5555';
            ctx.beginPath();
            ctx.ellipse(bullet.x, bullet.y, 3, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
function drawPowerUp(powerUp) {
            ctx.fillStyle = powerUp.color;
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw power-up symbol
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.type === 'speed' ? '⚡' : '❤️', powerUp.x, powerUp.y);
        }
        
        function drawParticle(particle) {
            ctx.globalAlpha = particle.life / 100;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        function drawStars() {
            // Draw some static stars in the background
            for (let i = 0; i < 100; i++) {
                const x = (i * 7.9) % canvas.width;
                const y = (i * 5.3) % canvas.height;
                const size = (i % 3) * 0.5 + 0.5;
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        function drawHUD() {
            // Draw HUD background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(10, 10, 150, 80);
            
            // Draw HUD text
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${game.score}`, 20, 35);
            ctx.fillText(`Lives: ${game.lives}`, 20, 60);
            ctx.fillText(`Level: ${game.level}`, 20, 85);
            
            // Draw pause indicator if game is paused
            if (game.paused) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
            }
        }
        
        function drawResetScreen() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME RESET', canvas.width/2, canvas.height/2 - 30);
            
            ctx.font = '20px Arial';
            ctx.fillText('Press "Start Game" to play', canvas.width/2, canvas.height/2 + 20);
        }
        
        function spawnEnemies() {
            game.enemies = [];
            for (let i = 0; i < 5 + game.level; i++) {
                spawnEnemy();
            }
        }
        
        function spawnEnemy() {
            const enemy = {
                x: Math.random() * (canvas.width - 40),
                y: Math.random() * -200 - 50,
                width: 40,
                height: 40,
                speed: 1 + game.level * 0.2,
                color: '#ff5555'
            };
            
            game.enemies.push(enemy);
        }
        
        function shootBullet() {
            game.bullets.push({
                x: player.x + player.width/2,
                y: player.y,
                width: 6,
                height: 16,
                speed: 10
            });
        }
        
        function shootEnemyBullet(enemy) {
            game.enemyBullets.push({
                x: enemy.x + enemy.width/2,
                y: enemy.y + enemy.height,
                width: 6,
                height: 16,
                speed: 5
            });
        }
        
        function createPowerUp(x, y) {
            const types = ['speed', 'life'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            game.powerUps.push({
                x: x,
                y: y,
                radius: 10,
                speed: 2,
                type: type,
                color: type === 'speed' ? '#ffff00' : '#ff00ff'
            });
        }
        
        function applyPowerUp(type) {
            if (type === 'speed') {
                player.shotDelay = Math.max(100, player.shotDelay - 50);
                // Visual feedback
                createPowerUpEffect(player.x + player.width/2, player.y, '⚡');
            } else if (type === 'life') {
                game.lives++;
                livesElement.textContent = game.lives;
                // Visual feedback
                createPowerUpEffect(player.x + player.width/2, player.y, '❤️');
            }
        }
        
        function createPowerUpEffect(x, y, symbol) {
            for (let i = 0; i < 20; i++) {
                game.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    size: Math.random() * 3 + 2,
                    color: symbol === '⚡' ? '#ffff00' : '#ff00ff',
                    life: 50
                });
            }
        }
        
        function createExplosion(x, y) {
            for (let i = 0; i < 15; i++) {
                game.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    size: Math.random() * 4 + 2,
                    color: '#ffaa00',
                    life: 30
                });
            }
        }
        
        function levelUp() {
            game.level++;
            levelElement.textContent = game.level;
            
            // Increase player speed slightly
            player.speed = Math.min(8, player.speed + 0.5);
            
            // Visual feedback for level up
            for (let i = 0; i < 30; i++) {
                game.particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 5 + 2,
                    color: '#00ffff',
                    life: 60
                });
            }
        }
        
        function gameOver() {
            game.running = false;
            
            finalScoreElement.textContent = game.score;
            finalLevelElement.textContent = game.level;
            
            gameOverScreen.style.display = 'block';
        }
        
        function checkCollision(obj1, obj2) {
            return obj1.x < obj2.x + obj2.width &&
                   obj1.x + obj1.width > obj2.x &&
                   obj1.y < obj2.y + obj2.height &&
                   obj1.y + obj1.height > obj2.y;
        }
        
        // Initial draw
        drawResetScreen();
        
        // Jekyll integration simulation
        console.log("Space Shooter Game loaded successfully.");
        console.log("This game can be integrated into a Jekyll site by:");
        console.log("1. Adding this HTML to a _includes/space-shooter-game.html file");
        console.log("2. Creating a layout that includes the game");
        console.log("3. Adding a page with front matter pointing to that layout");
