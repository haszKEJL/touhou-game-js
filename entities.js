// Gracz
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30,
    height: 40,
    speed: 5,
    focusSpeed: 2,
    color: '#33ccff',
    bullets: [],
    shooting: false,
    shootCooldown: 0,
    maxShootCooldown: 10,
    image: playerImage,
    focusing: false,
    invincible: false,
    invincibleTimer: 0,
    maxInvincibleTime: 120
};

// Tablice dla przeciwników i pocisków
const enemies = [];
const enemyBullets = [];