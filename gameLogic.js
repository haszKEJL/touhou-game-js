// Opis: Logika gry, obsługa gracza, przeciwników, kolizji, itp.
// Aktualizacja stanu gracza
function updatePlayer() {
    // Poruszanie gracza
    const currentSpeed = player.focusing ? player.focusSpeed : player.speed;
    
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= currentSpeed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += currentSpeed;
    }
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= currentSpeed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += currentSpeed;
    }
    
    // Strzelanie
    if (keys['z'] && player.shootCooldown <= 0) {
        // Stwórz nowy pocisk
        player.bullets.push({
            x: player.x + player.width / 2 - 2.5, // Centrowanie względem gracza
            y: player.y - 5,
            width: 5,
            height: 10,
            color: '#00ffcc'
        });
        
        player.shootCooldown = player.maxShootCooldown;
    }
    
    // Odświeżanie cooldownu strzału
    if (player.shootCooldown > 0) {
        player.shootCooldown--;
    }
    
    // Aktualizacja stanu skupienia (focus)
    player.focusing = keys['Shift'];
    
    // Aktualizacja pocisków gracza
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.y -= 8; // Prędkość pocisku
        
        // Usunięcie pocisków poza ekranem
        if (bullet.y + bullet.height < 0) {
            player.bullets.splice(i, 1);
        }
    }
}

