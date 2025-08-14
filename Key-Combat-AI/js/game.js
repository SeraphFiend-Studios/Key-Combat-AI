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

// Resize canvas to fill the window and keep it updated on resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game states enumeration
const GAME_STATES = {
    MENU: 'menu',
    MAP: 'map',
    COMBAT: 'combat',
    CARD_REVEAL: 'card_reveal'
};

// Current game state
let currentState = GAME_STATES.MENU;

// Filter heroes that have art assets available
const availableHeroes = charactersData.filter((h) => h.image);

// Simple image cache for hero portraits
const imageCache = {};

// Current card reveal information
let currentReveal = null;

// Background image for card view
const cardViewBg = new Image();
cardViewBg.src = 'assets/images/background/Card View Background.png';

// ----- UI tuning constants -----
const UI = {
    PANEL_BG: 'rgba(0,0,0,0.45)',
    PANEL_RADIUS: 10,
    PANEL_PADDING: 12,
    PANEL_SHADOW: 'rgba(0,0,0,0.5)',
    GUTTER: 24,
    DIVIDER_ALPHA: 0.6
};

// Draw a rounded rectangle path
function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Simple word-wrap helper
function wrapText(ctx, text, maxWidth, lineHeight) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

// Minimal stat glyphs
function drawGlyph(type, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    switch (type) {
        case 'hp':
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.moveTo(0, size * 0.25);
            ctx.bezierCurveTo(size * 0.5, -size * 0.25, size, -size * 0.25, 0, size);
            ctx.bezierCurveTo(-size, -size * 0.25, -size * 0.5, -size * 0.25, 0, size * 0.25);
            ctx.fill();
            break;
        case 'atk':
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -size / 2);
            ctx.lineTo(0, size / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -size / 2);
            ctx.lineTo(size / 4, -size / 2 + size / 4);
            ctx.lineTo(-size / 4, -size / 2 + size / 4);
            ctx.closePath();
            ctx.fillStyle = '#f1c40f';
            ctx.fill();
            break;
        case 'ult':
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
                const x1 = Math.cos(angle) * size / 2;
                const y1 = Math.sin(angle) * size / 2;
                const angle2 = angle + Math.PI / 5;
                const x2 = Math.cos(angle2) * size / 4;
                const y2 = Math.sin(angle2) * size / 4;
                if (i === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            break;
    }
    ctx.restore();
}

// Level-up configuration. Each entry defines how much a stat increases per level.
// Stats not listed here (e.g., ultCharge) remain unchanged when leveling up.
const LEVEL_UP_INCREMENTS = {
    hp: 10,
    atk: 2
};

function getLeveledStats(data, level) {
    const hpInc = LEVEL_UP_INCREMENTS.hp || 0;
    const atkInc = LEVEL_UP_INCREMENTS.atk || 0;
    return {
        hp: data.baseHP + (level - 1) * hpInc,
        atk: data.baseAttack + (level - 1) * atkInc,
        ultCharge: data.ultChargeNeeded
    };
}

function applyLeveledStats(hero, data) {
    const stats = getLeveledStats(data, hero.level);
    hero.baseHP = stats.hp;
    hero.baseAttack = stats.atk;
    hero.ultChargeNeeded = stats.ultCharge;
    hero.currentHP = hero.baseHP;
}

/**
 * Draw a card image centered on the canvas with responsive scaling.
 * The image scales to fit within 80% of the canvas dimensions, preserving aspect ratio.
 * scaleMultiplier allows for simple animations (e.g., breathing effects).
 * @param {HTMLImageElement} img The image to draw.
 * @param {number} [scaleMultiplier=1] Additional scale factor for animation.
 * @param {number} [yOffset=0] Vertical offset in pixels.
 */
function drawCardImage(img, scaleMultiplier = 1, yOffset = 0) {
    const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
    const baseScale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const drawWidth = img.width * baseScale * scaleMultiplier;
    const drawHeight = img.height * baseScale * scaleMultiplier;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2 + yOffset;
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    return { x, y, width: drawWidth, height: drawHeight };
}

// Simple card frame to outline content
function drawCardFrame(x, y, width, height) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
}

