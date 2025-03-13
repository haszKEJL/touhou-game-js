import { CONFIG } from './config.js';

// Klasa zarządzająca formacjami przeciwników
export class FormationManager {
    constructor(canvas, entityFactory) {
        this.canvas = canvas;
        this.entityFactory = entityFactory;
        this.currentFormation = -1; // -1 oznacza, że nie ma aktywnej formacji
        this.formationEnemiesLeft = 0;
        this.formationCooldown = CONFIG.formations.cooldown;
        this.formationActive = false;
        this.gameEnemiesRef = null; // Referencja do tablicy przeciwników
        
        // Dodaj tę linię - pozycja zatrzymania formacji (40% ekranu od góry)
        this.formationStopPosition = this.canvas.height * 0.4;
    }
    
    // Dodaj metodę ustawiającą referencję do tablicy przeciwników
    setEnemiesReference(enemies) {
        this.gameEnemiesRef = enemies;
    }
    
    reset() {
        this.currentFormation = -1;
        this.formationEnemiesLeft = 0;
        this.formationCooldown = CONFIG.formations.cooldown;
        this.formationActive = false;
    }
    
    update(enemies) {
        // Dodaj debugowanie
        //console.log(`Formation active: ${this.formationActive}, Enemies left: ${this.formationEnemiesLeft}, Formation cooldown: ${this.formationCooldown}`);
        
        // Aktualizuj referencję do tablicy przeciwników
        this.gameEnemiesRef = enemies;
        
        if (!this.formationActive) {
            // Jeśli nie ma aktywnej formacji, zmniejsz cooldown
            this.formationCooldown--;
            
            if (this.formationCooldown <= 0) {
                // Czas na nową formację
                this.selectRandomFormation();
                this.formationCooldown = CONFIG.formations.cooldown;
            }
        } else {
            // Sprawdź, czy formacja jest aktywna, ale wszyscy przeciwnicy zostali zniszczeni
            let formationComplete = true;
            for (const enemy of enemies) {
                if (enemy.formationIndex !== undefined && enemy.formationIndex >= 0) {
                    formationComplete = false;
                    break;
                }
            }
            
            // Dodaj zabezpieczenie - jeśli nie ma przeciwników z formationIndex, zresetuj formację
            if (formationComplete) {
                this.formationActive = false;
                this.currentFormation = -1;
                this.formationEnemiesLeft = 0;  // Dodane zabezpieczenie
            }
        }
    }
    
    // Wybiera losową formację inną niż poprzednia
    selectRandomFormation() {
        const formationTypes = Object.values(CONFIG.formations.types);
        let newFormation;
        
        do {
            newFormation = formationTypes[Math.floor(Math.random() * formationTypes.length)];
        } while (newFormation === this.currentFormation && formationTypes.length > 1);
        
        this.currentFormation = newFormation;
        
        // Inicjalizacja wybranej formacji
        switch(this.currentFormation) {
            case CONFIG.formations.types.LINE:
                this.initLineFormation();
                break;
            case CONFIG.formations.types.V_SHAPE:
                this.initVShapeFormation();
                break;
            case CONFIG.formations.types.DIAMOND:
                this.initDiamondFormation();
                break;
            case CONFIG.formations.types.SIDES:
                this.initSidesFormation();
                break;
            case CONFIG.formations.types.ARC:
                this.initArcFormation();
                break;
            default:
                this.initLineFormation();
        }
        
        this.formationActive = true;
        console.log(`Nowa formacja: ${Object.keys(CONFIG.formations.types)[this.currentFormation]}`);
    }
    
    // Inicjalizacja poszczególnych formacji
    
    // Formacja liniowa - przeciwnicy w jednej linii poziomej
    initLineFormation() {
        this.formationEnemiesLeft = 5;
        const baseY = -30;
        const spacing = this.canvas.width / (this.formationEnemiesLeft + 1);
        
        // Harmonogram wejścia - tworzymy przeciwników co 15 klatek
        for (let i = 0; i < this.formationEnemiesLeft; i++) {
            const delayTime = i * 15;
            setTimeout(() => {
                // Tworzenie przeciwnika z odpowiednimi parametrami
                const enemy = this.entityFactory.createEnemy({
                    special: i === 2,  // Środkowy może być specjalny
                    formationIndex: i,
                    movementType: 'hover',
                    x: spacing * (i + 1) - 15,  // Centrowanie przeciwnika (15 to połowa szerokości)
                    y: baseY,
                    targetY: this.formationStopPosition + Math.random() * 20,  // Zatrzymanie na 40% wysokości ekranu
                    maxShootCooldown: 60 + i * 20
                });
                
                // Dodajemy przeciwnika do tablicy enemies w gameLogic
                if (this.gameEnemiesRef) {
                    this.gameEnemiesRef.push(enemy);
                }
            }, delayTime);
        }
    }
    