// Aktualizacja czasu gry i powiązanych stanów
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
        
        // Aktualizacja odliczania do bossa
        if (enemiesEnabled && !bossActive) {
            bossTimer++;
            
            // Sprawdź, czy czas na bossa
            if (bossTimer >= bossAppearTime) {
                spawnBoss();
            }
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

// Aktualizacja stanu przeciwników, formacji i pocisków
function updateEnemies() {
    // Obsługa formacji
    if (enemiesEnabled && !stageNameVisible && !bossActive) {
        // Zarządzanie stanem formacji
        if (!formationActive) {
            formationCooldown--;
            if (formationCooldown <= 0) {
                selectRandomFormation();
                formationCooldown = 180; // Reset cooldown
            } else if (Math.random() < 0.005 && enemies.length < 3) {
                // Losowo dodajemy pojedynczych przeciwników między formacjami
                createRandomEnemy();
            }
        } else {
            // Sprawdź, czy formacja jest aktywna, ale wszyscy przeciwnicy zostali zniszczeni
            let formationComplete = true;
            for (const enemy of enemies) {
                if (enemy.formationIndex !== undefined) {
                    formationComplete = false;
                    break;
                }
            }
            
            if (formationComplete && formationEnemiesLeft <= 0) {
                formationActive = false;
                currentFormation = -1;
            }
        }
    }
    
    // Aktualizacja przeciwników
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Obsługa bossa
        if (enemy.isBoss) {
            updateBoss(enemy);
            continue;
        }
        
        // Aktualizacja pozycji w zależności od wzorca ruchu
        updateEnemyMovement(enemy);
        
        // Strzelanie przeciwnika
        if (enemy.shootCooldown <= 0) {
            createEnemyBullet(enemy);
            
            // Różne czasy odnowienia strzału w zależności od typu przeciwnika
            enemy.shootCooldown = enemy.maxShootCooldown;
        } else {
            enemy.shootCooldown--;
        }
        
        // Sprawdzenie, czy przeciwnik nie wyszedł poza ekran
        if (enemy.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
    
    // Aktualizacja pocisków przeciwników
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        // Aktualizuj pozycję pocisku
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        
        // Usuń pociski, które wyszły poza ekran
        if (bullet.y > canvas.height || bullet.y < 0 ||
            bullet.x > canvas.width || bullet.x < 0) {
            enemyBullets.splice(i, 1);
        }
    }
}

// Funkcja do aktualizacji pozycji przeciwnika w zależności od wzorca ruchu
function updateEnemyMovement(enemy) {
    switch (enemy.movementPattern) {
        case 'lineStop':
            // Przeciwnik porusza się w dół do określonej pozycji Y, a potem się zatrzymuje
            if (enemy.y < enemy.targetY) {
                enemy.y += enemy.speed;
            }
            break;
            
        case 'vWave':
            // Przeciwnik porusza się w dół i wykonuje delikatne ruchy falowe
            if (enemy.y < enemy.targetY) {
                enemy.y += enemy.speed;
            }
            
            // Ruch falisty, po osiągnięciu pozycji Y
            if (enemy.y >= enemy.targetY) {
                enemy.x = enemy.initialX + Math.sin(Date.now() * enemy.waveFrequency) * enemy.waveAmplitude;
            }
            break;
            
        case 'diamond':
            // Ruch diamentu - najpierw w dół, a po określonym czasie rozproszenie
            if (enemy.y < enemy.targetY) {
                enemy.y += enemy.speed;
            } else {
                if (enemy.disperseAfter > 0) {
                    enemy.disperseAfter--;
                } else {
                    // Ruch rozpraszający w zależności od indeksu w formacji
                    switch (enemy.formationIndex) {
                        case 0: // Środkowy - w dół
                            enemy.y += enemy.speed;
                            break;
                        case 1: // Lewy środek - w lewo
                            enemy.x -= enemy.speed;
                            break;
                        case 2: // Prawy środek - w prawo
                            enemy.x += enemy.speed;
                            break;
                        case 3: // Lewy dolny - w lewy dolny róg
                            enemy.x -= enemy.speed * 0.7;
                            enemy.y += enemy.speed * 0.7;
                            break;
                        case 4: // Prawy dolny - w prawy dolny róg
                            enemy.x += enemy.speed * 0.7;
                            enemy.y += enemy.speed * 0.7;
                            break;
                    }
                }
            }
            break;
            
        case 'sides':
            // Ruch grup po bokach - w dół, a potem do środka
            if (enemy.y < enemy.targetY) {
                enemy.y += enemy.speed;
            } else {
                // Powolny ruch w kierunku środka
                enemy.x += enemy.moveInwards * 0.3;
            }
            break;
            
        case 'arc':
            // Ruch po łuku - w dół, a potem strzela w gracza
            if (enemy.y < enemy.targetY) {
                enemy.y += enemy.speed;
            }
            break;
            
        case 'random':
        default:
            // Domyślny ruch przeciwnika - prosto w dół
            enemy.y += enemy.speed;
            break;
    }
}

// Funkcja aktualizująca bossa
function updateBoss(boss) {
    // Fazy ruchu bossa
    if (!boss.entryComplete) {
        // Faza wejścia - boss wjeżdża na ekran
        boss.y += boss.speed * 1.2;
        
        if (boss.y >= 50) {
            boss.entryComplete = true;
            boss.movePhase = 0;
            boss.moveTimer = 0;
        }
    } else {
        // Zachowanie bossa po wejściu
        boss.moveTimer++;
        
        switch(boss.movePhase) {
            case 0: // Faza 0 - ruch lewo-prawo
                boss.x += Math.sin(boss.moveTimer * 0.02) * 1.5;
                
                // Zmiana fazy po określonym czasie
                if (boss.moveTimer >= 300) { // 5 sekund
                    boss.movePhase = 1;
                    boss.moveTimer = 0;
                }
                break;
                
            case 1: // Faza 1 - ruch w dół i szybki ostrzał
                if (boss.y < 150) {
                    boss.y += boss.speed;
                } else {
                    boss.movePhase = 2;
                    boss.moveTimer = 0;
                }
                break;
                
            case 2: // Faza 2 - ruch okrężny
                const centerX = canvas.width / 2 - boss.width / 2;
                const centerY = 150;
                const radius = 100;
                
                boss.x = centerX + Math.cos(boss.moveTimer * 0.02) * radius;
                boss.y = centerY + Math.sin(boss.moveTimer * 0.02) * radius / 2;
                
                // Zmiana fazy po określonym czasie
                if (boss.moveTimer >= 360) { // 6 sekund
                    boss.movePhase = 0;
                    boss.moveTimer = 0;
                }
                break;
        }
        
        // Strzelanie bossa
        if (boss.shootCooldown <= 0) {
            bossShooting(boss);
            
            // Zmień wzór strzelania co kilka wystrzałów
            if (Math.random() < 0.2) {
                boss.shootPattern = (boss.shootPattern + 1) % 4;
            }
            
            boss.shootCooldown = boss.maxShootCooldown;
        } else {
            boss.shootCooldown--;
        }
    }
}

// Funkcja określająca wzory strzelania bossa
function bossShooting(boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;
    
    switch(boss.shootPattern) {
        case 0: // Wzór 0 - strzał rozpraszający w wielu kierunkach
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                enemyBullets.push({
                    x: centerX,
                    y: centerY,
                    radius: 5,
                    color: '#ff0000',
                    speedX: Math.cos(angle) * 2.5,
                    speedY: Math.sin(angle) * 2.5
                });
            }
            break;
            
        case 1: // Wzór 1 - strzał w stronę gracza
            if (player) {
                const dirX = (player.x + player.width/2) - centerX;
                const dirY = (player.y + player.height/2) - centerY;
                const length = Math.sqrt(dirX * dirX + dirY * dirY);
                
                // 3 pociski w kierunku gracza
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(dirY, dirX) + i * 0.2;
                    enemyBullets.push({
                        x: centerX,
                        y: centerY,
                        radius: 6,
                        color: '#ff5500',
                        speedX: Math.cos(angle) * 4,
                        speedY: Math.sin(angle) * 4
                    });
                }
            }
            break;
            
            case 2: // Wzór 2 - spiralny strzał
            const angleOffset = boss.moveTimer * 0.1;
            for (let i = 0; i < 3; i++) {
                const angle = angleOffset + i * (Math.PI * 2 / 3);
                enemyBullets.push({
                    x: centerX,
                    y: centerY,
                    radius: 5,
                    color: '#ffaa00',
                    speedX: Math.cos(angle) * 3,
                    speedY: Math.sin(angle) * 3
                });
            }
            break;
            
        case 3: // Wzór 3 - deszcz pocisków
            for (let i = 0; i < 5; i++) {
                enemyBullets.push({
                    x: boss.x + Math.random() * boss.width,
                    y: boss.y + boss.height,
                    radius: 4 + Math.random() * 2,
                    color: '#ff3366',
                    speedX: (Math.random() - 0.5) * 2,
                    speedY: 2 + Math.random() * 2
                });
            }
            break;
    }
}

