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

// System formacji przeciwników

// Wybiera losową formację inną niż poprzednia
function selectRandomFormation() {
    const formationTypes = Object.values(FORMATIONS);
    let newFormation;
    
    do {
        newFormation = formationTypes[Math.floor(Math.random() * formationTypes.length)];
    } while (newFormation === currentFormation && formationTypes.length > 1);
    
    currentFormation = newFormation;
    
    // Bazowa liczba przeciwników w formacji (może być modyfikowana w inicjalizacji formacji)
    formationEnemiesLeft = 5; // Domyślnie 5 przeciwników
    
    switch(currentFormation) {
        case FORMATIONS.LINE:
            initLineFormation();
            break;
        case FORMATIONS.V_SHAPE:
            initVShapeFormation();
            break;
        case FORMATIONS.DIAMOND:
            initDiamondFormation();
            break;
        case FORMATIONS.SIDES:
            initSidesFormation();
            break;
        case FORMATIONS.ARC:
            initArcFormation();
            break;
        default:
            // Formacja domyślna
            initLineFormation();
    }
    
    formationActive = true;
    console.log(`Nowa formacja: ${Object.keys(FORMATIONS)[currentFormation]}`);
}

// Formacja liniowa - przeciwnicy w jednej linii poziomej
function initLineFormation() {
    formationEnemiesLeft = 5;
    const baseY = -30; // Początkowa pozycja Y (nad ekranem)
    // Pozycje ustalane są równomiernie na szerokości ekranu
    const spacing = canvas.width / (formationEnemiesLeft + 1);
    
    // Harmonogram wejścia - tworzymy przeciwników co 15 klatek
    for (let i = 0; i < formationEnemiesLeft; i++) {
        setTimeout(() => {
            const isSpecial = Math.random() < 0.15;
            const x = spacing * (i + 1) - 15; // Centrowanie przeciwnika
            
            const enemy = {
                x: x,
                y: baseY,
                width: isSpecial ? 40 : 30,
                height: isSpecial ? 40 : 30,
                speed: 1.2, // Szybsza formacja
                color: isSpecial ? '#ff6600' : '#ff3366',
                shootCooldown: 60 + i * 20, // Rozłóż czas strzałów
                maxShootCooldown: isSpecial ? 120 : 180,
                special: isSpecial,
                image: isSpecial ? specialEnemyImage : enemyImage,
                health: isSpecial ? 3 : 1,
                // Formacja liniowa porusza się w dół do pewnego punktu
                // a następnie zatrzymuje się i strzela
                movementPattern: 'lineStop',
                targetY: 100 + Math.random() * 50, // Cel zatrzymania
                formationIndex: i // Indeks w formacji
            };
            
            enemies.push(enemy);
        }, i * 15); // 15 klatek opóźnienia między każdym przeciwnikiem
    }
}

// Formacja V - przeciwnicy w kształcie litery V
function initVShapeFormation() {
    formationEnemiesLeft = 5;
    const baseY = -30;
    const centerX = canvas.width / 2;
    const spacing = 50;
    
    for (let i = 0; i < formationEnemiesLeft; i++) {
        setTimeout(() => {
            const isSpecial = i === 2; // Środkowy jest specjalny
            
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
            
            const enemy = {
                x: centerX + xOffset - (isSpecial ? 20 : 15), // Centrowanie względem szerokości przeciwnika
                y: baseY + Math.abs(xOffset) / 2, // Im dalej od środka, tym niżej
                width: isSpecial ? 40 : 30,
                height: isSpecial ? 40 : 30,
                speed: 1,
                color: isSpecial ? '#ff6600' : '#ff3366',
                shootCooldown: 60 + i * 30,
                maxShootCooldown: isSpecial ? 100 : 150,
                special: isSpecial,
                image: isSpecial ? specialEnemyImage : enemyImage,
                health: isSpecial ? 3 : 1,
                // V-kształtna formacja porusza się w dół i wykonuje lekkie ruchy falowe
                movementPattern: 'vWave',
                initialX: centerX + xOffset - 15,
                waveAmplitude: 20,
                waveFrequency: 0.02,
                targetY: 120,
                formationIndex: i
            };
            
            enemies.push(enemy);
        }, i * 20);
    }
}

