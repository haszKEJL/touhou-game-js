import { CONFIG } from './config.js';
import { loadAssets, AUDIO } from './assets.js';
import { GameLogic } from './gameLogic.js';
import { Renderer } from './renderer.js';
import { DialogueManager, introDialogues, preBossDialogues, endingDialogues } from './dialogue.js';

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
        this.dialogueManager = null;
    }
    
    // Inicjalizacja gry
    async init() {
        try {
            // Ładowanie zasobów
            await loadAssets();
            console.log('Wszystkie zasoby załadowane!');
            
            // Inicjalizacja logiki, renderera i menedżera dialogów
            this.gameLogic = new GameLogic(this.canvas);
            this.renderer = new Renderer(this.canvas, this.ctx);
            this.dialogueManager = new DialogueManager(this.canvas, this.ctx);
            
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
                    console.log("Starting new game");
                    this.gameLogic.reset();
                    
                    // Rozpocznij dialogi wprowadzające
                    this.dialogueManager.startDialogues(introDialogues, this.dialogueManager.dialogueTypes.INTRO);
                }
                
                // Restart gry po naciśnięciu Enter na ekranie Game Over lub Victory
                if (e.key === 'Enter' && (this.gameLogic.gameOver || this.gameLogic.gameWon)) {
                    console.log("Restarting game");
                    this.gameLogic.reset();
                    
                    // Rozpocznij dialogi wprowadzające przy restarcie
                    this.dialogueManager.startDialogues(introDialogues, this.dialogueManager.dialogueTypes.INTRO);
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
        // Aktualizacja dialogów
        if (this.dialogueManager) {
            this.dialogueManager.update();
        }

        // Aktualizacja stanu gry
        if (this.gameLogic) {
            // Sprawdź zakończone dialogi
            if (this.dialogueManager && this.dialogueManager.areDialoguesFinished()) {
                const dialogueType = this.dialogueManager.getCurrentDialogueType();
                console.log("Dialogues finished, type:", dialogueType);
                
                if (dialogueType === this.dialogueManager.dialogueTypes.INTRO) {
                    // Po wprowadzeniu włącz przeciwników
                    console.log("Enabling enemies after intro");
                    this.gameLogic.enemiesEnabled = true;
                    this.dialogueManager.isDialogueFinished = false;
                } 
                else if (dialogueType === this.dialogueManager.dialogueTypes.PRE_BOSS) {
                    // Po dialogu z bossem stwórz bossa
                    console.log("Creating boss after dialogue");
                    const boss = this.gameLogic.entityFactory.createBoss();
                    this.gameLogic.enemies.push(boss);
                    this.dialogueManager.isDialogueFinished = false;
                }
                else if (dialogueType === this.dialogueManager.dialogueTypes.ENDING) {
                    // Po dialogu końcowym pokaż ekran zwycięstwa
                    console.log("Showing victory screen after ending dialogue");
                    this.gameLogic.gameWon = true;
                    this.dialogueManager.isDialogueFinished = false;
                }
            }
            
            // Sprawdź czy należy uruchomić dialog bossa
            if (this.gameLogic.shouldStartBossDialogue) {
                console.log("Starting boss dialogue");
                this.dialogueManager.startDialogues(preBossDialogues, this.dialogueManager.dialogueTypes.PRE_BOSS);
                this.gameLogic.shouldStartBossDialogue = false;
            }
            
            // Sprawdź czy należy uruchomić dialog końcowy
            if (this.gameLogic.shouldStartEndingDialogue) {
                console.log("Starting ending dialogue");
                this.dialogueManager.startDialogues(endingDialogues, this.dialogueManager.dialogueTypes.ENDING);
                this.gameLogic.shouldStartEndingDialogue = false;
            }
            
            // Aktualizuj logikę gry tylko jeśli dialogi nie są aktywne
            if (!this.dialogueManager || !this.dialogueManager.isDialogueActive) {
                this.gameLogic.update(this.keys);
            }
        }
        
        // Renderowanie gry
        if (this.renderer && this.gameLogic) {
            this.renderer.render(this.gameLogic);
            
            // Renderowanie dialogów
            if (this.dialogueManager && this.dialogueManager.isDialogueActive) {
                this.dialogueManager.draw();
            }
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