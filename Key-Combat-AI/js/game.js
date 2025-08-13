/*
 * Main game script for Key Combat AI.
 *
 * This file defines core game classes, handles input, and runs the main loop.
 * The code is intentionally simple and modular so that new content can be added
 * via the data scripts without modifying logic here.
 */

// ----- Data from data scripts -----
// The following global variables are expected to be defined by the files in the
// `data` folder: `charactersData`, `enemiesData`, `roomsData`, `boonsData`.

// Get canvas and drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game states enumeration
const GAME_STATES = {
    MENU: 'menu',
    MAP: 'map',
    COMBAT: 'combat'
};

// Current game state
let currentState = GAME_STATES.MENU;

// Class representing a hero card
class Hero {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // 'Attack' or 'Support'
        this.baseHP = data.baseHP;
        this.baseAttack = data.baseAttack;
        this.passive = data.passive;
        this.key = data.key.toLowerCase();
        this.ultChargeNeeded = data.ultChargeNeeded;
        this.ultEffect = data.ultEffect;
        this.level = 1;
        this.currentHP = this.baseHP;
        this.ultMeter = 0;
    }

    attack(target) {
        // Deal damage equal to baseAttack (scaled by level) and increment ult meter
        const damage = this.baseAttack * this.level;
        target.takeDamage(damage);
        this.ultMeter++;
    }

    tryUlt(target, chargePercent = 1.0) {
        // Only perform ultimate if meter full
        if (this.ultMeter >= this.ultChargeNeeded) {
            // Example ultimate: deal double base damage scaled by charge percent
            const damage = (this.baseAttack * 2) * this.level * chargePercent;
            target.takeDamage(damage);
            this.ultMeter = 0;
        }
    }

    takeDamage(amount) {
        this.currentHP -= amount;
        if (this.currentHP < 0) this.currentHP = 0;
    }
}

// Class representing an enemy
class Enemy {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.hp = data.hp;
        this.attackPower = data.attackPower;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }

    isAlive() {
        return this.hp > 0;
    }
}

// Class representing a dungeon node
class Node {
    constructor(data) {
        this.id = data.id;
        this.type = data.type; // 'combat', 'elite', 'reward', etc.
        this.next = data.next || [];
    }
}

// Player party and current enemies
let playerHeroes = [];
let currentEnemies = [];

// Input state for rhythm combat
const keyState = {};
window.addEventListener('keydown', (e) => {
    keyState[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keyState[e.key.toLowerCase()] = false;
});

/**
 * Start a new run by selecting a party of heroes and initial enemies.
 */
function startNewRun() {
    // For demonstration, just take the first three heroes from the data
    playerHeroes = [];
    for (let i = 0; i < 3 && i < charactersData.length; i++) {
        playerHeroes.push(new Hero(charactersData[i]));
    }
    // Pick the first enemy as the opponent
    currentEnemies = [];
    if (enemiesData.length > 0) {
        currentEnemies.push(new Enemy(enemiesData[0]));
    }
    currentState = GAME_STATES.COMBAT;
}

/**
 * Update loop called every frame.
 * @param {number} dt Seconds since last frame
 */
function update(dt) {
    switch (currentState) {
        case GAME_STATES.MENU:
            // No update needed for static menu
            break;
        case GAME_STATES.MAP:
            // TODO: implement map logic
            break;
        case GAME_STATES.COMBAT:
            updateCombat(dt);
            break;
    }
}

/**
 * Draw loop called every frame.
 */
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch (currentState) {
        case GAME_STATES.MENU:
            drawMenu();
            break;
        case GAME_STATES.MAP:
            drawMap();
            break;
        case GAME_STATES.COMBAT:
            drawCombat();
            break;
    }
}

// ----- Combat logic -----
/**
 * Handle combat updates including rhythm inputs and checking for win/loss.
 * @param {number} dt Seconds since last frame
 */
function updateCombat(dt) {
    // On any hero key press, attack the first enemy
    for (const hero of playerHeroes) {
        if (keyState[hero.key]) {
            hero.attack(currentEnemies[0]);
            keyState[hero.key] = false; // Prevent continuous attacks while key is held
        }
    }
    // Example enemy behavior: enemies do not attack yet
    // Check if enemy is defeated
    if (currentEnemies.length > 0 && !currentEnemies[0].isAlive()) {
        // For now, end combat and go back to menu
        currentState = GAME_STATES.MENU;
    }
}

/**
 * Draw the combat scene including heroes, enemies, and prompts.
 */
function drawCombat() {
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Combat', 20, 30);
    if (currentEnemies.length > 0) {
        const enemy = currentEnemies[0];
        ctx.fillText(`Enemy: ${enemy.name} HP: ${enemy.hp}`, 20, 60);
    }
    // Draw heroes and their keys
    playerHeroes.forEach((hero, idx) => {
        const y = 120 + idx * 40;
        ctx.fillText(`${hero.name} (Key: ${hero.key.toUpperCase()}) HP: ${hero.currentHP}`, 20, y);
    });
    ctx.fillText('Press the corresponding key to attack.', 20, 120 + playerHeroes.length * 40 + 20);
}

// ----- Menu and map drawing functions -----
function drawMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Key Combat AI', 20, 100);
    ctx.font = '18px sans-serif';
    ctx.fillText('Press Enter to start a new run', 20, 140);
}

function drawMap() {
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Map screen (coming soon)', 20, 100);
}

// ----- Game loop -----
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize game on window load
window.onload = () => {
    // Start in the menu state
    currentState = GAME_STATES.MENU;
    // Listen for Enter key to begin a run
    window.addEventListener('keydown', (e) => {
        if (currentState === GAME_STATES.MENU && e.key === 'Enter') {
            startNewRun();
        }
    });
    requestAnimationFrame(gameLoop);
};