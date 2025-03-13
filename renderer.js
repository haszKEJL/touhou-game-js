import { IMAGES } from './assets.js';
import { CONFIG } from './config.js';

// Klasa renderująca elementy gry
export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }
    
    // Główna funkcja renderująca
    render(gameLogic) {
        // Rysuj tło
        this.drawBackground();
        
        if (!gameLogic.gameStarted) {
            // Ekran startowy
            this.drawStartScreen(gameLogic.musicVolume);
            return;
        }
        
        if (gameLogic.gameOver) {
            // Ekran końca gry
            this.drawGameOverScreen(gameLogic.score);
            return;
        }
        
        if (gameLogic.gameWon) {
            // Ekran zwycięstwa
            this.drawVictoryScreen(gameLogic.score);
            return;
        }
        
        // Rysuj elementy gry
        gameLogic.player.draw(this.ctx);
        this.drawEnemies(gameLogic.enemies);
        this.drawEnemyBullets(gameLogic.enemyBullets);
        
        // Rysuj UI
        this.drawUI(gameLogic);

        // Dodaj pasek postępu do bossa
        if (gameLogic.gameStarted && gameLogic.enemiesEnabled && !gameLogic.bossActive) {
            this.drawBossProgressBar(gameLogic.bossTimer, CONFIG.boss.appearTime);
        }

        // Rysuj odliczanie do przeciwników
        if (gameLogic.gameStarted && !gameLogic.enemiesEnabled && !gameLogic.stageNameVisible) {
            this.drawCountdown(gameLogic.gameTimer);
        }
        
        // Rysuj nazwę etapu (jeśli widoczna)
        if (gameLogic.stageNameVisible) {
            this.drawStageName(gameLogic.stageNameTimer, gameLogic.bossActive);
        }
    }
    
    // Rysuj tło
    drawBackground() {
        // Narysuj gradient nieba jako tło
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000033'); // Ciemny niebieski u góry
        gradient.addColorStop(0.7, '#335577'); // Jaśniejszy niebieski w dole
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Rysuj tło z obrazka (jeśli jest dostępne)
        if (IMAGES.backgroundFar && IMAGES.backgroundFar.complete) {
            try {
                const backgroundWidth = 1200; // Dostosuj do szerokości obrazka
                const x = (Date.now() * 0.02) % backgroundWidth;
                
                // Rysuj dwie kopie obok siebie dla płynnego przewijania
                this.ctx.drawImage(IMAGES.backgroundFar, -x, 0, backgroundWidth, this.canvas.height);
                this.ctx.drawImage(IMAGES.backgroundFar, backgroundWidth - x, 0, backgroundWidth, this.canvas.height);
            } catch (error) {
                console.error("Błąd rysowania tła:", error);
            }
        }
    }
    
    // Rysuj przeciwników
    drawEnemies(enemies) {
        for (const enemy of enemies) {
            enemy.draw(this.ctx);
        }
    }
    
    // Rysuj pociski przeciwników
    drawEnemyBullets(bullets) {
        for (const bullet of bullets) {
            bullet.draw(this.ctx);
        }
    }
    
    // Rysuj interfejs użytkownika
    drawUI(gameLogic) {
        // Rysuj wynik
        this.ctx.fillStyle = 'white';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Wynik: ${gameLogic.score}`, 10, 25);
        
        // Rysuj życia
        this.drawLives(gameLogic.lives);
    }
    
    // Rysuj życia gracza
    drawLives(lives) {
        const heartSize = 25;
        const padding = 5;
        const startX = this.canvas.width - (heartSize * lives) - (padding * (lives + 1));
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Życia:', startX - padding * 2, 25);
        
        for (let i = 0; i < lives; i++) {
            const x = startX + (heartSize + padding) * i;
            const y = 10;
            
            if (IMAGES.heart && IMAGES.heart.complete) {
                this.ctx.drawImage(IMAGES.heart, x, y, heartSize, heartSize);
            } else {
                // Fallback jeśli obrazek nie jest dostępny
                this.drawHeartShape(x, y, heartSize);
            }
        }
    }
    drawBossProgressBar(bossTimer, bossAppearTime) {
        // Parametry paska postępu
        const barWidth = this.canvas.width * 0.8;
        const barHeight = 5;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.canvas.height - 20;
        
        // Progress jako procent ukończenia
        const progress = Math.min(1, bossTimer / bossAppearTime);
        
        // Rysowanie tła paska
        this.ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Rysowanie paska postępu
        // Kolor od zielonego do czerwonego w miarę zbliżania się bossa
        const red = Math.floor(255 * progress);
        const green = Math.floor(255 * (1 - progress));
        this.ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Opcjonalnie - tekst informacyjny
        if (progress > 0.75) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Boss nadchodzi!', this.canvas.width / 2, barY - 5);
        }
    }

    // Rysuj kształt serca (fallback)
    drawHeartShape(x, y, size) {
        this.ctx.fillStyle = '#ff3366';
        
        // Dwa okręgi tworzące górną część serca
        this.ctx.beginPath();
        this.ctx.arc(x + size/4, y + size/3, size/4, 0, Math.PI * 2);
        this.ctx.arc(x + size*3/4, y + size/3, size/4, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Dolna część serca (trójkąt)
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/2, y + size*3/4);
        this.ctx.lineTo(x + size/4, y + size/2);
        this.ctx.lineTo(x + size/2, y + size/4);
        this.ctx.lineTo(x + size*3/4, y + size/2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // Rysuj odliczanie do pojawienia się przeciwników
    drawCountdown(gameTimer) {
        const secondsLeft = 5 - Math.floor(gameTimer / 60);
        if (secondsLeft > 0) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '15px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Przeciwnicy pojawią się za: ${secondsLeft}`, this.canvas.width / 2, 50);
        }
    }
    
    // Rysuj ekran startowy
    drawStartScreen(musicVolume) {
        // Nakładka na tło dla lepszej czytelności tekstu
        this.ctx.fillStyle = 'rgba(0, 17, 51, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Tytuł
        this.ctx.fillStyle = 'white';
        this.ctx.font = '36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TOUHOU-LIKE GAME', this.canvas.width / 2, this.canvas.height / 3);
        
        // Informacje o sterowaniu
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Sterowanie:', this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Strzałki - ruch postaci', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.fillText('Z - strzał', this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText('Shift - tryb skupienia (wolniejszy ruch)', this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText('Q/W - zmniejsz/zwiększ głośność muzyki', this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        // Głośność
        this.ctx.fillStyle = '#aaaaff';
        this.ctx.fillText(`Głośność: ${Math.round(musicVolume * 100)}%`, this.canvas.width / 2, this.canvas.height / 2 + 70);
        
           // Pasek głośności
           const volumeBarWidth = 150;
           const volumeBarHeight = 10;
           const volumeBarX = this.canvas.width / 2 - volumeBarWidth / 2;
           const volumeBarY = this.canvas.height / 2 + 85;
           
           // Tło paska głośności
           this.ctx.fillStyle = '#333';
           this.ctx.fillRect(volumeBarX, volumeBarY, volumeBarWidth, volumeBarHeight);
           
           // Aktualny poziom głośności
           this.ctx.fillStyle = '#4488ff';
           this.ctx.fillRect(volumeBarX, volumeBarY, volumeBarWidth * musicVolume, volumeBarHeight);
           
           // Pulsujący tekst "Naciśnij ENTER"
           const pulseIntensity = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
           this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulseIntensity * 0.5})`;
           this.ctx.font = '24px Arial';
           this.ctx.fillText('Naciśnij ENTER, aby rozpocząć', this.canvas.width / 2, this.canvas.height * 0.85);
       }
       
       // Rysuj ekran końca gry
       drawGameOverScreen(score) {
           // Nakładka na tło
           this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
           this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
           
           // Tekst końca gry
           this.ctx.fillStyle = 'white';
           this.ctx.font = '36px Arial';
           this.ctx.textAlign = 'center';
           this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
           
           // Wynik
           this.ctx.font = '18px Arial';
           this.ctx.fillText(`Twój wynik: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
           
           // Instrukcja ponownej gry
           this.ctx.fillText('Naciśnij ENTER, aby zagrać ponownie', this.canvas.width / 2, this.canvas.height / 2 + 70);
       }
       
       // Rysuj ekran zwycięstwa
       drawVictoryScreen(score) {
           // Nakładka na tło
           this.ctx.fillStyle = 'rgba(0, 20, 60, 0.8)';
           this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
           
           // Tekst zwycięstwa
           this.ctx.fillStyle = '#ffcc00';
           this.ctx.font = '36px Arial';
           this.ctx.textAlign = 'center';
           this.ctx.fillText('ZWYCIĘSTWO!', this.canvas.width / 2, this.canvas.height / 3);
           
           // Gratulacje
           this.ctx.fillStyle = 'white';
           this.ctx.font = '24px Arial';
           this.ctx.fillText('Gratulacje! Pokonałeś bossa!', this.canvas.width / 2, this.canvas.height / 2 - 20);
           
           // Wynik
           this.ctx.font = '18px Arial';
           this.ctx.fillText(`Twój wynik: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
           
           // Instrukcja ponownej gry
           this.ctx.fillText('Naciśnij ENTER, aby zagrać ponownie', this.canvas.width / 2, this.canvas.height / 2 + 70);
           
           // Efekt gwiazdek zwycięstwa
           this.drawVictoryEffects();
       }
       
       // Efekty dla ekranu zwycięstwa
       drawVictoryEffects() {
           const time = Date.now() * 0.001;
           
           // Rysowanie "gwiazdek" zwycięstwa
           for (let i = 0; i < 20; i++) {
               const x = this.canvas.width * (0.3 + 0.5 * Math.sin(time + i * 0.7));
               const y = this.canvas.height * (0.2 + 0.5 * Math.cos(time + i * 0.5));
               const size = 5 + 3 * Math.sin(time * 2 + i);
               
               this.ctx.fillStyle = `hsl(${(time * 50 + i * 20) % 360}, 100%, 70%)`;
               this.ctx.beginPath();
               this.ctx.arc(x, y, size, 0, Math.PI * 2);
               this.ctx.fill();
           }
       }
       
       // Rysowanie nazwy etapu
       drawStageName(stageNameTimer, isBossActive) {
           // Tło pod nazwą etapu
           this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
           this.ctx.fillRect(0, this.canvas.height / 3 - 30, this.canvas.width, 80);
           
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
           
           this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
           this.ctx.font = '30px Arial';
           this.ctx.textAlign = 'center';
           
           if (isBossActive) {
               this.ctx.fillText('BOSS - Krzychowa Masakra', this.canvas.width / 2, this.canvas.height / 3);
               this.ctx.font = '20px Arial';
               this.ctx.fillText('Przygotuj się na finałową walkę!', this.canvas.width / 2, this.canvas.height / 3 + 30);
           } else {
               this.ctx.fillText('Stage 1 - Krzychowa Masakra', this.canvas.width / 2, this.canvas.height / 3);
               this.ctx.font = '20px Arial';
               this.ctx.fillText('Przygotuj się...', this.canvas.width / 2, this.canvas.height / 3 + 30);
           }
       }
   }