// System dialogów dla gry w stylu Touhou
export class DialogueManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Właściwości dialogów
        this.dialogues = [];             
        this.currentDialogueIndex = 0;   
        this.isDialogueActive = false;   
        this.isDialogueFinished = false; 
        this.dialogueTimer = 0;          
        this.textSpeed = 2;              
        this.currentTextIndex = 0;       
        this.waitingForInput = false;    
        
        // Ustawienia wizualne
        this.dialogueBoxHeight = 150;    
        this.textMargin = 20;            
        this.lineHeight = 24;            
        
        // Typy dialogów
        this.dialogueTypes = {
            INTRO: 'intro',      
            PRE_BOSS: 'pre-boss',
            ENDING: 'ending'      
        };
        
        // Aktualny typ dialogu
        this.currentDialogueType = null;
        
        // Obsługa klawiatury
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.addEventListeners();

        // Debug
        console.log("DialogueManager initialized");
    }
    
    // Dodanie nasłuchiwania zdarzeń klawiatury
    addEventListeners() {
        window.addEventListener('keydown', this.boundHandleKeyDown);
    }
    
    // Usunięcie nasłuchiwania zdarzeń
    removeEventListeners() {
        window.removeEventListener('keydown', this.boundHandleKeyDown);
    }
    
    // Obsługa naciśnięcia klawisza
    handleKeyDown(event) {
        // Przejście do następnego dialogu po naciśnięciu Z lub Enter
        if ((event.key === 'z' || event.key === 'Enter') && this.isDialogueActive) {
            console.log("Key pressed in dialog: " + event.key);
            if (this.waitingForInput) {
                this.proceedToNextDialogue();
            } else {
                // Jeśli tekst jest jeszcze animowany, wyświetl go od razu w całości
                this.currentTextIndex = this.dialogues[this.currentDialogueIndex].text.length;
                this.waitingForInput = true;
            }
        }
    }
    
    // Przejście do następnego dialogu
    proceedToNextDialogue() {
        this.currentDialogueIndex++;
        this.currentTextIndex = 0;
        this.waitingForInput = false;
        
        // Sprawdzenie, czy to koniec dialogów
        if (this.currentDialogueIndex >= this.dialogues.length) {
            console.log("All dialogues completed, ending dialog sequence");
            this.endDialogues();
        }
    }
    
    // Rozpoczęcie wyświetlania dialogów
    startDialogues(dialogues, type) {
        console.log("Starting dialogues of type: " + type);
        this.dialogues = dialogues;
        this.currentDialogueIndex = 0;
        this.currentTextIndex = 0;
        this.isDialogueActive = true;
        this.isDialogueFinished = false;
        this.waitingForInput = false;
        this.currentDialogueType = type;
    }
    
    // Zakończenie wyświetlania dialogów
    endDialogues() {
        console.log("Ending dialogues of type: " + this.currentDialogueType);
        this.isDialogueActive = false;
        this.isDialogueFinished = true;
    }
    
    // Aktualizacja stanu dialogów
    update() {
        if (!this.isDialogueActive || this.currentDialogueIndex >= this.dialogues.length) return;
        
        const currentDialogue = this.dialogues[this.currentDialogueIndex];
        
        // Animacja tekstu
        if (!this.waitingForInput && this.currentTextIndex < currentDialogue.text.length) {
            this.dialogueTimer++;
            
            if (this.dialogueTimer >= this.textSpeed) {
                this.dialogueTimer = 0;
                this.currentTextIndex += 1;
                
                // Gdy tekst zostanie w pełni wyświetlony, oczekuj na wejście
                if (this.currentTextIndex >= currentDialogue.text.length) {
                    this.waitingForInput = true;
                }
            }
        }
    }
    
    // Rysowanie dialogów
    draw() {
        if (!this.isDialogueActive || this.currentDialogueIndex >= this.dialogues.length) return;
        
        const currentDialogue = this.dialogues[this.currentDialogueIndex];
        
        // Tło dialogu
        this.drawDialogueBox();
        
        // Rysowanie tekstu dialogu
        this.drawDialogueText(currentDialogue);
        
        // Wskaźnik "naciśnij Z, aby kontynuować"
        if (this.waitingForInput) {
            this.drawContinueIndicator();
        }
        
        // Rysowanie nazwy postaci
        if (currentDialogue.name) {
            this.drawCharacterName(currentDialogue.name);
        }
    }
    
    // Rysowanie tła dialogu
    drawDialogueBox() {
        const boxY = this.canvas.height - this.dialogueBoxHeight;
        
        // Półprzezroczyste tło
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, boxY, this.canvas.width, this.dialogueBoxHeight);
        
        // Ozdobna ramka
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(5, boxY + 5, this.canvas.width - 10, this.dialogueBoxHeight - 10);
    }
    
    // Rysowanie tekstu dialogu
    drawDialogueText(dialogue) {
        const boxY = this.canvas.height - this.dialogueBoxHeight;
        const textStartX = 20; // Prostsza wersja bez portretów
        const textStartY = boxY + this.textMargin + this.lineHeight;
        
        // Pobieranie tekstu do wyświetlenia (animacja pisania)
        const textToShow = dialogue.text.substring(0, this.currentTextIndex);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        
        // Dzielenie tekstu na linie
        const words = textToShow.split(' ');
        let line = '';
        let y = textStartY;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > this.canvas.width - textStartX - this.textMargin && i > 0) {
                this.ctx.fillText(line, textStartX, y);
                line = words[i] + ' ';
                y += this.lineHeight;
            } else {
                line = testLine;
            }
        }
        
        this.ctx.fillText(line, textStartX, y);
    }
    
    // Rysowanie wskaźnika kontynuacji
    drawContinueIndicator() {
        const boxY = this.canvas.height - this.dialogueBoxHeight;
        
        // Migający trójkąt jako wskaźnik
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width - 20, boxY + this.dialogueBoxHeight - 20);
            this.ctx.lineTo(this.canvas.width - 10, boxY + this.dialogueBoxHeight - 30);
            this.ctx.lineTo(this.canvas.width - 30, boxY + this.dialogueBoxHeight - 30);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    // Rysowanie nazwy postaci
    drawCharacterName(name) {
        const boxY = this.canvas.height - this.dialogueBoxHeight;
        
        // Tło pod nazwą
        this.ctx.fillStyle = 'rgba(50, 0, 100, 0.7)';
        const nameWidth = this.ctx.measureText(name).width + 20;
        this.ctx.fillRect(10, boxY - 25, nameWidth, 25);
        
        // Tekst nazwy
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(name, 20, boxY - 7);
    }
    
    // Sprawdzenie, czy dialogi zostały zakończone
    areDialoguesFinished() {
        return this.isDialogueFinished;
    }
    
    // Pobranie aktualnego typu dialogu
    getCurrentDialogueType() {
        return this.currentDialogueType;
    }
}

