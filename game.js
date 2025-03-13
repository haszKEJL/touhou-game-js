import { CONFIG } from './config.js';
import { loadAssets, AUDIO } from './assets.js';
import { GameLogic } from './gameLogic.js';
import { Renderer } from './renderer.js';

// Główna klasa gry
export class Game {
    constructor() {
        // Inicjalizacja canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Flagi kontroli klawiatury
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            z: false,
            Enter: false,
            Shift: false,
            q: false,
            w: false
        };
        
        // Logika i renderer gry będą inicjowane po załadowaniu zasobów
        this.gameLogic = null;
        this.renderer = null;
    }
    
    // Inicjalizacja gry
    async init() {
        try {
            // Ładowanie zasobów
            await loadAssets();
            console.log('Wszystkie zasoby załadowane!');
            
            // Inicjalizacja logiki i renderera
            this.gameLogic = new GameLogic(this.canvas);
            this.renderer = new Renderer(this.canvas, this.ctx);
            
            // Dodanie obsługi klawiatury
            this.setupInputHandlers();
            
            // Uruchomienie pętli gry
            this.gameLoop();
            
            return true;
        } catch (error) {
            console.error('Błąd podczas inicjalizacji gry:', error);
            return false;
        }
    }
    
    // Obsługa klawiatury
    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            if (e.key in this.keys) {
                this.keys[e.key] = true;
                
                // Start gry po naciśnięciu Enter na ekranie startowym
                if (e.key === 'Enter' && !this.gameLogic.gameStarted && !this.gameLogic.gameOver) {
                    this.gameLogic.reset();
                }
                
                // Restart gry po naciśnięciu Enter na ekranie Game Over lub Victory
                if (e.key === 'Enter' && (this.gameLogic.gameOver || this.gameLogic.gameWon)) {
                    this.gameLogic.reset();
                }
                
                // Zapobieganie przewijaniu strony strzałkami
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                    e.preventDefault();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key in this.keys) {
                this.keys[e.key] = false;
            }
        });
    }
    
    // Główna pętla gry
    gameLoop = () => {
        // Aktualizacja logiki gry
        if (this.gameLogic) {
            this.gameLogic.update(this.keys);
        }
        
        // Renderowanie gry
        if (this.renderer && this.gameLogic) {
            this.renderer.render(this.gameLogic);
        }
        
        // Kontynuowanie pętli
        requestAnimationFrame(this.gameLoop);
    };
}

// Inicjalizacja i uruchomienie gry po załadowaniu strony
window.addEventListener('load', async () => {
    console.log('Inicjalizacja gry...');
    
    const game = new Game();
    const success = await game.init();
    
    if (!success) {
        console.error('Nie udało się zainicjalizować gry.');
    }
});