// Funkcja do tworzenia pocisku przeciwnika
function createEnemyBullet(enemy) {
    // Podstawowe właściwości pocisku
    const bulletX = enemy.x + enemy.width / 2;
    const bulletY = enemy.y + enemy.height;
    const bulletRadius = enemy.special ? 6 : 4;
    
    // Różne strategie strzelania w zależności od wzorca ruchu formacji
    switch (enemy.movementPattern) {
        case 'lineStop':
            // Liniowa formacja - strzały w dół
            enemyBullets.push({
                x: bulletX,
                y: bulletY,
                radius: bulletRadius,
                color: enemy.special ? '#ffaa22' : '#ff5577',
                speedX: 0,
                speedY: 3
            });
            break;
            
        case 'vWave':
            // Formacja V - strzały skierowane w dół i na boki
            if (enemy.formationIndex === 0 || enemy.formationIndex === 4) {
                // Skrajne pozycje - strzał ukośny
                enemyBullets.push({
                    x: bulletX,
                    y: bulletY,
                    radius: bulletRadius,
                    color: enemy.special ? '#ffaa22' : '#ff5577',
                    speedX: enemy.formationIndex === 0 ? -1.5 : 1.5,
                    speedY: 2.5
                });
            } else if (enemy.formationIndex === 2) {
                // Środkowy - strzela w 3 kierunkach
                for (let angle = -0.3; angle <= 0.3; angle += 0.3) {
                    enemyBullets.push({
                        x: bulletX,
                        y: bulletY,
                        radius: bulletRadius + 1, // Większy pocisk
                        color: '#ffaa22',
                        speedX: Math.sin(angle) * 3,
                        speedY: Math.cos(angle) * 3
                    });
                }
            } else {
                // Pozostali - normalne strzały w dół
                enemyBullets.push({
                    x: bulletX,
                    y: bulletY,
                    radius: bulletRadius,
                    color: '#ff5577',
                    speedX: 0,
                    speedY: 3
                });
            }
            break;
            
        case 'diamond':
            if (enemy.disperseAfter <= 0) {
                // Po rozproszeniu - strzały w różnych kierunkach
                enemyBullets.push({
                    x: bulletX,
                    y: bulletY,
                    radius: bulletRadius,
                    color: enemy.special ? '#ffaa22' : '#ff5577',
                    speedX: (Math.random() - 0.5) * 2, // Losowy kierunek X
                    speedY: 2 + Math.random() // Różna prędkość Y
                });
            } else if (enemy.special) {
                // Specjalny przeciwnik - strzał w 5 kierunków
                for (let angle = -Math.PI/4; angle <= Math.PI/4; angle += Math.PI/8) {
                    enemyBullets.push({
                        x: bulletX,
                        y: bulletY,
                        radius: bulletRadius,
                        color: '#ffaa22',
                        speedX: Math.sin(angle) * 3,
                        speedY: Math.cos(angle) * 3
                    });
                }
            } else {
                // Zwykły przeciwnik - strzał w dół
                enemyBullets.push({
                    x: bulletX,
                    y: bulletY,
                    radius: bulletRadius,
                    color: '#ff5577',
                    speedX: 0,
                    speedY: 3
                });
            }
            break;
            
        case 'sides':
            // Strzelanie w kierunku środka ekranu
            const targetX = canvas.width / 2;
            const dirX = targetX - enemy.x;
            const length = Math.sqrt(dirX * dirX + enemy.targetY * enemy.targetY);
            
            enemyBullets.push({
                x: bulletX,
                y: bulletY,
                radius: bulletRadius,
                color: enemy.special ? '#ffaa22' : '#ff5577',
                speedX: (dirX / length) * 3,
                speedY: 3
            });
            break;
            
        case 'arc':
            // Strzelanie w kierunku gracza
            if (player) {
                const dirX = (player.x + player.width/2) - bulletX;
                const dirY = (player.y + player.height/2) - bulletY;
                const length = Math.sqrt(dirX * dirX + dirY * dirY);
                
                // Ograniczenie prędkości pocisku
                const speed = enemy.special ? 3.5 : 3;
                
                enemyBullets.push({
                    x: bulletX,
                    y: bulletY,
                    radius: bulletRadius,
                    color: enemy.special ? '#ffaa22' : '#ff5577',
                    speedX: (dirX / length) * speed,
                    speedY: (dirY / length) * speed
                });
            } else {
                // Jeśli nie można śledzić gracza, strzelaj w dół
                enemyBullets.push({
                    x: bulletX,
                    y: bulletY,
                    radius: bulletRadius,
                    color: enemy.special ? '#ffaa22' : '#ff5577',
                    speedX: 0,
                    speedY: 3
                });
            }
            break;
            
        case 'random':
        default:
            // Domyślny strzał - prosto w dół
            enemyBullets.push({
                x: bulletX,
                y: bulletY,
                radius: bulletRadius,
                color: enemy.special ? '#ffaa22' : '#ff5577',
                speedX: 0,
                speedY: 3
            });
            break;
    }
}