    // Formacja V - przeciwnicy w kształcie litery V
    initVShapeFormation() {
        this.formationEnemiesLeft = 5;
        const baseY = -30;
        const centerX = this.canvas.width / 2;
        const spacing = 50;
        
        for (let i = 0; i < this.formationEnemiesLeft; i++) {
            setTimeout(() => {
                // Obliczanie pozycji X, aby stworzyć kształt V
                let xOffset;
                if (i < 2) {
                    // Lewa strona V
                    xOffset = -spacing * (i + 1);
                } else if (i > 2) {
                    // Prawa strona V
                    xOffset = spacing * (i - 2);
                } else {
                    // Środkowy punkt V
                    xOffset = 0;
                }
                
                const enemy = this.entityFactory.createEnemy({
                    special: i === 2,  // Środkowy jest specjalny
                    formationIndex: i,
                    movementType: 'sine',
                    x: centerX + xOffset - 15,  // 15 to połowa szerokości
                    y: baseY + Math.abs(xOffset) / 2,
                    targetY: this.formationStopPosition,  // Zatrzymanie na 40% wysokości ekranu
                    moveParameters: {
                        baseX: centerX + xOffset - 15,
                        amplitude: 20,
                        frequency: 0.02
                    },
                    maxShootCooldown: 60 + i * 30
                });
                
                // Dodajemy przeciwnika do tablicy enemies w gameLogic
                if (this.gameEnemiesRef) {
                    this.gameEnemiesRef.push(enemy);
                }
            }, i * 20);
        }
    }
    
    // Formacja diamentu/rombu
    initDiamondFormation() {
        this.formationEnemiesLeft = 5;
        const baseY = -30;
        const centerX = this.canvas.width / 2;
        const spacing = 40;
        
        // Pozycje w formacji diamentu
        const positions = [
            { x: centerX, y: baseY },  // góra
            { x: centerX - spacing, y: baseY + spacing },  // lewy środek
            { x: centerX + spacing, y: baseY + spacing },  // prawy środek
            { x: centerX - spacing/2, y: baseY + spacing*2 },  // lewy dół
            { x: centerX + spacing/2, y: baseY + spacing*2 }   // prawy dół
        ];
        
        for (let i = 0; i < this.formationEnemiesLeft; i++) {
            setTimeout(() => {
                const enemy = this.entityFactory.createEnemy({
                    special: i === 0,  // Górny jest specjalny
                    formationIndex: i,
                    movementType: 'hover',
                    x: positions[i].x - 15,
                    y: positions[i].y,
                    targetY: this.formationStopPosition - 20 + (i % 3) * 15,  // Zatrzymanie na 40% wysokości ekranu
                    moveParameters: {
                        disperseAfter: 180  // Rozproszenie po 3 sekundach
                    },
                    maxShootCooldown: 80 + i * 15
                });
                
                // Dodajemy przeciwnika do tablicy enemies w gameLogic
                if (this.gameEnemiesRef) {
                    this.gameEnemiesRef.push(enemy);
                }
            }, i * 25);
        }
    }

    // Dwie grupy przeciwników po bokach ekranu
    initSidesFormation() {
    this.formationEnemiesLeft = 6;  // 3 po każdej stronie
    const baseY = -30;
    const leftX = 50;
    const rightX = this.canvas.width - 80;
    const verticalSpacing = 40;
    
    for (let i = 0; i < this.formationEnemiesLeft; i++) {
        setTimeout(() => {
            const isLeftSide = i < 3;
            
            const enemy = this.entityFactory.createEnemy({
                special: i === 2 || i === 5,  // Ostatni w każdej grupie jest specjalny
                formationIndex: i,
                movementType: 'hover',
                x: isLeftSide ? leftX : rightX,
                y: baseY + (i % 3) * verticalSpacing,
                targetY: this.formationStopPosition + (i % 3) * 30,  // Zatrzymanie na 40% wysokości ekranu
                moveParameters: {
                    moveInwards: isLeftSide ? 1 : -1  // Kierunek ruchu do środka
                },
                maxShootCooldown: 60 + (i % 3) * 40
            });
            
            // Dodajemy przeciwnika do tablicy enemies w gameLogic
            if (this.gameEnemiesRef) {
                this.gameEnemiesRef.push(enemy);
            }
        }, i * 20);
    }
}
    
    // Formacja łukowa/półkole
    initArcFormation() {
        this.formationEnemiesLeft = 7;
        const baseY = -30;
        const centerX = this.canvas.width / 2;
        const radius = 100;
        
        for (let i = 0; i < this.formationEnemiesLeft; i++) {
            setTimeout(() => {
                // Rozmieszczenie przeciwników w łuku
                const angle = Math.PI * (0.2 + 0.6 * (i / (this.formationEnemiesLeft - 1)));  // Od 0.2π do 0.8π
                
                const enemy = this.entityFactory.createEnemy({
                    special: i === 3,  // Środkowy jest specjalny
                    formationIndex: i,
                    movementType: 'hover',
                    x: centerX + Math.cos(angle) * radius - 15,
                    y: baseY + Math.sin(angle) * radius/2,
                    targetY: this.formationStopPosition - 10 + Math.sin(angle) * 30,  // Zatrzymanie na 40% wysokości ekranu
                    moveParameters: {
                        angle: angle
                    },
                    maxShootCooldown: 70 + i * 25
                });
                
                // Dodajemy przeciwnika do tablicy enemies w gameLogic
                if (this.gameEnemiesRef) {
                    this.gameEnemiesRef.push(enemy);
                }
            }, i * 15);
        }
    }
}