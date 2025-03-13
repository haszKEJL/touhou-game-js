// Funkcje rysowania elementów gry

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
    if (player.image.complete) {
        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
        
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
function drawBossTimer() {
    if (gameStarted && !gameOver && enemiesEnabled && !bossActive) {
        // Oblicz procent ukończenia odliczania
        const progress = Math.min(1, bossTimer / bossAppearTime);
        
        // Pasek tła (ciemniejszy)
        ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
        ctx.fillRect(0, canvas.height - 5, canvas.width, 5);
        
        // Pasek postępu (czerwony)
        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.fillRect(0, canvas.height - 5, canvas.width * progress, 5);
        
        // Opcjonalnie dodaj efekt migotania, gdy zbliża się koniec odliczania
        if (progress > 0.8) {
            // Dodajemy efekt migotania poprzez zmienianie przezroczystości
            const flash = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.7})`;
            ctx.fillRect(0, canvas.height - 5, canvas.width * progress, 5);
        }
        
        // Opcjonalnie dodaj napis "BOSS" po prawej stronie
        if (progress > 0.5) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('BOSS', canvas.width - 10, canvas.height - 10);
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
    
    // Dodajemy rysowanie paska czasu do bossa
    drawBossTimer();
    
    if (gameOver) {
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