// Sprawdza kolizje między graczem, wrogami i pociskami
function checkCollisions() {
    // Sprawdzamy kolizje pocisków gracza z wrogami
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        let bulletHit = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            // Sprawdź, czy pocisk trafia przeciwnika
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Trafienie wroga
                enemy.health--;
                bulletHit = true;
                
                // Zwiększ wynik
                score += enemy.special ? 100 : 50;
                
                // Sprawdź, czy wróg został zniszczony
                if (enemy.health <= 0) {
                    // Zwiększ wynik za zniszczenie przeciwnika
                    score += enemy.special ? 500 : 200;
                    
                    // Dla formacji zmniejszamy licznik pozostałych przeciwników
                    if (enemy.formationIndex !== undefined) {
                        formationEnemiesLeft--;
                    }
                    
                    // Jeśli zniszczono bossa, przechodzimy do następnego etapu lub kończymy grę
                    if (enemy.isBoss) {
                        handleBossDefeated();
                    }
                    
                    // Usuń przeciwnika
                    enemies.splice(j, 1);
                }
                
                // Przerwij pętlę, jeśli pocisk trafił przeciwnika
                break;
            }
        }
        
        // Usuń pocisk, jeśli trafił wroga
        if (bulletHit) {
            player.bullets.splice(i, 1);
        }
    }
    
    // Sprawdzamy kolizje gracza z pociskami przeciwników
    if (!player.invincible) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            
            // Obliczamy odległość od środka pocisku do środka gracza
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const dx = bullet.x - playerCenterX;
            const dy = bullet.y - playerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Kolizja nastąpi, gdy odległość jest mniejsza niż suma promienia pocisku 
            // i połowy szerokości/wysokości gracza (przybliżenie)
            const collisionRadius = bullet.radius + Math.min(player.width, player.height) / 3;
            
            if (distance < collisionRadius) {
                // Trafienie gracza - odejmij życie i nadaj nieśmiertelność
                loseLife();
                
                // Usuń pocisk
                enemyBullets.splice(i, 1);
                
                // Przerwij pętlę, gracz może być trafiony tylko raz na raz
                break;
            }
        }
    }
    
    // Sprawdzamy kolizje gracza z przeciwnikami
    if (!player.invincible) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            // Sprawdź, czy gracz koliduje z przeciwnikiem
            if (
                player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y
            ) {
                // Kolizja z przeciwnikiem - odejmij życie
                loseLife();
                
                // Usuń przeciwnika, chyba że to boss
                if (!enemy.isBoss) {
                    // Zwiększ wynik za kolizję z przeciwnikiem (mniejsza nagroda)
                    score += enemy.special ? 100 : 50;
                    enemies.splice(i, 1);
                }
                
                // Przerwij pętlę, gracz może kolizjować tylko z jednym przeciwnikiem na raz
                break;
            }
        }
    }
}

