// Obsługa klawiatury
function setupInputHandlers() {
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
}