// Formacja diamentu/rombu
function initDiamondFormation() {
    formationEnemiesLeft = 5;
    const baseY = -30;
    const centerX = canvas.width / 2;
    const spacing = 40;
    
    // Pozycje w formacji diamentu
    const positions = [
        { x: centerX, y: baseY }, // góra
        { x: centerX - spacing, y: baseY + spacing }, // lewy środek
        { x: centerX + spacing, y: baseY + spacing }, // prawy środek
        { x: centerX - spacing/2, y: baseY + spacing*2 }, // lewy dół
        { x: centerX + spacing/2, y: baseY + spacing*2 }  // prawy dół
    ];
    
    for (let i = 0; i < formationEnemiesLeft; i++) {
        setTimeout(() => {
            const isSpecial = i === 0; // Górny jest specjalny
            
            const enemy = {
                x: positions[i].x - (isSpecial ? 20 : 15), // Centrowanie
                y: positions[i].y,
                width: isSpecial ? 40 : 30,
                height: isSpecial ? 40 : 30,
                speed: 1.1,
                color: isSpecial ? '#ff6600' : '#ff3366',
                shootCooldown: 80 + i * 15,
                maxShootCooldown: isSpecial ? 110 : 140,
                special: isSpecial,
                image: isSpecial ? specialEnemyImage : enemyImage,
                health: isSpecial ? 3 : 1,
                // Diament porusza się w dół, a potem wykonuje ruch rozpraszający
                movementPattern: 'diamond',
                targetY: 100,
                formationIndex: i,
                disperseAfter: 180 // Rozproszenie po 3 sekundach
            };
            
            enemies.push(enemy);
        }, i * 25);
    }
}

// Dwie grupy przeciwników po bokach ekranu
function initSidesFormation() {
    formationEnemiesLeft = 6; // 3 po każdej stronie
    const baseY = -30;
    const leftX = 50;
    const rightX = canvas.width - 80;
    const verticalSpacing = 40;
    
    for (let i = 0; i < formationEnemiesLeft; i++) {
        setTimeout(() => {
            const isLeftSide = i < 3;
            const isSpecial = i === 2 || i === 5; // Ostatni w każdej grupie jest specjalny
            
            const enemy = {
                x: isLeftSide ? leftX : rightX,
                y: baseY + (i % 3) * verticalSpacing,
                width: isSpecial ? 40 : 30,
                height: isSpecial ? 40 : 30,
                speed: 1,
                color: isSpecial ? '#ff6600' : '#ff3366',
                shootCooldown: 60 + (i % 3) * 40,
                maxShootCooldown: isSpecial ? 100 : 130,
                special: isSpecial,
                image: isSpecial ? specialEnemyImage : enemyImage,
                health: isSpecial ? 3 : 1,
                // Grupy poruszają się w dół i lekko do środka
                movementPattern: 'sides',
                initialX: isLeftSide ? leftX : rightX,
                moveInwards: isLeftSide ? 1 : -1, // Kierunek ruchu do środka
                targetY: 100 + (i % 3) * 30,
                formationIndex: i
            };
            
            enemies.push(enemy);
        }, i * 20);
    }
}

// Formacja łukowa/półkole
function initArcFormation() {
    formationEnemiesLeft = 7;
    const baseY = -30;
    const centerX = canvas.width / 2;
    const radius = 100;
    
    for (let i = 0; i < formationEnemiesLeft; i++) {
        setTimeout(() => {
            // Rozmieszczenie przeciwników w łuku
            const angle = Math.PI * (0.2 + 0.6 * (i / (formationEnemiesLeft - 1))); // Od 0.2π do 0.8π
            const isSpecial = i === 3; // Środkowy jest specjalny
            
            const enemy = {
                x: centerX + Math.cos(angle) * radius - (isSpecial ? 20 : 15),
                y: baseY + Math.sin(angle) * radius/2,
                width: isSpecial ? 40 : 30,
                height: isSpecial ? 40 : 30,
                speed: 0.9,
                color: isSpecial ? '#ff6600' : '#ff3366',
                shootCooldown: 70 + i * 25,
                maxShootCooldown: isSpecial ? 90 : 120,
                special: isSpecial,
                image: isSpecial ? specialEnemyImage : enemyImage,
                health: isSpecial ? 3 : 1,
                // Łuk porusza się w dół a następnie każdy przeciwnik strzela w gracza
                movementPattern: 'arc',
                targetY: 110,
                angle: angle,
                formationIndex: i
            };
            
            enemies.push(enemy);
        }, i * 15);
    }
}

// Funkcja tworząca pojedynczego przeciwnika (dla przypadkowych spawni między formacjami)
function createRandomEnemy() {
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
        health: isSpecial ? 3 : 1,
        movementPattern: 'random' // Domyślny wzór ruchu
    };
    enemies.push(enemy);
}