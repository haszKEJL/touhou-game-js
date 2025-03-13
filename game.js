// Konfiguracja gry
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Zmienne gry
let score = 0;
let gameOver = false;
let gameStarted = false;
let gameTimer = 0;
let enemiesEnabled = false;
let musicVolume = 0.05; // Domyślna głośność (5%)
let stageNameVisible = false;
let stageNameTimer = 0;
let lives = 3; // Liczba żyć gracza

// Ładowanie obrazka serduszka (życia)
const heartImage = new Image();
heartImage.src = 'heart.png'; // Dodaj obrazek serduszka

// Ładowanie obrazków tła (kilka warstw)
const backgroundFar = new Image();
backgroundFar.src = 'background-far.jpg'; // Dalekie góry (najwolniejsze)

// Zmienne do przewijania tła
const backgrounds = [
    { img: backgroundFar, x: 0, speed: 0.2, width: 1200 },
];

// Ładowanie obrazu postaci
const playerImage = new Image();
playerImage.src = 'player.png'; // Zmień nazwę na nazwę twojego pliku

const enemyImage = new Image();
enemyImage.src = 'enemie.png'; // Obrazek zwykłego przeciwnika

const specialEnemyImage = new Image();
specialEnemyImage.src = 'mid-boss.png'; // Obrazek specjalnego przeciwnika

// Ładowanie muzyki w tle
const bgMusic = new Audio('music_stage1.mp3'); // Zmień nazwę na nazwę twojego pliku muzyki
bgMusic.loop = true;
bgMusic.volume = musicVolume; // Głośność od 0.0 do 1.0

// Ładowanie obrazka tła
const backgroundImage = new Image();
backgroundImage.src = 'background-far.jpg'; // Zmień na nazwę swojego obrazka

// Zmienne do przewijania tła
const background = {
    x: 0,
    y: 0,
    width: 1200, // Szerokość obrazka tła - dostosuj do swojego obrazka
    height: canvas.height,
    speed: 0.5 // Szybkość przewijania tła
};

// Gracz
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30, // Dostosuj zgodnie z rozmiarem obrazka
    height: 40, // Dostosuj zgodnie z rozmiarem obrazka
    speed: 5, // Normalna prędkość
    focusSpeed: 2, // Prędkość w trybie skupienia
    color: '#33ccff',
    bullets: [],
    shooting: false,
    shootCooldown: 0,
    maxShootCooldown: 10,
    image: playerImage,
    focusing: false, // Stan trybu skupienia
    invincible: false,
    invincibleTimer: 0,
    maxInvincibleTime: 120 // 2 sekundy nieśmiertelności po utracie życia (przy 60fps)
};

// Przeciwnicy
const enemies = [];
const enemyBullets = [];

// Flagi kontroli klawiatury
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    z: false, // Klawisz strzału
    Enter: false, // Klawisz startu gry
    Shift: false, // Klawisz trybu skupienia
    // Dodajemy klawisze do kontroli głośności
    q: false, // Zmniejsz głośność
    w: false  // Zwiększ głośność
};

// Obsługa klawiatury
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        
        // Start gry po naciśnięciu Enter na ekranie startowym
        if (e.key === 'Enter' && !gameStarted && !gameOver) {
            startGame();
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

// Funkcje tworzenia obiektów
function createEnemy() {
    // Określamy typ przeciwnika - specjalny pojawia się rzadziej (15% szansy)
    const isSpecial = Math.random() < 0.15;
    
    const enemy = {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: isSpecial ? 40 : 30, // Specjalny przeciwnik jest nieco większy
        height: isSpecial ? 40 : 30,
        speed: 0.5 + Math.random() * (isSpecial ? 0.7 : 1), // Specjalny jest nieco wolniejszy
        color: isSpecial ? '#ff6600' : '#ff3366', // Inny kolor dla specjalnego
        shootCooldown: Math.floor(Math.random() * 100),
        maxShootCooldown: isSpecial ? 150 : 100, // Specjalny strzela rzadziej
        special: isSpecial, // Flaga określająca typ przeciwnika
        image: isSpecial ? specialEnemyImage : enemyImage, // Obrazek zależny od typu
        health: isSpecial ? 3 : 1 // Specjalni przeciwnicy mają więcej zdrowia
    };
    enemies.push(enemy);
}

function createEnemyBullet(enemy) {
    // Oblicz kierunek do gracza
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (enemy.special) {
        // Specjalny przeciwnik strzela 3 pociskami
        for (let i = -1; i <= 1; i++) {
            // Kąt 30 stopni to około 0.52 radiana
            const bulletAngle = angle + i * 0.52; // +/- 30 stopni
            
            const bullet = {
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height,
                radius: 5, // Nieco większy pocisk
                speed: 2.5,
                color: '#ffaa00', // Inny kolor dla pocisków specjalnego przeciwnika
                velocityX: Math.cos(bulletAngle) * 2.5,
                velocityY: Math.sin(bulletAngle) * 2.5,
                fromSpecial: true // Oznaczamy pociski specjalnego przeciwnika
            };
            enemyBullets.push(bullet);
        }
    } else {
        // Standardowy przeciwnik - pojedynczy pocisk
        const bullet = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            radius: 4,
            speed: 2,
            color: '#ffff00',
            velocityX: dx / distance * 2,
            velocityY: dy / distance * 2,
            fromSpecial: false
        };
        enemyBullets.push(bullet);
    }
}

