// Konfiguracja gry
export const CONFIG = {
    // Ustawienia gracza
    player: {
        speed: 2,
        focusSpeed: 1,
        maxShootCooldown: 10,
        maxInvincibleTime: 120,
        startLives: 3
    },
    // Ustawienia przeciwników
    enemies: {
        specialChance: 0.15,
        normalSpeed: { min: 0.5, max: 1.5 },
        specialSpeed: { min: 0.5, max: 1.2 },
        normalHealth: 1,
        specialHealth: 3,
        normalShootCooldown: 100,
        specialShootCooldown: 150
    },
    // Formacje
    formations: {
        cooldown: 120,
        types: {
            LINE: 0,
            V_SHAPE: 1,
            DIAMOND: 2,
            SIDES: 3,
            ARC: 4
        }
    },
    // Boss
    boss: {
        appearTime: 3600 * 2, // 2 minuty przy 60fps
        health: 50,
        width: 150,
        height: 150,
        shootCooldown: 60
    },
    // Audio
    audio: {
        defaultVolume: 0.05
    },
    // Wartości domyślne
    defaults: {
        bulletSpeed: 7,
        enemyBulletSpeed: 2,
        specialEnemyBulletSpeed: 2.5
    }
};