// Obsługa utraty życia przez gracza
function loseLife() {
    if (!player.invincible) {
        lives--;
        
        // Sprawdź, czy to game over
        if (lives <= 0) {
            gameOver = true;
        } else {
            // Jeśli gracz ma jeszcze życia, nadaj mu chwilową nieśmiertelność
            player.invincible = true;
            player.invincibleTimer = 0;
        }
    }
}

// Funkcja do obsługi pokonania bossa
function handleBossDefeated() {
    // Dodaj duży bonus punktowy za pokonanie bossa
    score += 10000;
    
    // Można tu dodać przejście do następnego poziomu
    // lub wyświetlić ekran zwycięstwa
    
    // Na razie po prostu kończymy grę z wygraną
    // W przyszłości można tu dodać obsługę kolejnych poziomów
    
    // Tymczasowo - resetujemy stan gry i pokazujemy zwycięstwo
    showVictory();
}

// Funkcja pokazująca ekran zwycięstwa
function showVictory() {
    // Flaga zwycięstwa dla renderera
    gameWon = true;
    
    // Zatrzymaj muzykę
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

// Funkcja do rozpoczęcia nowej gry
function resetGame() {
    // Resetowanie podstawowych zmiennych gry
    score = 0;
    gameOver = false;
    gameWon = false;
    gameStarted = true;
    gameTimer = 0;
    enemiesEnabled = false;
    stageNameVisible = true;
    stageNameTimer = 0;
    lives = 3;
    
    // Reset bossa
    bossTimer = 0;
    bossActive = false;
    
    // Resetowanie formacji
    resetFormations();
    
    // Resetowanie gracza
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 30;
    player.bullets = [];
    player.invincible = true; // Krótka nieśmiertelność na start
    player.invincibleTimer = 0;
    player.focusing = false;
    player.shootCooldown = 0;
    
    
    // Włącz muzykę tła
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play();
    }
}

// Funkcja resetująca formacje podczas resetu gry
function resetFormations() {
    formationActive = false;
    currentFormation = -1;
    formationEnemiesLeft = 0;
    formationCooldown = 180;
}

// Funkcja aktualizująca głośność muzyki
function updateVolume() {
    // Zwiększanie/zmniejszanie głośności
    if (keys['q']) {
        musicVolume = Math.max(0, musicVolume - 0.01);
        if (bgMusic) bgMusic.volume = musicVolume;
    } else if (keys['w']) {
        musicVolume = Math.min(1, musicVolume + 0.01);
        if (bgMusic) bgMusic.volume = musicVolume;
    }
}

// Funkcja do spawnienia bossa
function spawnBoss() {
    console.log("Boss time!");
    bossActive = true;
    
    // Usuń wszystkich normalnych przeciwników
    enemies = enemies.filter(enemy => enemy.isBoss);
    
    // Usuń wszystkie pociski przeciwników
    enemyBullets = [];
    
    // Stwórz bossa
    const boss = {
        x: canvas.width / 2 - 75,
        y: -150, // Zaczyna poza ekranem
        width: 150,
        height: 150,
        speed: 0.5,
        color: '#ff0000',
        image: specialEnemyImage, // Tymczasowo używamy obrazka specjalnego przeciwnika
        health: 50, // Dużo zdrowia
        maxHealth: 50,
        shootCooldown: 60,
        maxShootCooldown: 60,
        shootPattern: 0, // Aktualny wzór strzelania
        special: true,
        isBoss: true,
        movePhase: 0, // Faza ruchu
        moveTimer: 0,  // Timer fazy ruchu
        entryComplete: false // Czy boss zakończył wejście na ekran
    };
    
    enemies.push(boss);
    
    // Wyświetl informację o bossie
    showBossName();
}