function createPlayerBullet() {
    const bullet = {
        x: player.x + player.width / 2 - 2, // Wyśrodkowanie pocisku względem gracza
        y: player.y,
        width: 4,
        height: 10,
        speed: 7,
        color: '#00ffcc'
    };
    player.bullets.push(bullet);
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

// Sprawdzanie kolizji
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

// Rysowanie
function drawStartScreen() {
    // Nakładka na tło dla lepszej czytelności tekstu
    ctx.fillStyle = 'rgba(0, 17, 51, 0.7)'; // Półprzezroczysty ciemnoniebieski
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TOUHOU-LIKE GAME', canvas.width / 2, canvas.height / 3);
    
    ctx.font = '24px Arial';
    ctx.fillText('Sterowanie:', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '16px Arial';
    ctx.fillText('Strzałki - ruch postaci', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('Z - strzał', canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('Shift - tryb skupienia (wolniejszy ruch)', canvas.width / 2, canvas.height / 2 + 30);
    
    // Dodaj informację o sterowaniu głośnością
    ctx.fillText('Q/W - zmniejsz/zwiększ głośność muzyki', canvas.width / 2, canvas.height / 2 + 50);
    
    // Wyświetl aktualny poziom głośności
    ctx.fillStyle = '#aaaaff';
    ctx.fillText(`Głośność: ${Math.round(musicVolume * 100)}%`, canvas.width / 2, canvas.height / 2 + 70);
    
    // Narysuj graficzny pasek głośności
    const volumeBarWidth = 150;
    const volumeBarHeight = 10;
    const volumeBarX = canvas.width / 2 - volumeBarWidth / 2;
    const volumeBarY = canvas.height / 2 + 85;
    
    // Tło paska głośności
    ctx.fillStyle = '#333';
    ctx.fillRect(volumeBarX, volumeBarY, volumeBarWidth, volumeBarHeight);
    
    // Aktualny poziom głośności
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(volumeBarX, volumeBarY, volumeBarWidth * musicVolume, volumeBarHeight);
    
    // Pulsujący tekst "Naciśnij ENTER"
    const pulseIntensity = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulseIntensity * 0.5})`;
    ctx.font = '24px Arial';
    ctx.fillText('Naciśnij ENTER, aby rozpocząć', canvas.width / 2, canvas.height * 0.85);
}

function drawPlayer() {
    // Sprawdź efekt migania przy nieśmiertelności
    if (player.invincible && Math.floor(player.invincibleTimer / 5) % 2 === 0) {
        // Nie rysuj gracza co kilka klatek, aby uzyskać efekt migania
        return;
    }
    
    // Sprawdz czy obrazek jest załadowany przed narysowaniem
    if (playerImage.complete) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        
        // Dodaj wizualny efekt trybu skupienia
        if (player.focusing) {
            // Narysuj efekt wizualny (np. krąg wokół gracza)
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + player.height/2, 
                     player.width * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
    } else {
        // Fallback w przypadku gdy obrazek się nie załadował
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Rysowanie pocisków gracza
    ctx.fillStyle = player.bullets[0] ? player.bullets[0].color : '#00ffcc';
    for (const bullet of player.bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function drawBackground() {
    // Najpierw narysuj gradient nieba jako tło
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000033'); // Ciemny niebieski u góry
    gradient.addColorStop(0.7, '#335577'); // Jaśniejszy niebieski w dole
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Narysuj każdą warstwę tła (od najdalszej do najbliższej)
    for (const layer of backgrounds) {
        if (layer.img.complete) {
            try {
                // Aktualizuj pozycję warstwy
                layer.x -= layer.speed;
                
                // Resetuj pozycję, gdy obrazek przewinie się
                if (layer.x <= -layer.width + canvas.width) {
                    layer.x = 0;
                }
                
                // Rysuj dwie kopie obok siebie
                ctx.drawImage(layer.img, layer.x, 0, layer.width, canvas.height);
                ctx.drawImage(layer.img, layer.x + layer.width, 0, layer.width, canvas.height);
            } catch (error) {
                console.error("Błąd rysowania tła:", error);
            }
        }
    }
}

function drawEnemies() {
    // Rysowanie przeciwników
    for (const enemy of enemies) {
        if (enemy.image && enemy.image.complete) {
            ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Opcjonalnie - pasek zdrowia dla specjalnych przeciwników
            if (enemy.special && enemy.health > 0) {
                const healthBarWidth = enemy.width;
                const healthBarHeight = 5;
                const healthPercent = enemy.health / 3; // 3 to maksymalne zdrowie specjalnego przeciwnika
                
                // Tło paska zdrowia
                ctx.fillStyle = '#333';
                ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth, healthBarHeight);
                
                // Pasek zdrowia
                ctx.fillStyle = '#0f0';
                ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth * healthPercent, healthBarHeight);
            }
        } else {
            // Fallback jeśli obrazek nie jest dostępny
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }
    
    // Rysowanie pocisków przeciwników
    for (const bullet of enemyBullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = bullet.color;
        ctx.fill();
        ctx.closePath();
    }
}

function drawCountdown() {
    if (gameStarted && !enemiesEnabled && !stageNameVisible) {
        const secondsLeft = 5 - Math.floor(gameTimer / 60);
        if (secondsLeft > 0) {
            ctx.fillStyle = 'white';
            ctx.font = '15px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Przeciwnicy pojawią się za: ${secondsLeft}`, canvas.width / 2, 50);
        }
    }
}