// Draw a background image covering the canvas while preserving aspect ratio.
function drawBackground(img) {
    if (!img || !img.complete) return;
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

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
 * Persistent save data loaded from localStorage.
 * Contains the player's unlocked heroes, hero levels, and Demon Souls currency.
 */
let saveData;

/** Last gacha draw result. Used to display feedback in the menu. */
let lastGachaResult = null;

/**
 * Load save data from localStorage. If no valid save exists, returns default values.
 * @returns {object} The save data object.
 */
function loadSaveData() {
    try {
        const saved = JSON.parse(localStorage.getItem('kca_save'));
        if (saved && typeof saved === 'object') {
            saved.unlockedHeroes = saved.unlockedHeroes || [];
            saved.heroLevels = saved.heroLevels || {};
            saved.demonSouls = saved.demonSouls || 0;
            return saved;
        }
    } catch (e) {
        console.warn('Failed to load save data', e);
    }
    // Default save structure
    return { unlockedHeroes: [], heroLevels: {}, demonSouls: 0 };
}

/**
 * Save the current saveData object into localStorage.
 */
function saveGameData() {
    try {
        localStorage.setItem('kca_save', JSON.stringify(saveData));
    } catch (e) {
        console.warn('Failed to save game data', e);
    }
}

/**
 * Perform a gacha draw. Randomly selects a hero from the available pool.
 * Updates save data and prepares a card reveal object for display.
 */
function gachaDraw() {
    const index = Math.floor(Math.random() * availableHeroes.length);
    const heroData = availableHeroes[index];
    const heroId = heroData.id;
    const wasUnlocked = saveData.unlockedHeroes.includes(heroId);
    const oldLevel = saveData.heroLevels[heroId] || 0;

    const oldStats = getLeveledStats(heroData, Math.max(1, oldLevel));

    const newLevel = wasUnlocked ? oldLevel + 1 : 1;
    saveData.heroLevels[heroId] = newLevel;
    if (!wasUnlocked) {
        saveData.unlockedHeroes.push(heroId);
    }

    const newStats = getLeveledStats(heroData, newLevel);

    saveGameData();

    if (!imageCache[heroId]) {
        const img = new Image();
        img.src = heroData.image;
        imageCache[heroId] = img;
    }

    currentReveal = {
        hero: heroData,
        isNew: !wasUnlocked,
        oldStats: wasUnlocked ? oldStats : null,
        newStats: newStats,
        level: newLevel,
        startTime: performance.now()
    };
    currentState = GAME_STATES.CARD_REVEAL;
}

// Initialize saveData when the script loads
saveData = loadSaveData();
// Remove heroes that no longer exist
const validHeroIds = new Set(availableHeroes.map((h) => h.id));
saveData.unlockedHeroes = saveData.unlockedHeroes.filter((id) => validHeroIds.has(id));
for (const id in saveData.heroLevels) {
    if (!validHeroIds.has(id)) {
        delete saveData.heroLevels[id];
    }
}

// Listen for gacha draw key when in menu state and for exiting the reveal screen
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (currentState === GAME_STATES.MENU && key === 'g') {
        gachaDraw();
    } else if (currentState === GAME_STATES.CARD_REVEAL && e.key === 'Enter') {
        lastGachaResult = {
            hero: currentReveal.hero,
            level: currentReveal.level,
            isNew: currentReveal.isNew
        };
        currentReveal = null;
        currentState = GAME_STATES.MENU;
    }
});

/**
 * Start a new run by selecting a party of heroes and initial enemies.
 */