// Funkcja wyświetlająca nazwę bossa
function showBossName() {
    stageNameVisible = true;
    stageNameTimer = 0;
    
    // Zmień muzykę na muzykę bossa (jeśli jest zaimplementowana)
    // playBossMusic();
}

// Funkcja głównej pętli gry - integruje wszystkie aktualizacje
function gameLoop() {
    if (gameStarted) {
        // Aktualizacja głośności muzyki
        updateVolume();
        
        // Aktualizacja stanu gracza
        updatePlayer();
        
        // Aktualizacja licznika czasu gry
        updateGameTimer();
        
        // Aktualizacja przeciwników, jeśli są włączeni
        if (enemiesEnabled) {
            updateEnemies();
        }
        
        // Sprawdzenie kolizji
        checkCollisions();
    }
}

// Funkcja obsługi naciśnięcia klawisza
function handleKeyDown(event) {
    keys[event.key] = true;
    
    // Rozpoczęcie gry po naciśnięciu Enter
    if (event.key === 'Enter') {
        if (!gameStarted) {
            resetGame();
        } else if (gameOver || gameWon) {
            // Restart gry po game over lub wygranej
            resetGame();
        }
    }
    
    // Zapobiegaj domyślnemu zachowaniu klawiszy sterujących
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'z', 'Shift'].includes(event.key)) {
        event.preventDefault();
    }
}

// Funkcja obsługi zwolnienia klawisza
function handleKeyUp(event) {
    keys[event.key] = false;
}

// Funkcja inicjalizująca grę
function initGame() {
    // Ustawienie początkowych wartości
    score = 0;
    lives = 3;
    gameTimer = 0;
    gameStarted = false;
    gameOver = false;
    gameWon = false;
    enemiesEnabled = false;
    stageNameVisible = false;
    stageNameTimer = 0;
    
    // Inicjalizacja gracza
    player = {
        x: canvas.width / 2 - 15, // Wycentrowanie gracza
        y: canvas.height - 60,
        width: 30,
        height: 40,
        speed: 5,
        focusSpeed: 2, // Wolniejsza prędkość w trybie skupienia
        focusing: false, // Czy gracz jest w trybie skupienia
        color: '#3399ff',
        image: playerImage,
        bullets: [],
        shootCooldown: 0,
        maxShootCooldown: 8, // Możliwość strzelania co 8 klatek (przy 60fps)
        invincible: false,
        invincibleTimer: 0,
        maxInvincibleTime: 180 // 3 sekundy nieśmiertelności (przy 60fps)
    };
    
    // Inicjalizacja list przeciwników i pocisków
    enemies = [];
    enemyBullets = [];
    
    // Inicjalizacja systemu formacji
    formationActive = false;
    currentFormation = -1;
    formationEnemiesLeft = 0;
    formationCooldown = 180;
    
    // Inicjalizacja timera bossa
    bossTimer = 0;
    bossActive = false;
    
    // Inicjalizacja tła
    initBackgrounds();
    
    // Ustalenie głośności muzyki
    musicVolume = 0.5;
    if (bgMusic) {
        bgMusic.volume = musicVolume;
        bgMusic.loop = true;
    }
    
    // Dodanie nasłuchiwania klawiszy
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Konfiguracja obsługi klawiatury
    setupInputHandlers();
}

// Funkcja inicjalizująca warstwy tła
function initBackgrounds() {
    // Warstwy tła z różnymi prędkościami przewijania
    backgrounds = [
        {
            img: farBackgroundImage,
            x: 0,
            width: canvas.width,
            speed: 0.2 // Najwolniejsza warstwa (najdalej)
        },
        {
            img: midBackgroundImage,
            x: 0,
            width: canvas.width,
            speed: 0.5 // Średnia warstwa
        },
        {
            img: nearBackgroundImage,
            x: 0,
            width: canvas.width,
            speed: 1.0 // Najszybsza warstwa (najbliżej)
        }
    ];
}

// Obsługa klawiatury zintegrowana z gameLogic.js
function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        if (e.key in keys) {
            keys[e.key] = true;
            
            // Start gry po naciśnięciu Enter na ekranie startowym
            if (e.key === 'Enter' && !gameStarted && !gameOver) {
                resetGame();
            }
            
            // Restart gry po naciśnięciu Enter na ekranie Game Over
            if (e.key === 'Enter' && gameOver) {
                resetGame();
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key in keys) {
            keys[e.key] = false;
        }
    });
}

