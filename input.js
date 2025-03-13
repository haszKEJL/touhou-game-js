// Obsługa klawiatury - nie deklarujemy ponownie keys, używamy istniejącej zmiennej
function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        if (e.key in keys) {
            keys[e.key] = true;
            
            // Start gry po naciśnięciu Enter na ekranie startowym
            if (e.key === 'Enter' && !gameStarted && !gameOver) {
                resetGame(); // Używamy resetGame zamiast startGame
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
}

// Eksportujemy funkcję do globalnego zakresu, aby była dostępna w main.js
window.setupInputHandlers = setupInputHandlers;