// Przykładowe dialogi - uproszczona wersja bez portretów
export const introDialogues = [
    {
        name: "Narrator",
        text: "W samym sercu lasów Gensokyo, gdzie magia jest tak powszechna jak powietrze, które wdychasz..."
    },
    {
        name: "Narrator",
        text: "Dziwne anomalie zaczęły się pojawiać, zakłócając spokój mieszkańców."
    },
    {
        name: "Bohater",
        text: "Znowu jakiś incydent? Nigdy nie mamy spokoju w tym miejscu. Wygląda na to, że muszę się tym zająć."
    },
    {
        name: "Narrator",
        text: "A teraz, uzbrojony w niezwykłe moce, wyruszasz, aby przywrócić równowagę w Gensokyo..."
    }
];

export const preBossDialogues = [
    {
        name: "Bohater",
        text: "W końcu cię znalazłem! To ty stoisz za tymi wszystkimi anomaliami?"
    },
    {
        name: "Boss",
        text: "Hohoho! Tak, to ja - Krzychowa Masakra! Jestem odpowiedzialny za chaos, który widzisz."
    },
    {
        name: "Boss",
        text: "Wykorzystuję energię tego miejsca, aby stworzyć sobie własny mały świat. Gensokyo będzie moje!"
    },
    {
        name: "Bohater",
        text: "Nie pozwolę ci na to! Przywrócę porządek w Gensokyo, nawet jeśli będę musiał cię pokonać!"
    },
    {
        name: "Boss",
        text: "Hahaha! Próbuj ile chcesz! Moje bullet hell sprawi, że będziesz błagać o litość! Przygotuj się!"
    }
];

export const endingDialogues = [
    {
        name: "Boss",
        text: "Niemożliwe... Jak mogłeś mnie pokonać?!"
    },
    {
        name: "Bohater",
        text: "Twoja moc była imponująca, ale nie doceniłeś siły Gensokyo i jego obrońców."
    },
    {
        name: "Boss",
        text: "Być może... być może miałeś rację. Moje ambicje były zbyt wielkie..."
    },
    {
        name: "Bohater",
        text: "Gensokyo wraca do normalności. Incydent został zażegnany... przynajmniej na razie."
    },
    {
        name: "Narrator",
        text: "I tak kolejne zagrożenie zostało powstrzymane. Lecz kto wie, jakie nowe przygody czekają na horyzoncie..."
    }
];