// Funkcja rysująca nazwę etapu
function drawStageName() {
    if (stageNameVisible) {
        // Tło pod nazwą etapu
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvas.height / 3 - 30, canvas.width, 80);
        
        // Efekt przejścia przy pojawianiu się i znikaniu
        let alpha = 1.0;
        
        // Pojawianie się (pierwsze pół sekundy)
        if (stageNameTimer < 30) {
            alpha = stageNameTimer / 30;
        }
        // Znikanie (ostatnia sekunda)
        else if (stageNameTimer > 120) {
            alpha = 1 - ((stageNameTimer - 120) / 60);
        }
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Stage 1 - Krzychowa Masakra', canvas.width / 2, canvas.height / 3);
        
        ctx.font = '20px Arial';
        ctx.fillText('Przygotuj się...', canvas.width / 2, canvas.height / 3 + 30);
    }
}

function drawLives() {
    // Rysowanie żyć w prawym górnym rogu
    const heartSize = 25;
    const padding = 5;
    const startX = canvas.width - (heartSize * lives) - (padding * (lives + 1));
    
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Życia:', startX - padding * 2, 25);
    
    for (let i = 0; i < lives; i++) {
        const x = startX + (heartSize + padding) * i;
        const y = 10;
        
        if (heartImage.complete) {
            ctx.drawImage(heartImage, x, y, heartSize, heartSize);
        } else {
            // Fallback jeśli obrazek nie jest dostępny
            ctx.fillStyle = '#ff3366';
            ctx.beginPath();
            ctx.arc(x + heartSize/4, y + heartSize/3, heartSize/4, 0, Math.PI * 2);
            ctx.arc(x + heartSize*3/4, y + heartSize/3, heartSize/4, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(x + heartSize/2, y + heartSize*3/4);
            ctx.lineTo(x + heartSize/4, y + heartSize/2);
            ctx.lineTo(x + heartSize/2, y + heartSize/4);
            ctx.lineTo(x + heartSize*3/4, y + heartSize/2);
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawUI() {
    // Rysowanie wyniku
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Wynik: ${score}`, 10, 25);
    
    // Rysowanie żyć
    drawLives();
    
    // Rysowanie nazwy etapu (jeśli widoczna)
    drawStageName();
    
    if (gameOver) {
        // Zatrzymanie muzyki
        bgMusic.pause();
        bgMusic.currentTime = 0;
        
        // Tło Game Over
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '18px Arial';
        ctx.fillText(`Twój wynik: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Naciśnij ENTER, aby zagrać ponownie', canvas.width / 2, canvas.height / 2 + 70);
    }
}
// Główna pętla gry
function gameLoop() {
    // Zamiast czyszczenia ekranu jednym kolorem, rysujemy tło
    drawBackground();
    
    // Aktualizacja głośności muzyki (działa zawsze, niezależnie od stanu gry)
    updateVolume();
    
    if (!gameStarted) {
        drawStartScreen();
    } else {
        updateGameTimer();
        
        if (!gameOver) {
            updatePlayer();
            updateEnemies();
            checkCollisions();
        }
        
        drawPlayer();
        drawEnemies();
        drawCountdown();
        drawUI();
    }
    
    requestAnimationFrame(gameLoop);
}

// Uruchomienie gry
function initGame() {
    console.log("Inicjalizacja gry...");
    gameLoop();
}

// Ładowanie obrazków
playerImage.onload = function() {
    console.log("Obrazek postaci załadowany!");
};

// Obsługa błędu ładowania obrazka
playerImage.onerror = function() {
    console.error("Błąd ładowania obrazka postaci!");
};

// Obsługa błędów ładowania muzyki
bgMusic.onerror = function() {
    console.error("Nie można załadować pliku muzyki!");
};

backgroundFar.onload = function() {
    console.log("Tło załadowane!");
};

backgroundFar.onerror = function() {
    console.error("Błąd ładowania tła!");
};

heartImage.onload = function() {
    console.log("Obrazek serduszka załadowany!");
};

heartImage.onerror = function() {
    console.error("Błąd ładowania obrazka serduszka!");
};

// Uruchom grę po załadowaniu wszystkich niezbędnych zasobów
window.addEventListener('load', function() {
    initGame();
});

// Możemy też uruchomić grę ręcznie, jeśli zasoby są już w pamięci podręcznej
if (playerImage.complete) {
    initGame();
}