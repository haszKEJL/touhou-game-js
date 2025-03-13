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
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    z: false,
    Enter: false,
    Shift: false,
    q: false,
    w: false
};