// Funkcje zarządzania grą
function startGame() {
    gameStarted = true;
    gameTimer = 0;
    enemiesEnabled = false;
    stageNameVisible = true;
    stageNameTimer = 0;
    lives = 3;
    
    // Zrestartuj i odtwórz muzykę
    bgMusic.currentTime = 0;
    bgMusic.volume = musicVolume;
    bgMusic.play().catch(error => {
        console.log("Autoplay prevented:", error);
    });
}

function resetGame() {
    // Resetowanie stanu gry
    score = 0;
    gameOver = false;
    gameStarted = true;
    gameTimer = 0;
    enemiesEnabled = false;
    stageNameVisible = true;
    stageNameTimer = 0;
    lives = 3;
    
    // Czyszczenie tablicy przeciwników i pocisków
    enemies.length = 0;
    enemyBullets.length = 0;
    player.bullets.length = 0;
    
    // Resetowanie pozycji gracza
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    player.invincible = false;
    player.invincibleTimer = 0;
    
    // Zrestartuj i wznów muzykę
    bgMusic.currentTime = 0;
    bgMusic.volume = musicVolume;
    bgMusic.play().catch(error => {
        console.log("Autoplay prevented:", error);
    });
}

// Funkcja obsługująca utratę życia
function loseLife() {
    lives--;
    
    if (lives <= 0) {
        gameOver = true;
    } else {
        // Ustaw gracza jako nieśmiertelnego na krótki czas
        player.invincible = true;
        player.invincibleTimer = 0;
        
        // Wyczyść pociski przeciwników (daj graczowi szansę)
        enemyBullets.length = 0;
    }
}

// Funkcje aktualizacji
function updateGameTimer() {
    if (gameStarted && !gameOver) {
        gameTimer++;
        
        // Obsługa czasu wyświetlania nazwy etapu
        if (stageNameVisible) {
            stageNameTimer++;
            
            // Nazwa etapu znika po 3 sekundach (180 klatek przy 60fps)
            if (stageNameTimer >= 180) {
                stageNameVisible = false;
                stageNameTimer = 0;
            }
        }
        
        // Włączenie przeciwników po wyświetleniu nazwy etapu i dodatkowe 2 sekundy
        if (!enemiesEnabled && !stageNameVisible && gameTimer >= 300) {
            enemiesEnabled = true;
        }
        
        // Obsługa nieśmiertelności gracza po utracie życia
        if (player.invincible) {
            player.invincibleTimer++;
            if (player.invincibleTimer >= player.maxInvincibleTime) {
                player.invincible = false;
                player.invincibleTimer = 0;
            }
        }
    }
}

function updateVolume() {
    // Zmniejsz głośność (klawisz Q)
    if (keys.q) {
        musicVolume = Math.max(0, musicVolume - 0.01);
        bgMusic.volume = musicVolume;
        keys.q = false; // Reset stanu klawisza, aby zmiana nie była zbyt szybka
    }
    
    // Zwiększ głośność (klawisz W)
    if (keys.w) {
        musicVolume = Math.min(1.0, musicVolume + 0.01);
        bgMusic.volume = musicVolume;
        keys.w = false; // Reset stanu klawisza, aby zmiana nie była zbyt szybka
    }
}

function updatePlayer() {
    // Aktualizacja stanu trybu skupienia
    player.focusing = keys.Shift;
    
    // Ustal prędkość zależną od trybu skupienia
    const currentSpeed = player.focusing ? player.focusSpeed : player.speed;
    
    // Ruch gracza
    if (keys.ArrowLeft && player.x > 0) player.x -= currentSpeed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += currentSpeed;
    if (keys.ArrowUp && player.y > 0) player.y -= currentSpeed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += currentSpeed;
    
    // Strzelanie
    if (keys.z && player.shootCooldown === 0) {
        createPlayerBullet();
        player.shootCooldown = player.maxShootCooldown;
    }
    
    if (player.shootCooldown > 0) {
        player.shootCooldown--;
    }
    
    // Aktualizacja pocisków gracza
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.y -= bullet.speed;
        
        // Usunięcie pocisku, gdy opuści ekran
        if (bullet.y + bullet.height < 0) {
            player.bullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    // Dodawanie nowych przeciwników tylko jeśli nie jest wyświetlana nazwa etapu
    if (enemiesEnabled && !stageNameVisible && Math.random() < 0.0033) {
        createEnemy();
    }
    
    // Aktualizacja przeciwników
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // Strzelanie przeciwnika
        if (enemy.shootCooldown <= 0) {
            createEnemyBullet(enemy);
            enemy.shootCooldown = 100 + Math.floor(Math.random() * 50);
        } else {
            enemy.shootCooldown--;
        }
        
        // Usunięcie przeciwnika, gdy opuści ekran
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
    
    // Aktualizacja pocisków przeciwników
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
        
        // Usunięcie pocisku, gdy opuści ekran
        if (bullet.y > canvas.height || bullet.y < 0 || bullet.x > canvas.width || bullet.x < 0) {
            enemyBullets.splice(i, 1);
        }
    }
}

// Kontynuacja funkcji checkCollisions()
function checkCollisions() {
    // Kolizje pocisków gracza z przeciwnikami
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Trafienie przeciwnika
                enemy.health--;
                player.bullets.splice(i, 1);
                
                if (enemy.health <= 0) {
                    // Przeciwnik zniszczony
                    enemies.splice(j, 1);
                    score += enemy.special ? 50 : 10; // Więcej punktów za specjalnego
                }
                break;
            }
        }
    }
    
    // Pomiń sprawdzanie kolizji z graczem, jeśli jest nieśmiertelny
    if (player.invincible) return;
    
    // Kolizje gracza z pociskami przeciwników
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        const dx = bullet.x - (player.x + player.width / 2);
        const dy = bullet.y - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < bullet.radius + Math.min(player.width, player.height) / 4) {
            // Trafienie gracza
            enemyBullets.splice(i, 1); // Usuń pocisk
            loseLife(); // Utrata życia zamiast natychmiastowego końca gry
            break;
        }
    }
    
    // Kolizje gracza z przeciwnikami
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // Kolizja z przeciwnikiem
            loseLife(); // Utrata życia zamiast natychmiastowego końca gry
            enemies.splice(i, 1); // Usuń przeciwnika przy kolizji
            break;
        }
    }
}