// Funkcja do tworzenia losowego przeciwnika
function createRandomEnemy() {
    const enemySize = 30;
    const x = Math.random() * (canvas.width - enemySize);
    const y = -enemySize;
    
    const enemy = {
        x: x,
        y: y,
        width: enemySize,
        height: enemySize,
        speed: 1 + Math.random(),
        color: '#ff5555',
        image: enemyImage,
        health: 1,
        shootCooldown: Math.floor(Math.random() * 60) + 30,
        maxShootCooldown: 60,
        special: Math.random() < 0.2, // 20% szans na specjalnego przeciwnika
        movementPattern: 'random'
    };
    
    // Specjalni przeciwnicy mają więcej zdrowia i inny obrazek
    if (enemy.special) {
        enemy.image = specialEnemyImage;
        enemy.health = 2;
    }
    
    enemies.push(enemy);
}

// Funkcja wybierająca losową formację przeciwników
function selectRandomFormation() {
    const formations = ['lineStop', 'vWave', 'diamond', 'sides', 'arc'];
    currentFormation = formations[Math.floor(Math.random() * formations.length)];
    
    // Ustawienie flagi aktywnej formacji
    formationActive = true;
    
    // Tworzenie wybranej formacji
    switch(currentFormation) {
        case 'lineStop':
            createLineFormation();
            break;
        case 'vWave':
            createVWaveFormation();
            break;
        case 'diamond':
            createDiamondFormation();
            break;
        case 'sides':
            createSidesFormation();
            break;
        case 'arc':
            createArcFormation();
            break;
    }
}

// Tworzenie liniowej formacji
function createLineFormation() {
    const enemySize = 30;
    const spacing = 10;
    const count = 5;
    const totalWidth = count * enemySize + (count - 1) * spacing;
    const startX = (canvas.width - totalWidth) / 2;
    
    formationEnemiesLeft = count;
    
    for (let i = 0; i < count; i++) {
        const x = startX + i * (enemySize + spacing);
        const y = -enemySize;
        
        const enemy = {
            x: x,
            y: y,
            width: enemySize,
            height: enemySize,
            speed: 1.5,
            color: '#ff5555',
            image: enemyImage,
            health: 1,
            shootCooldown: 60 + i * 10,
            maxShootCooldown: 60,
            special: i === Math.floor(count / 2), // Środkowy jest specjalny
            movementPattern: 'lineStop',
            formationIndex: i,
            targetY: 100 // Pozycja docelowa Y
        };
        
        // Specjalni przeciwnicy mają więcej zdrowia i inny obrazek
        if (enemy.special) {
            enemy.image = specialEnemyImage;
            enemy.health = 2;
        }
        
        enemies.push(enemy);
    }
}

// Tworzenie formacji V
function createVWaveFormation() {
    const enemySize = 30;
    const count = 5;
    
    formationEnemiesLeft = count;
    
    for (let i = 0; i < count; i++) {
        // Pozycja X - układ V
        const x = canvas.width / 2 + (i - Math.floor(count / 2)) * (enemySize + 15);
        const y = -enemySize - i * 20; // Opóźnienie w wejściu
        
        const enemy = {
            x: x,
            y: y,
            initialX: x, // Pierwotna pozycja X, która jest potrzebna do ruchu falowego
            width: enemySize,
            height: enemySize,
            speed: 1.5,
            color: '#ff5555',
            image: enemyImage,
            health: 1,
            shootCooldown: 60 + i * 10,
            maxShootCooldown: 60,
            special: i === Math.floor(count / 2), // Środkowy jest specjalny
            movementPattern: 'vWave',
            formationIndex: i,
            targetY: 80 + Math.abs(i - Math.floor(count / 2)) * 20, // Układają się w kształt V
            waveFrequency: 0.001 + i * 0.0002, // Częstotliwość ruchu falowego
            waveAmplitude: 20 // Amplituda ruchu falowego
        };
        
        // Specjalni przeciwnicy mają więcej zdrowia i inny obrazek
        if (enemy.special) {
            enemy.image = specialEnemyImage;
            enemy.health = 2;
        }
        
        enemies.push(enemy);
    }
}

