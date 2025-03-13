function createEnemy() {
    // Określamy typ przeciwnika - specjalny pojawia się rzadziej (15% szansy)
    const isSpecial = Math.random() < 0.15;
    
    const enemy = {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: isSpecial ? 40 : 30,
        height: isSpecial ? 40 : 30,
        speed: 0.5 + Math.random() * (isSpecial ? 0.7 : 1),
        color: isSpecial ? '#ff6600' : '#ff3366',
        shootCooldown: Math.floor(Math.random() * 100),
        maxShootCooldown: isSpecial ? 150 : 100,
        special: isSpecial,
        image: isSpecial ? specialEnemyImage : enemyImage,
        health: isSpecial ? 3 : 1
    };
    enemies.push(enemy);
}

function createEnemyBullet(enemy) {
    // Oblicz kierunek do gracza
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (enemy.special) {
        // Specjalny przeciwnik strzela 3 pociskami
        for (let i = -1; i <= 1; i++) {
            // Kąt 30 stopni to około 0.52 radiana
            const bulletAngle = angle + i * 0.52; // +/- 30 stopni
            
            const bullet = {
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height,
                radius: 5, // Nieco większy pocisk
                speed: 2.5,
                color: '#ffaa00', // Inny kolor dla pocisków specjalnego przeciwnika
                velocityX: Math.cos(bulletAngle) * 2.5,
                velocityY: Math.sin(bulletAngle) * 2.5,
                fromSpecial: true // Oznaczamy pociski specjalnego przeciwnika
            };
            enemyBullets.push(bullet);
        }
    } else {
        // Standardowy przeciwnik - pojedynczy pocisk
        const bullet = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            radius: 4,
            speed: 2,
            color: '#ffff00',
            velocityX: dx / distance * 2,
            velocityY: dy / distance * 2,
            fromSpecial: false
        };
        enemyBullets.push(bullet);
    }
}

function createPlayerBullet() {
    const bullet = {
        x: player.x + player.width / 2 - 2, // Wyśrodkowanie pocisku względem gracza
        y: player.y,
        width: 4,
        height: 10,
        speed: 7,
        color: '#00ffcc'
    };
    player.bullets.push(bullet);
}