function startNewRun() {
    // Determine which heroes to use for this run. Prefer the player's unlocked heroes.
    playerHeroes = [];
    const heroIds = [];
    if (saveData.unlockedHeroes && saveData.unlockedHeroes.length >= 3) {
        heroIds.push(...saveData.unlockedHeroes.slice(0, 3));
    } else {
        // Fallback: use the first few heroes from the available list
        for (let i = 0; i < 3 && i < availableHeroes.length; i++) {
            heroIds.push(availableHeroes[i].id);
        }
    }
    // Instantiate heroes with level scaling
    heroIds.forEach((id) => {
        const data = charactersData.find((h) => h.id === id);
        const hero = new Hero(data);
        hero.level = saveData.heroLevels[id] || 1;
        // Scale stats based on level while keeping ult hits unchanged
        applyLeveledStats(hero, data);
        playerHeroes.push(hero);
    });
    // Initialize enemies (first enemy only)
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
        case GAME_STATES.CARD_REVEAL:
            // No update needed for static reveal
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
        case GAME_STATES.CARD_REVEAL:
            drawCardReveal();
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

function drawCardReveal() {
    drawBackground(cardViewBg);

    const hero = currentReveal.hero;
    const img = imageCache[hero.id];
    const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
    const frameX = (canvas.width - maxSize) / 2;
    const frameY = (canvas.height - maxSize) / 2;
    drawCardFrame(frameX, frameY, maxSize, maxSize);

    let cardRect;
    if (img && img.complete) {
        cardRect = drawCardImage(img);
    } else {
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'start';
        cardRect = { x: frameX, y: frameY, width: maxSize, height: maxSize };
    }

    const alpha = Math.min(1, (performance.now() - currentReveal.startTime) / 500);
    ctx.globalAlpha = alpha;

    // ----- Stats panel layout -----
    const availableRight = canvas.width - (cardRect.x + cardRect.width) - UI.GUTTER;
    const sideBySide = availableRight >= 200;
    let panelX, panelY, panelWidth;
    if (sideBySide) {
        panelX = cardRect.x + cardRect.width + UI.GUTTER;
        panelWidth = canvas.width - panelX - UI.PANEL_PADDING;
        panelY = cardRect.y;
    } else {
        panelWidth = Math.min(cardRect.width, canvas.width - UI.PANEL_PADDING * 2);
        panelX = (canvas.width - panelWidth) / 2;
        panelY = cardRect.y + cardRect.height + UI.GUTTER;
    }

    const h = canvas.height;
    const nameSize = Math.max(22, h * 0.03);
    const valueSize = Math.max(20, h * 0.025);
    const labelSize = Math.max(16, h * 0.022);
    const descSize = labelSize;
    const lineHeight = Math.max(16, descSize * 1.2);
    const iconSize = labelSize * 0.9;
    const rowHeight = Math.max(valueSize, iconSize);
    const rowGap = 8;

    const panelContentWidth = panelWidth - UI.PANEL_PADDING * 2;
    ctx.font = `${labelSize}px sans-serif`;
    const ultLabelWidth = ctx.measureText('Ult:').width + 4;
    ctx.font = `${descSize}px sans-serif`;
    const descLines = wrapText(ctx, hero.ultEffect, panelContentWidth - ultLabelWidth, lineHeight);

    let panelHeight = UI.PANEL_PADDING + nameSize + rowGap;
    for (let i = 0; i < 3; i++) {
        panelHeight += rowHeight;
        panelHeight += (i < 2 ? rowGap * 2 + 1 : rowGap);
    }
    panelHeight += descLines.length * lineHeight;
    panelHeight += UI.PANEL_PADDING;

    if (!sideBySide) {
        const promptY = canvas.height - 40;
        if (panelY + panelHeight > promptY - 16) {
            panelY = Math.max(16, promptY - 16 - panelHeight);
        }
    }

    ctx.save();
    ctx.shadowColor = UI.PANEL_SHADOW;
    ctx.shadowBlur = 6;
    drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, UI.PANEL_RADIUS);
    ctx.fillStyle = UI.PANEL_BG;
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'left';
    let cursorY = panelY + UI.PANEL_PADDING;

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${nameSize}px sans-serif`;
    const nameX = panelX + UI.PANEL_PADDING;
    const nameBaseline = cursorY + nameSize;
    ctx.fillText(hero.name, nameX, nameBaseline);
    const nameWidth = ctx.measureText(hero.name).width;

    // Role badge
    const badgeText = hero.type;
    const badgeFontSize = Math.max(12, labelSize * 0.8);
    ctx.font = `${badgeFontSize}px sans-serif`;
    const badgeTextWidth = ctx.measureText(badgeText).width;
    const badgeWidth = badgeTextWidth + 12;
    const badgeHeight = badgeFontSize + 4;
    const badgeX = nameX + nameWidth + 8;
    const badgeY = nameBaseline - badgeHeight + 2;
    ctx.fillStyle = hero.type === 'Attack' ? 'rgba(230,126,34,0.9)' : 'rgba(52,152,219,0.9)';
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    cursorY += nameSize + rowGap;

    const valueX = panelX + panelWidth - UI.PANEL_PADDING;

    const drawRow = (label, icon, oldVal, newVal, isLast) => {
        const baseY = cursorY + rowHeight / 2;
        drawGlyph(icon, panelX + UI.PANEL_PADDING + iconSize / 2, baseY, iconSize);
        ctx.font = `${labelSize}px sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.fillText(label, panelX + UI.PANEL_PADDING + iconSize + 6, cursorY + rowHeight);

        const oldStr = oldVal === newVal ? '' : `${oldVal} → `;
        ctx.font = `${valueSize}px sans-serif`;
        const oldWidth = ctx.measureText(oldStr).width;
        ctx.font = `bold ${valueSize}px sans-serif`;
        const newWidth = ctx.measureText(`${newVal}`).width;
        const startX = valueX - oldWidth - newWidth;

        if (oldStr) {
            ctx.font = `${valueSize}px sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.fillText(oldStr, startX, cursorY + rowHeight);
            ctx.font = `bold ${valueSize}px sans-serif`;
            ctx.fillStyle = 'rgb(0,255,128)';
            ctx.fillText(`${newVal}`, startX + oldWidth, cursorY + rowHeight);
        } else {
            ctx.font = `bold ${valueSize}px sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.fillText(`${newVal}`, startX, cursorY + rowHeight);
        }

        cursorY += rowHeight;
        if (!isLast) {
            cursorY += rowGap;
            ctx.strokeStyle = `rgba(255,255,255,${UI.DIVIDER_ALPHA})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(panelX + UI.PANEL_PADDING, cursorY + 0.5);
            ctx.lineTo(panelX + panelWidth - UI.PANEL_PADDING, cursorY + 0.5);
            ctx.stroke();
            cursorY += rowGap;
        } else {
            cursorY += rowGap;
        }
    };

    drawRow('HP', 'hp', currentReveal.oldStats.hp, currentReveal.newStats.hp, false);
    drawRow('ATK', 'atk', currentReveal.oldStats.atk, currentReveal.newStats.atk, false);
    drawRow('Ult Hits', 'ult', currentReveal.oldStats.ultCharge, currentReveal.newStats.ultCharge, true);

    // Ult description
    ctx.font = `${labelSize}px sans-serif`;
    ctx.fillStyle = '#fff';
    const ultLabel = 'Ult:';
    ctx.fillText(ultLabel, panelX + UI.PANEL_PADDING, cursorY + lineHeight);
    const labelWidth = ctx.measureText(ultLabel + ' ').width;
    ctx.font = `${descSize}px sans-serif`;
    const descX = panelX + UI.PANEL_PADDING + labelWidth;
    descLines.forEach((line, i) => {
        ctx.fillText(line, descX, cursorY + lineHeight * (i + 1));
    });
    cursorY += descLines.length * lineHeight;

    ctx.globalAlpha = 1;

    // Prompt
    ctx.textAlign = 'center';
    const promptFont = Math.max(16, h * 0.02);
    ctx.font = `${promptFont}px sans-serif`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText('Press Enter to continue', canvas.width / 2, canvas.height - 40);
    ctx.fillStyle = '#fff';
    ctx.fillText('Press Enter to continue', canvas.width / 2, canvas.height - 40);
    ctx.textAlign = 'left';
}

// ----- Menu and map drawing functions -----
function drawMenu() {
    ctx.fillStyle = '#fff';
    // Title
    ctx.font = '24px sans-serif';
    ctx.fillText('Key Combat AI', 20, 80);
    // Instructions
    ctx.font = '18px sans-serif';
    ctx.fillText('Press Enter to start a new run', 20, 120);
    ctx.fillText('Press G to draw a card (Gacha)', 20, 150);
    // Display last gacha result if available
    if (lastGachaResult) {
        ctx.font = '16px sans-serif';
        const res = lastGachaResult;
        const msg = res.isNew ? 'New card!' : 'Duplicate card!';
        ctx.fillText(
            `You drew: ${res.hero.name} (Level ${res.level}) - ${msg}`,
            20,
            180
        );
    }
    // List unlocked heroes
    ctx.font = '16px sans-serif';
    ctx.fillText('Unlocked Heroes:', 20, 210);
    if (saveData.unlockedHeroes.length > 0) {
        saveData.unlockedHeroes.forEach((heroId, idx) => {
            const data = charactersData.find((h) => h.id === heroId);
            const level = saveData.heroLevels[heroId];
            const y = 230 + idx * 20;
            ctx.fillText(
                `${data ? data.name : heroId} - Lv ${level}`,
                20,
                y
            );
        });
    } else {
        ctx.fillText('None', 20, 230);
    }
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