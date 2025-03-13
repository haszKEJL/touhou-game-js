import { CONFIG } from './config.js';
import { AUDIO } from './assets.js';
import { Player } from './entities.js';
import { EntityFactory } from './entities.js';
import { FormationManager } from './formation.js';

// Główna klasa logiki gry
export class GameLogic {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Inicjalizacja gracza
        this.player = new Player(canvas);
        
        // Inicjalizacja fabryki obiektów
        this.entityFactory = new EntityFactory(canvas);
        
        // Inicjalizacja menedżera formacji
        this.formationManager = new FormationManager(canvas, this.entityFactory);
        
        // Listy obiektów w grze
        this.enemies = [];
        this.enemyBullets = [];
        
        // Stan gry
        this.score = 0;
        this.lives = CONFIG.player.startLives;
        this.gameStarted = false;
        this.gameOver = false;
        this.gameWon = false;
        this.gameTimer = 0;
        this.stageNameVisible = false;
        this.stageNameTimer = 0;
        this.enemiesEnabled = false;
        this.musicVolume = CONFIG.audio.defaultVolume;
        
        // Boss
        this.bossTimer = 0;
        this.bossActive = false;
    }
    
    // Resetowanie stanu gry
    reset() {
        this.score = 0;
        this.lives = CONFIG.player.startLives;
        this.gameOver = false;
        this.gameWon = false;
        this.gameStarted = true;
        this.gameTimer = 0;
        this.stageNameVisible = true;
        this.stageNameTimer = 0;
        this.enemiesEnabled = false;
        
        // Reset list obiektów
        this.enemies = [];
        this.enemyBullets = [];
        
        // Reset gracza
        this.player.reset();
        
        // Reset bossa
        this.bossTimer = 0;
        this.bossActive = false;
        
        // Reset formacji i ustaw referencję do tablicy przeciwników
        this.formationManager.reset();
        this.formationManager.setEnemiesReference(this.enemies);
        
        // Odtworzenie muzyki
        if (AUDIO.bgMusic) {
            AUDIO.bgMusic.currentTime = 0;
            AUDIO.bgMusic.volume = this.musicVolume;
            AUDIO.bgMusic.play().catch(error => {
                console.log("Autoplay prevented:", error);
            });
        }
    }
    
    // Aktualizacja stanu gry
    update(keys) {
        if (!this.gameStarted) {
            // Ekran startowy - tylko aktualizacja głośności
            this.updateVolume(keys);
            return;
        }
        
        // Aktualizuj licznik czasu gry
        this.updateGameTimer();
        
        // Aktualizuj głośność muzyki
        this.updateVolume(keys);
        
        if (this.gameOver || this.gameWon) {
            return; // Zatrzymaj aktualizację, gdy gra jest zakończona
        }
        
        // Aktualizuj gracza
        this.player.update(keys);
        
        // Aktualizuj przeciwników i pociski tylko jeśli przeciwnicy są włączeni
        if (this.enemiesEnabled) {
            this.updateEnemies();
            this.updateEnemyBullets();
            
            // Sprawdź kolizje
            this.checkCollisions();
            
            // Aktualizuj formacje jeśli boss nie jest aktywny
            if (!this.bossActive) {
                // Aktualizuj referencję do tablicy wrogów i formacje
                this.formationManager.setEnemiesReference(this.enemies);
                this.formationManager.update(this.enemies);
                
                // Losowe dodawanie pojedynczych przeciwników
                if (!this.formationManager.formationActive && Math.random() < 0.005 && this.enemies.length < 3) {
                    this.enemies.push(this.entityFactory.createEnemy());
                }
                
                // Aktualizuj timer bossa
                this.bossTimer++;
                if (this.bossTimer >= CONFIG.boss.appearTime) {
                    this.spawnBoss();
                }
            }
        }
    }
    
    // Aktualizacja licznika czasu gry
    updateGameTimer() {
        if (this.gameStarted && !this.gameOver && !this.gameWon) {
            this.gameTimer++;
            
            // Obsługa czasu wyświetlania nazwy etapu
            if (this.stageNameVisible) {
                this.stageNameTimer++;
                
                // Nazwa etapu znika po 3 sekundach (180 klatek przy 60fps)
                if (this.stageNameTimer >= 180) {
                    this.stageNameVisible = false;
                    this.stageNameTimer = 0;
                }
            }
            
            // Włączenie przeciwników po wyświetleniu nazwy etapu i dodatkowe 2 sekundy
            if (!this.enemiesEnabled && !this.stageNameVisible && this.gameTimer >= 300) {
                this.enemiesEnabled = true;
            }
        }
    }
    
    // Aktualizacja głośności muzyki
    updateVolume(keys) {
        const volumeChange = 0.01;
        
        // Zmniejsz głośność (klawisz Q)
        if (keys.q) {
            this.musicVolume = Math.max(0, this.musicVolume - volumeChange);
            if (AUDIO.bgMusic) AUDIO.bgMusic.volume = this.musicVolume;
        }
        
        // Zwiększ głośność (klawisz W)
        if (keys.w) {
            this.musicVolume = Math.min(1.0, this.musicVolume + volumeChange);
            if (AUDIO.bgMusic) AUDIO.bgMusic.volume = this.musicVolume;
        }
    }
    
    // Aktualizacja przeciwników
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Aktualizacja pozycji przeciwnika
            if (enemy.isBoss) {
                // Boss ma swoją własną logikę aktualizacji
                enemy.update();
            } else {
                // Aktualizacja zwykłych przeciwników
                this.updateEnemyMovement(enemy);
            }
            
            // Strzelanie przeciwnika
            if (enemy.readyToShoot()) {
                this.enemyShoot(enemy);
                enemy.resetShootCooldown();
            }
            
            // Usuwanie przeciwników, którzy wyszli poza ekran
            if (enemy.isOffscreen()) {
                this.enemies.splice(i, 1);
                
                // Aktualizacja licznika przeciwników w formacji, jeśli należał do formacji
                if (enemy.formationIndex !== undefined && enemy.formationIndex >= 0) {
                    this.formationManager.formationEnemiesLeft--;
                }
            }
        }
    }
    
    // Aktualizacja pozycji przeciwnika w zależności od wzorca ruchu
    updateEnemyMovement(enemy) {
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
    
    // Obsługa strzelania przeciwników
    enemyShoot(enemy) {
        let bullets;
        
        if (enemy.isBoss) {
            // Boss ma swoją własną logikę strzelania
            bullets = this.entityFactory.createBossBullets(enemy, this.player);
        } else {
            // Strzelanie zwykłych przeciwników
            const pattern = enemy.special ? 'spread' : (Math.random() < 0.3 ? 'aimed' : 'down');
            bullets = this.entityFactory.createEnemyBullet(enemy, this.player, pattern);
        }
        
        // Dodaj pociski do listy pocisków
        this.enemyBullets = [...this.enemyBullets, ...bullets];
    }
    
       // Aktualizacja pocisków przeciwników
       updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            // Aktualizuj pozycję pocisku
            bullet.update();
            
            // Usuń pociski poza ekranem
            if (bullet.isOffscreen(this.canvas)) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    // Sprawdzanie kolizji
    checkCollisions() {
        // Kolizje pocisków gracza z wrogami
        for (let i = this.player.bullets.length - 1; i >= 0; i--) {
            const bullet = this.player.bullets[i];
            let bulletHit = false;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (
                    bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y
                ) {
                    // Trafienie przeciwnika
                    enemy.health--;
                    bulletHit = true;
                    
                    // Przyznaj punkty za trafienie
                    this.score += enemy.special ? 100 : 50;
                    
                    // Sprawdź, czy przeciwnik został zniszczony
                    if (enemy.health <= 0) {
                        // Przyznaj punkty za zniszczenie
                        this.score += enemy.special ? 500 : 200;
                        
                        // Dla formacji zmniejszamy licznik pozostałych przeciwników
                        if (enemy.formationIndex !== undefined && enemy.formationIndex >= 0) {
                            this.formationManager.formationEnemiesLeft--;
                        }
                        
                        // Jeśli zniszczono bossa, pokazujemy ekran zwycięstwa
                        if (enemy.isBoss) {
                            this.handleBossDefeated();
                        }
                        
                        // Usuń przeciwnika
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
            
            if (bulletHit) {
                this.player.bullets.splice(i, 1);
            }
        }
        
        // Jeśli gracz jest nieśmiertelny, nie sprawdzamy kolizji z nim
        if (this.player.invincible) return;
        
        // Kolizje gracza z pociskami przeciwników
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            const dx = bullet.x - playerCenterX;
            const dy = bullet.y - playerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const collisionRadius = bullet.radius + Math.min(this.player.width, this.player.height) / 3;
            
            if (distance < collisionRadius) {
                this.loseLife();
                this.enemyBullets.splice(i, 1);
                break;
            }
        }
        
        // Kolizje gracza z przeciwnikami
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (
                this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y
            ) {
                this.loseLife();
                
                // Usuń przeciwnika przy kolizji, chyba że to boss
                if (!enemy.isBoss) {
                    this.score += enemy.special ? 100 : 50;
                    this.enemies.splice(i, 1);
                }
                
                break;
            }
        }
    }
    
    // Utrata życia
    loseLife() {
        this.lives--;
        
        if (this.lives <= 0) {
            this.gameOver = true;
            
            // Zatrzymaj muzykę
            if (AUDIO.bgMusic) {
                AUDIO.bgMusic.pause();
                AUDIO.bgMusic.currentTime = 0;
            }
        } else {
            // Ustaw gracza jako nieśmiertelnego na krótki czas
            this.player.invincible = true;
            this.player.invincibleTimer = 0;
            
            // Wyczyść pociski przeciwników (daj graczowi szansę)
            this.enemyBullets = [];
        }
    }
    
    // Obsługa pojawienia się bossa
    spawnBoss() {
        console.log("Boss time!");
        this.bossActive = true;
        
        // Usuń wszystkich normalnych przeciwników
        this.enemies = this.enemies.filter(enemy => enemy.isBoss);
        
        // Usuń wszystkie pociski przeciwników
        this.enemyBullets = [];
        
        // Stwórz bossa
        const boss = this.entityFactory.createBoss();
        this.enemies.push(boss);
        
        // Wyświetl informację o bossie
        this.showBossName();
    }
    
    // Wyświetla nazwę bossa
    showBossName() {
        this.stageNameVisible = true;
        this.stageNameTimer = 0;
    }
    
    // Obsługa pokonania bossa
    handleBossDefeated() {
        // Dodaj duży bonus punktowy za pokonanie bossa
        this.score += 10000;
        
        // Ustaw flagę zwycięstwa i wyświetl ekran zwycięstwa
        this.gameWon = true;
        
        // Zatrzymaj muzykę
        if (AUDIO.bgMusic) {
            AUDIO.bgMusic.pause();
            AUDIO.bgMusic.currentTime = 0;
        }
    }
}