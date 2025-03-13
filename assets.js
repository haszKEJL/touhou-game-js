// Ładowanie i zarządzanie zasobami gry

// Obrazki
export const IMAGES = {};

// Dźwięki
export const AUDIO = {};

// Zmodyfikuj funkcję loadAssets aby przekazać portrety do menedżera dialogów
export function loadAssets(dialogueManager = null) {
    return Promise.all([
        loadImages(),
        loadAudio()
    ]).then(() => {
        if (dialogueManager) {
            // Ustaw portrety w menedżerze dialogów, jeśli jest dostępny
            if (IMAGES.playerPortrait) dialogueManager.portraits.player = IMAGES.playerPortrait;
            if (IMAGES.bossPortrait) dialogueManager.portraits.boss = IMAGES.bossPortrait;
        }
    });
}

// Ładowanie obrazków
async function loadImages() {
    const imageFiles = {
        player: 'player.png',
        enemy: 'enemie.png',
        specialEnemy: 'mid-boss.png',
        heart: 'heart.png',
        backgroundFar: 'background-far.jpg',
        // Dodaj portrety postaci
        playerPortrait: 'player-portrait.png',
        bossPortrait: 'boss-portrait.png'
    };
    
    const promises = [];
    
    for (const [key, src] of Object.entries(imageFiles)) {
        promises.push(loadImage(key, src));
    }
    
    await Promise.all(promises);
    
    return IMAGES;
}

// Ładowanie dźwięków
async function loadAudio() {
    const audioFiles = {
        bgMusic: 'music_stage1.mp3'
    };
    
    for (const [key, src] of Object.entries(audioFiles)) {
        AUDIO[key] = loadSound(src);
    }
    
    // Konfiguracja muzyki tła
    AUDIO.bgMusic.loop = true;
    
    return AUDIO;
}

// Pomocnicza funkcja ładująca obraz
function loadImage(key, src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            IMAGES[key] = img;
            resolve(img);
        };
        
        img.onerror = () => {
            console.error(`Błąd ładowania obrazka: ${src}`);
            reject(new Error(`Błąd ładowania obrazka: ${src}`));
        };
        
        img.src = src;
    });
}

// Pomocnicza funkcja ładująca dźwięk
function loadSound(src) {
    const audio = new Audio(src);
    
    audio.onerror = () => {
        console.error(`Nie można załadować pliku dźwiękowego: ${src}`);
    };
    
    return audio;
}