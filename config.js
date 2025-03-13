// Konfiguracja gry
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Zmienne globalne
let score = 0;
let gameOver = false;
let gameStarted = false;
let gameTimer = 0;
let enemiesEnabled = false;
let musicVolume = 0.05; // Domyślna głośność (5%)
let stageNameVisible = false;
let stageNameTimer = 0;
let lives = 3; // Liczba żyć gracza

let bossTimer = 0;
const bossAppearTime = 3600*2; // Boss pojawia się po 60 sekundach (3600 klatek przy 60fps)
let bossActive = false; // Flaga wskazująca, czy boss jest aktywny

const FORMATIONS = {
    // Formacja liniowa pozioma
    LINE: 0,
    // Formacja w kształcie litery V
    V_SHAPE: 1,
    // Formacja w kształcie diamentu/rombu
    DIAMOND: 2,
    // Dwie grupy po bokach ekranu
    SIDES: 3,
    // Formacja w kształcie półkola/łuku
    ARC: 4
};

// Zmienna kontrolująca aktualnie aktywną formację
let currentFormation = -1; // -1 oznacza, że nie ma aktywnej formacji
let formationEnemiesLeft = 0; // Licznik przeciwników pozostałych do utworzenia w formacji
let formationCooldown = 180; // Cooldown między formacjami (3 sekundy przy 60fps)
let formationActive = false; // Czy formacja jest aktualnie aktywna

// Ładowanie obrazków
const playerImage = new Image();
playerImage.src = 'player.png';

const enemyImage = new Image();
enemyImage.src = 'enemie.png';

const specialEnemyImage = new Image();
specialEnemyImage.src = 'mid-boss.png';

const heartImage = new Image();
heartImage.src = 'heart.png';

// Ładowanie obrazków tła
const backgroundFar = new Image();
backgroundFar.src = 'background-far.jpg';

const backgrounds = [
    { img: backgroundFar, x: 0, speed: 0.2, width: 1200 },
];

// Ładowanie muzyki w tle
const bgMusic = new Audio('music_stage1.mp3');
bgMusic.loop = true;
bgMusic.volume = musicVolume;

// Flagi kontroli klawiatury
let keys = {
    'ArrowUp': false,
    'ArrowDown': false,
    'ArrowLeft': false,
    'ArrowRight': false,
    'z': false,
    'x': false,
    'Shift': false,
    'Enter': false,
    'q': false,
    'w': false
};