// Tworzenie formacji diamantu
function createDiamondFormation() {
    const enemySize = 30;
    const positions = [
        { x: 0, y: 0 },     // Środek
        { x: -1, y: 0 },    // Lewy środek
        { x: 1, y: 0 },     // Prawy środek
        { x: -0.5, y: 1 },  // Lewy dolny
        { x: 0.5, y: 1 }    // Prawy dolny
    ];
    
    formationEnemiesLeft = positions.length;
    
    for (let i = 0; i < positions.length; i++) {
        const x = canvas.width / 2 + positions[i].x * (enemySize + 20);
        const y = -enemySize - positions[i].y * 50;
        
        const enemy = {
            x: x,
            y: y,
            width: enemySize,
            height: enemySize,
            speed: 1.5,
            color: '#ff5555',
            image: enemyImage,
            health: 1,
            shootCooldown: 60 + i * 10,
            maxShootCooldown: 60,
            special: i === 0, // Środkowy jest specjalny
            movementPattern: 'diamond',
            formationIndex: i,
            targetY: 100 + positions[i].y * 30,
            disperseAfter: 180 // Czas po osiągnięciu pozycji Y, po którym następuje rozproszenie (3 sekundy przy 60fps)
        };
        
        // Specjalni przeciwnicy mają więcej zdrowia i inny obrazek
        if (enemy.special) {
            enemy.image = specialEnemyImage;
            enemy.health = 2;
        }
        
        enemies.push(enemy);
    }
}

// Tworzenie formacji bocznej
function createSidesFormation() {
    const enemySize = 30;
    const count = 6; // 3 po każdej stronie
    
    formationEnemiesLeft = count;
    
    for (let i = 0; i < count; i++) {
        // Pozycja X - lewa lub prawa strona
        const side = i < count / 2 ? 0 : 1; // 0 - lewa strona, 1 - prawa strona
        const offset = i % (count / 2);
        
        const x = side * (canvas.width - enemySize) - side * offset * 40 + (1 - side) * offset * 40;
        const y = -enemySize - offset * 30;
        
        const enemy = {
            x: x,
            y: y,
            width: enemySize,
            height: enemySize,
            speed: 1.5,
            color: '#ff5555',
            image: enemyImage,
            health: 1,
            shootCooldown: 60 + i * 10,
            maxShootCooldown: 60,
            special: i === 0 || i === count / 2, // Pierwszy na każdej stronie jest specjalny
            movementPattern: 'sides',
            formationIndex: i,
            targetY: 80 + offset * 20,
            moveInwards: side === 0 ? 1 : -1 // Kierunek ruchu do środka: 1 dla lewej, -1 dla prawej
        };
        
        // Specjalni przeciwnicy mają więcej zdrowia i inny obrazek
        if (enemy.special) {
            enemy.image = specialEnemyImage;
            enemy.health = 2;
        }
        
        enemies.push(enemy);
    }
}

// Tworzenie formacji łuku
function createArcFormation() {
    const enemySize = 30;
    const count = 5;
    
    formationEnemiesLeft = count;
    
    for (let i = 0; i < count; i++) {
        // Pozycja w łuku
        const angle = Math.PI * (0.25 + 0.5 * (i / (count - 1))); // Od PI/4 do PI*3/4
        const radius = 150;
        const x = canvas.width / 2 + Math.cos(angle) * radius - enemySize / 2;
        const y = -enemySize - i * 20;
        
        const enemy = {
            x: x,
            y: y,
            width: enemySize,
            height: enemySize,
            speed: 1.5,
            color: '#ff5555',
            image: enemyImage,
            health: 1,
            shootCooldown: 60 + i * 10,
            maxShootCooldown: 60,
            special: i === Math.floor(count / 2), // Środkowy jest specjalny
            movementPattern: 'arc',
            formationIndex: i,
            targetY: 80 // Wszystkie na tej samej wysokości
        };
        
        // Specjalni przeciwnicy mają więcej zdrowia i inny obrazek
        if (enemy.special) {
            enemy.image = specialEnemyImage;
            enemy.health = 2;
        }
        
        enemies.push(enemy);
    }
}

// Funkcja startGame - alias dla resetGame
function startGame() {
    resetGame();
}

// Eksportowanie funkcji do globalnego zakresu
window.gameLoop = gameLoop;
window.initGame = initGame;
window.resetGame = resetGame;
window.keys = keys; 
window.setupInputHandlers = setupInputHandlers;
window.startGame = startGame;