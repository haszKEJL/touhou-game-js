import { CONFIG } from './config.js';
import { IMAGES } from './assets.js';

// Klasa gracza
export class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 30;
        this.height = 40;
        this.reset();
    }
    
    reset() {
        this.x = this.canvas.width / 2 - this.width / 2;
        this.y = this.canvas.height - 100;
        this.speed = CONFIG.player.speed;
        this.focusSpeed = CONFIG.player.focusSpeed;
        this.color = '#33ccff';
        this.bullets = [];
        this.shootCooldown = 0;
        this.maxShootCooldown = CONFIG.player.maxShootCooldown;
        this.focusing = false;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.maxInvincibleTime = CONFIG.player.maxInvincibleTime;
    }
    
    update(keys) {
        // Aktualizacja stanu trybu skupienia
        this.focusing = keys.Shift;
        
        // Ustal prędkość zależną od trybu skupienia
        const currentSpeed = this.focusing ? this.focusSpeed : this.speed;
        
        // Ruch gracza
        if (keys.ArrowLeft && this.x > 0) {
            this.x -= currentSpeed;
        }
        if (keys.ArrowRight && this.x < this.canvas.width - this.width) {
            this.x += currentSpeed;
        }
        if (keys.ArrowUp && this.y > 0) {
            this.y -= currentSpeed;
        }
        if (keys.ArrowDown && this.y < this.canvas.height - this.height) {
            this.y += currentSpeed;
        }
        
        // Strzelanie
        if (keys.z && this.shootCooldown === 0) {
            this.shoot();
        }
        
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        // Aktualizacja pocisków gracza
        this.updateBullets();
        
        // Aktualizacja stanu nieśmiertelności
        if (this.invincible) {
            this.invincibleTimer++;
            if (this.invincibleTimer >= this.maxInvincibleTime) {
                this.invincible = false;
                this.invincibleTimer = 0;
            }
        }
    }
    
    shoot() {
        this.bullets.push(this.createBullet(this.x + this.width / 2 - 2, this.y, -1));
        this.shootCooldown = this.maxShootCooldown;
    }
    
    createBullet(x, y, directionY = -1) {
        return {
            x: x,
            y: y,
            width: 4,
            height: 16,
            speed: CONFIG.defaults.bulletSpeed,
            directionY: directionY,
            color: '#66ffff',
        };
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y += bullet.speed * bullet.directionY;
            
            // Usuwanie pocisków poza ekranem
            if (bullet.y + bullet.height < 0) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        // Miganie podczas nieśmiertelności
        if (this.invincible && Math.floor(this.invincibleTimer / 10) % 2 === 0) {
            return;
        }
        
        // Rysowanie gracza
        if (IMAGES.player) {
            ctx.drawImage(IMAGES.player, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Rysowanie punktu skupienia (hitbox)
        if (this.focusing) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Rysowanie pocisków gracza
        for (const bullet of this.bullets) {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
    
    getHitbox() {
        // Zwraca mniejszy hitbox dla punktu skupienia, gdy gracz jest w trybie skupienia
        if (this.focusing) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const hitboxSize = 5;
            return {
                x: centerX - hitboxSize / 2,
                y: centerY - hitboxSize / 2,
                width: hitboxSize,
                height: hitboxSize
            };
        } else {
            // Zwraca normalny hitbox
            return {
                x: this.x + this.width * 0.25,
                y: this.y + this.height * 0.25,
                width: this.width * 0.5,
                height: this.height * 0.5
            };
        }
    }
}

// Klasa przeciwnika
export class Enemy {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        
        // Podstawowe właściwości
        this.width = options.width || 30;
        this.height = options.height || 30;
        this.x = options.x !== undefined ? options.x : Math.random() * (canvas.width - this.width);
        this.y = options.y !== undefined ? options.y : -this.height;
        this.speed = options.speed || 1;
        this.health = options.health || (options.special ? 3 : 1);
        this.special = options.special || false;
        this.isBoss = options.isBoss || false;
        this.formationIndex = options.formationIndex !== undefined ? options.formationIndex : -1;
        
        // Właściwości ruchu
        this.movementType = options.movementType || 'straight';
        this.targetX = options.targetX;
        this.targetY = options.targetY || 100;
        this.moveParameters = options.moveParameters || {};
        this.moveTimer = 0;
        this.startPosition = { x: this.x, y: this.y };
        
        // Właściwości strzelania
        this.shootCooldown = 0;
        this.maxShootCooldown = options.maxShootCooldown || 
            (this.special ? CONFIG.enemies.specialShootCooldown : CONFIG.enemies.normalShootCooldown);
        this.bulletPattern = options.bulletPattern || 'default';
    }
    
    update(player) {
        this.moveTimer++;
        
        // Zastosuj wzorzec ruchu
        this.applyMovement();
        
        // Aktualizacja timera strzału
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        return this.isOffscreen();
    }
    
    applyMovement() {
        switch (this.movementType) {
            case 'straight':
                this.y += this.speed;
                break;
                
            case 'hover':
                if (this.y < this.targetY) {
                    this.y += this.speed;
                } else if (this.moveParameters && this.moveParameters.moveInwards) {
                    this.x += this.moveParameters.moveInwards * 0.3;
                }
                break;
                
            case 'sine':
                this.y += this.speed;
                if (this.moveParameters) {
                    const baseX = this.moveParameters.baseX || this.startPosition.x;
                    const amplitude = this.moveParameters.amplitude || 50;
                    const frequency = this.moveParameters.frequency || 0.02;
                    this.x = baseX + Math.sin(this.moveTimer * frequency) * amplitude;
                }
                break;
                
            case 'circle':
                if (this.moveParameters) {
                    const centerX = this.moveParameters.centerX || this.canvas.width / 2;
                    const centerY = this.moveParameters.centerY || 100;
                    const radius = this.moveParameters.radius || 100;
                    const angularSpeed = this.moveParameters.angularSpeed || 0.02;
                    
                    this.x = centerX + Math.cos(this.moveTimer * angularSpeed) * radius - this.width / 2;
                    this.y = centerY + Math.sin(this.moveTimer * angularSpeed) * radius - this.height / 2;
                }
                break;
                
            case 'boss':
                this.applyBossMovement();
                break;
        }
    }
    
    applyBossMovement() {
        const phase = Math.floor(this.moveTimer / 180) % 4;
        
        if (this.moveTimer < 120) {
            // Wejście bossa
            this.y += this.speed;
        } else {
            switch (phase) {
                case 0: // Ruch w lewo-prawo
                    this.x = this.canvas.width/2 - this.width/2 + Math.sin(this.moveTimer * 0.02) * 150;
                    break;
                    
                case 1: // Ruch po okręgu
                    const centerX = this.canvas.width / 2;
                    const centerY = 120;
                    const radius = 80;
                    const angle = (this.moveTimer % 180) * 0.035;
                    
                    this.x = centerX + Math.cos(angle) * radius - this.width/2;
                    this.y = centerY + Math.sin(angle) * radius - this.height/2;
                    break;
                    
                case 2: // Agresywne ataki
                    if (this.moveTimer % 180 < 90) {
                        this.x -= 3;
                    } else {
                        this.x += 3;
                    }
                    
                    // Ograniczenie ruchu
                    if (this.x < 10) this.x = 10;
                    if (this.x > this.canvas.width - this.width - 10) this.x = this.canvas.width - this.width - 10;
                    break;
                    
                case 3: // Losowe drgania
                    if (this.moveTimer % 15 === 0) {
                        this.x += (Math.random() - 0.5) * 30;
                        this.y += (Math.random() - 0.5) * 10;
                        
                        // Ograniczenie ruchu
                        this.x = Math.max(10, Math.min(this.canvas.width - this.width - 10, this.x));
                        this.y = Math.max(10, Math.min(150, this.y));
                    }
                    break;
            }
        }
    }
    
    readyToShoot() {
        return this.shootCooldown <= 0;
    }
    
    resetShootCooldown() {
        this.shootCooldown = this.maxShootCooldown;
    }
    
    isOffscreen() {
        const margin = 50; // Margines, aby przeciwnicy byli na pewno poza ekranem
        return (
            this.y > this.canvas.height + margin ||
            this.x < -this.width - margin ||
            this.x > this.canvas.width + margin
        );
    }
    
    canShoot() {
        return this.shootCooldown <= 0;
    }
    
    draw(ctx) {
        const image = this.special ? IMAGES.specialEnemy : IMAGES.enemy;
        
        if (image && image.complete) {
            ctx.drawImage(image, this.x, this.y, this.width, this.height);
            
            // Pasek zdrowia dla specjalnych przeciwników i bossa
            if ((this.special || this.isBoss) && this.health > 1) {
                this.drawHealthBar(ctx);
            }
        } else {
            // Awaryjny kolorowy prostokąt
            ctx.fillStyle = this.special ? '#ff6600' : '#ff3366';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    drawHealthBar(ctx) {
        const healthBarWidth = this.width;
        const healthBarHeight = this.isBoss ? 8 : 4;
        const maxHealth = this.isBoss ? CONFIG.boss.health : CONFIG.enemies.specialHealth;
        const healthPercent = this.health / maxHealth;
        
        // Tło
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x, this.y - healthBarHeight - 2, healthBarWidth, healthBarHeight);
        
        // Pasek zdrowia
        const barColor = this.isBoss ? '#ff3333' : '#00ff00';
        ctx.fillStyle = barColor;
        ctx.fillRect(this.x, this.y - healthBarHeight - 2, healthBarWidth * healthPercent, healthBarHeight);
    }
}

// Klasa pocisku przeciwnika
export class EnemyBullet {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.radius = options.radius || 4;
        this.speedX = options.speedX || 0;
        this.speedY = options.speedY || 3;
        this.color = options.color || '#ffff00';
        this.type = options.type || 'normal';
        this.angle = options.angle || 0;
        this.speed = options.speed || Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        this.acceleration = options.acceleration || 0;
        this.homing = options.homing || false;
        this.homingStrength = options.homingStrength || 0.02;
        this.target = options.target || null;
        this.lifespan = options.lifespan || 600; // 10 sekund przy 60fps
    }
    
    update() {
        // Zastosuj przyspieszenie
        if (this.acceleration !== 0) {
            this.speed += this.acceleration;
            this.speedX = Math.cos(this.angle) * this.speed;
            this.speedY = Math.sin(this.angle) * this.speed;
        }
        
        // Zastosuj naprowadzanie
        if (this.homing && this.target) {
            const dx = this.target.x + this.target.width/2 - this.x;
            const dy = this.target.y + this.target.height/2 - this.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // Stopniowe dostosowywanie kąta do celu
            const angleDiff = targetAngle - this.angle;
            
            // Normalizacja różnicy kątów do [-π, π]
            let normalizedDiff = angleDiff;
            while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
            while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
            
            this.angle += normalizedDiff * this.homingStrength;
            
            // Aktualizacja składowych prędkości
            this.speedX = Math.cos(this.angle) * this.speed;
            this.speedY = Math.sin(this.angle) * this.speed;
        }
        
        // Aktualizacja pozycji
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Zmniejszanie czasu życia
        this.lifespan--;
        
        return this.lifespan <= 0;
    }
    
    isOffscreen(canvas) {
        const margin = this.radius * 2;
        return (
            this.y > canvas.height + margin ||
            this.y < -margin ||
            this.x > canvas.width + margin ||
            this.x < -margin
        );
    }
    
    draw(ctx) {
        ctx.beginPath();
        
        if (this.type === 'normal') {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } 
        else if (this.type === 'laser') {
            // Rysowanie lasera
            const length = this.radius * 4;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            // Promień lasera
            const gradient = ctx.createLinearGradient(-length/2, 0, length/2, 0);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
            gradient.addColorStop(0.5, 'rgba(255, 200, 0, 1)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-length/2, -2, length, 4);
            
            ctx.restore();
        }
        else if (this.type === 'star') {
            // Rysowanie pocisku w kształcie gwiazdy
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            const spikes = 5;
            const outerRadius = this.radius;
            const innerRadius = this.radius / 2;
            
            let rot = Math.PI / 2 * 3;
            const step = Math.PI / spikes;
            
            ctx.beginPath();
            ctx.moveTo(0, -outerRadius);
            
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
                rot += step;
                
                ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
                rot += step;
            }
            
            ctx.lineTo(0, -outerRadius);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            
            ctx.restore();
        }
        else {
            // Domyślny okrąg
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        ctx.closePath();
    }
}

// Fabryka jednostek
export class EntityFactory {
    constructor(canvas) {
        this.canvas = canvas;
    }
    
    createEnemy(options = {}) {
        // Ustaw domyślne opcje
        const defaults = {
            special: Math.random() < CONFIG.enemies.specialChance,
            width: 30,
            height: 30,
            health: 1,
            speed: 1
        };
        
        // Połącz domyślne opcje z podanymi
        const enemyOptions = { ...defaults, ...options };
        
        // Ustaw odpowiednią wartość dla szerokości, wysokości i zdrowia, jeśli przeciwnik jest specjalny
        if (enemyOptions.special) {
            enemyOptions.width = 40;
            enemyOptions.height = 40;
            enemyOptions.health = CONFIG.enemies.specialHealth;
        }
        
        return new Enemy(this.canvas, enemyOptions);
    }
    
    createBoss() {
        return new Enemy(this.canvas, {
            isBoss: true,
            special: true,
            width: CONFIG.boss.width,
            height: CONFIG.boss.height,
            health: CONFIG.boss.health,
            x: this.canvas.width / 2 - CONFIG.boss.width / 2,
            y: -CONFIG.boss.height,
            speed: 2,
            movementType: 'boss',
            maxShootCooldown: CONFIG.boss.shootCooldown,
            bulletPattern: 'boss'
        });
    }
    
    createEnemyBullet(enemy, player, patternType = 'default') {
        // Jeśli nie podano wzorca, użyj wzorca przeciwnika lub domyślnego
        const pattern = patternType || enemy.bulletPattern || 'default';
        const bullets = [];
        
        // Środek przeciwnika
        const sourceX = enemy.x + enemy.width / 2;
        const sourceY = enemy.y + enemy.height / 2;
        
        // Wzorce bossa są obsługiwane osobno
        if (enemy.isBoss) {
            return this.createBossBullets(enemy, player);
        }
        
        switch (pattern) {
            case 'aimed': {
                // Pojedynczy pocisk skierowany na gracza
                if (!player) {
                    bullets.push(new EnemyBullet(sourceX, sourceY, {
                        speedY: enemy.special ? 2.5 : 2,
                        color: enemy.special ? '#ff9900' : '#ffff00',
                        radius: enemy.special ? 6 : 4
                    }));
                    return bullets;
                }
                
                const targetX = player.x + player.width / 2;
                const targetY = player.y + player.height / 2;
                const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
                const speed = enemy.special ? 3 : 2;
                
                bullets.push(new EnemyBullet(sourceX, sourceY, {
                    speedX: Math.cos(angle) * speed,
                    speedY: Math.sin(angle) * speed,
                    color: enemy.special ? '#ff9900' : '#ffff00',
                    radius: enemy.special ? 6 : 4
                }));
                break;
            }
            
            case 'spread': {
                // Wiele pocisków w rozproszonym wzorcu
                const baseAngle = player ? Math.atan2(
                    (player.y + player.height / 2) - sourceY, 
                    (player.x + player.width / 2) - sourceX
                ) : Math.PI / 2; // Domyślnie w dół, jeśli nie ma gracza
                
                const spread = 0.4; // Około 22 stopni
                const bulletCount = enemy.special ? 5 : 3;
                const speed = enemy.special ? 2.5 : 2;
                
                for (let i = 0; i < bulletCount; i++) {
                    const angle = baseAngle + spread * (i - (bulletCount - 1) / 2);
                    bullets.push(new EnemyBullet(sourceX, sourceY, {
                        speedX: Math.cos(angle) * speed,
                        speedY: Math.sin(angle) * speed,
                        color: enemy.special ? '#ff9900' : '#ffff00',
                        radius: 4,
                        angle: angle
                    }));
                }
                break;
            }
            
            case 'circle': {
                // Pociski w kształcie koła
                const bulletCount = enemy.special ? 8 : 6;
                const speed = enemy.special ? 2 : 1.5;
                
                for (let i = 0; i < bulletCount; i++) {
                    const angle = (Math.PI * 2 * i) / bulletCount;
                    bullets.push(new EnemyBullet(sourceX, sourceY, {
                        speedX: Math.cos(angle) * speed,
                        speedY: Math.sin(angle) * speed,
                        color: enemy.special ? '#ffaa33' : '#ffff66',
                        radius: 4,
                        angle: angle
                    }));
                }
                break;
            }
            
            default: {
                // Prosty pojedynczy pocisk lecący w dół
                bullets.push(new EnemyBullet(sourceX, sourceY + enemy.height/2, {
                    speedY: enemy.special ? 2.5 : 2,
                    color: enemy.special ? '#ff9900' : '#ffff00',
                    radius: enemy.special ? 5 : 4
                }));
            }
        }
        
        return bullets;
    }
    
    createBossBullets(boss, player) {
        const bullets = [];
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        // Różne wzorce w zależności od fazy ruchu bossa
        const phase = Math.floor(boss.moveTimer / 180) % 4;
        
        switch(phase) {
            case 0: // Gęsty wzorzec radialny
                {
                    const bulletCount = 12;
                    const baseAngle = boss.moveTimer * 0.05;
                    
                    for (let i = 0; i < bulletCount; i++) {
                        const angle = baseAngle + (Math.PI * 2 * i) / bulletCount;
                        bullets.push(new EnemyBullet(centerX, centerY, {
                            speedX: Math.cos(angle) * 2,
                            speedY: Math.sin(angle) * 2,
                            color: '#ff3333',
                            radius: 5,
                            angle: angle
                        }));
                    }
                }
                break;
                
            case 1: // Skierowane wielokrotne strzały
                if (player) {
                    const targetX = player.x + player.width / 2;
                    const targetY = player.y + player.height / 2;
                    const baseAngle = Math.atan2(targetY - centerY, targetX - centerX);
                    const bulletCount = 5;
                    const spread = 0.2;
                    
                    for (let i = 0; i < bulletCount; i++) {
                        const angle = baseAngle + spread * (i - (bulletCount - 1) / 2);
                        bullets.push(new EnemyBullet(centerX, centerY, {
                            speedX: Math.cos(angle) * 3,
                            speedY: Math.sin(angle) * 3,
                            color: '#ff6600',
                            radius: 6,
                            angle: angle
                        }));
                    }
                }
                break;
                
            case 2: // Spiralny wzorzec
                {
                    const spiralCount = 3;
                    const angle = boss.moveTimer * 0.08;
                    
                    for (let i = 0; i < spiralCount; i++) {
                        const spiralAngle = angle + (Math.PI * 2 * i) / spiralCount;
                        bullets.push(new EnemyBullet(centerX, centerY, {
                            speedX: Math.cos(spiralAngle) * 2,
                            speedY: Math.sin(spiralAngle) * 2,
                            color: '#cc33ff',
                            radius: 5,
                            angle: spiralAngle,
                            type: 'star'
                        }));
                    }
                }
                break;
                
            case 3: // Losowy bullet hell
                {
                    for (let i = 0; i < 5; i++) {
                        const randomAngle = Math.random() * Math.PI * 2;
                        const randomSpeed = 1 + Math.random() * 2;
                        
                        bullets.push(new EnemyBullet(centerX, centerY, {
                            speedX: Math.cos(randomAngle) * randomSpeed,
                            speedY: Math.sin(randomAngle) * randomSpeed,
                            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                            radius: 3 + Math.random() * 3,
                            angle: randomAngle
                        }));
                    }
                }
                break;
        }
        
        return bullets;
    }
}