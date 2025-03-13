// Inicjalizacja obsługi wejścia
function initResourceListeners() {
    const resourceImages = [
        { img: playerImage, name: "postać gracza" },
        { img: enemyImage, name: "zwykłego przeciwnika" },
        { img: specialEnemyImage, name: "specjalnego przeciwnika" },
        { img: heartImage, name: "serduszka" },
        { img: backgroundFar, name: "tła" }
    ];
    
    // Dodaj listenery do wszystkich obrazów
    for (const res of resourceImages) {
        res.img.onload = () => console.log(`Obrazek ${res.name} załadowany!`);
        res.img.onerror = () => console.error(`Błąd ładowania obrazka ${res.name}!`);
    }
    
    // Obsługa błędów ładowania muzyki
    bgMusic.onerror = function() {
        console.error("Nie można załadować pliku muzyki!");
    };
}

// Główna pętla gry
function gameLoop() {
    // Rysowanie tła
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
        } else {
            // Zatrzymanie muzyki przy Game Over
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
        
        drawPlayer();
        drawEnemies();
        drawCountdown();
        drawUI();
    }
    
    requestAnimationFrame(gameLoop);
}

// Flaga zapobiegająca wielokrotnemu inicjowaniu gry
let gameInitialized = false;

// Uruchomienie gry
function initGame() {
    if (gameInitialized) return; // Zapobiegaj podwójnej inicjalizacji
    
    console.log("Inicjalizacja gry...");
    gameInitialized = true;
    setupInputHandlers();
    initResourceListeners();
    gameLoop();
}

// Uruchom grę po załadowaniu wszystkich zasobów
window.addEventListener('load', function() {
    initGame();
});

// Usuwamy to wywołanie, które może powodować podwójną inicjalizację
// if (playerImage.complete) {
//     console.log("Obrazek gracza już załadowany, inicjalizacja gry...");
//     window.addEventListener('DOMContentLoaded', initGame);
// }