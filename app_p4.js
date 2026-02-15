
/* ===== CAVE BIOME (app_p4.js) ===== */

/* --- Cave Canvas Drawing --- */
const caveCanvas = document.getElementById('cave-canvas');
const caveCtx = caveCanvas ? caveCanvas.getContext('2d') : null;

function drawCaveLandscape() {
    if (!caveCanvas || !caveCtx) return;
    const sec = document.getElementById('cave-section');
    if (!sec) return;
    const w = sec.offsetWidth, h = sec.offsetHeight;
    caveCanvas.width = w; caveCanvas.height = h;
    const c = caveCtx;
    c.clearRect(0, 0, w, h);

    // === Dirt transition at top ===
    // Root tendrils
    c.save();
    for (let i = 0; i < 18; i++) {
        const rx = Math.random() * w, rl = 60 + Math.random() * 120;
        c.strokeStyle = `rgba(${60 + Math.random() * 30},${30 + Math.random() * 20},${10 + Math.random() * 15},${0.3 + Math.random() * 0.3})`;
        c.lineWidth = 1 + Math.random() * 3; c.beginPath();
        c.moveTo(rx, 0);
        c.bezierCurveTo(rx - 20 + Math.random() * 40, rl * 0.3, rx - 30 + Math.random() * 60, rl * 0.6, rx - 10 + Math.random() * 20, rl);
        c.stroke();
    }
    c.restore();

    // Dirt layers with embedded rocks
    const dirtColors = ['#4a3020', '#3a2515', '#2d1a0e', '#201008'];
    dirtColors.forEach((col, i) => {
        c.fillStyle = col;
        c.globalAlpha = 0.5;
        const y = h * 0.02 + i * h * 0.04;
        c.beginPath(); c.moveTo(0, y);
        for (let x = 0; x <= w; x += 5) c.lineTo(x, y + Math.sin(x * 0.01 + i * 2) * 8 + Math.sin(x * 0.03 + i) * 4);
        c.lineTo(w, y + h * 0.06); c.lineTo(0, y + h * 0.06); c.closePath(); c.fill();
    });
    c.globalAlpha = 1;

    // Embedded rocks in dirt
    for (let i = 0; i < 12; i++) {
        const rx = Math.random() * w, ry = h * 0.03 + Math.random() * h * 0.15;
        const rs = 4 + Math.random() * 12;
        c.fillStyle = `rgba(${70 + Math.random() * 40},${60 + Math.random() * 30},${50 + Math.random() * 20},0.6)`;
        c.beginPath(); c.ellipse(rx, ry, rs, rs * 0.6, Math.random(), 0, Math.PI * 2); c.fill();
    }

    // === Cave ceiling stalactites ===
    const ceilY = h * 0.18;
    for (let i = 0; i < 25; i++) {
        const sx = Math.random() * w, sl = 20 + Math.random() * 80, sw = 4 + Math.random() * 12;
        const sy = ceilY + (Math.random() * 30 - 15); // Randomize start Y
        const grad = c.createLinearGradient(sx, sy, sx, sy + sl);
        grad.addColorStop(0, '#2a2040'); grad.addColorStop(1, 'rgba(30,20,50,0.2)');
        c.fillStyle = grad; c.beginPath();
        c.moveTo(sx - sw / 2, sy); c.lineTo(sx, sy + sl); c.lineTo(sx + sw / 2, sy);
        c.closePath(); c.fill();
    }

    // === Cave walls ===
    // Left wall
    c.fillStyle = '#1a1028'; c.beginPath();
    c.moveTo(0, ceilY);
    c.bezierCurveTo(w * 0.08, ceilY + h * 0.1, w * 0.12, h * 0.4, w * 0.05, h * 0.6);
    c.bezierCurveTo(w * 0.02, h * 0.75, w * 0.08, h * 0.85, 0, h);
    c.lineTo(0, ceilY); c.fill();

    // Right wall
    c.fillStyle = '#1a1028'; c.beginPath();
    c.moveTo(w, ceilY);
    c.bezierCurveTo(w * 0.92, ceilY + h * 0.1, w * 0.88, h * 0.4, w * 0.95, h * 0.6);
    c.bezierCurveTo(w * 0.98, h * 0.75, w * 0.92, h * 0.85, w, h);
    c.lineTo(w, ceilY); c.fill();

    // Wall detail patches (lighter rock patches)
    const patches = [
        [w * 0.03, h * 0.3, 40, 30, '#2a1838'], [w * 0.06, h * 0.5, 35, 25, '#251535'],
        [w * 0.94, h * 0.35, 45, 30, '#2a1838'], [w * 0.91, h * 0.55, 30, 25, '#251535'],
    ];
    patches.forEach(([px, py, prx, pry, col]) => {
        c.fillStyle = col; c.globalAlpha = 0.6;
        c.beginPath(); c.ellipse(px, py, prx, pry, 0.3, 0, Math.PI * 2); c.fill();
    });
    c.globalAlpha = 1;

    // === Central cave opening (purple/pink glow from reference) ===
    const cgx = w * 0.5, cgy = h * 0.42;
    const glow = c.createRadialGradient(cgx, cgy, 0, cgx, cgy, w * 0.3);
    glow.addColorStop(0, 'rgba(220,180,255,0.2)');
    glow.addColorStop(0.3, 'rgba(160,100,220,0.12)');
    glow.addColorStop(0.6, 'rgba(80,50,150,0.06)');
    glow.addColorStop(1, 'rgba(20,10,40,0)');
    c.fillStyle = glow; c.fillRect(0, 0, w, h);

    // === Underground river (bottom) ===
    const riverY = h * 0.75; // Moved down slightly
    c.save();
    const riverGrad = c.createLinearGradient(0, riverY, 0, h);
    riverGrad.addColorStop(0, 'rgba(40,100,180,0.8)');
    riverGrad.addColorStop(0.5, 'rgba(60,140,220,0.6)');
    riverGrad.addColorStop(1, 'rgba(30,80,140,0.4)');
    c.fillStyle = riverGrad;
    c.beginPath();
    c.moveTo(0, riverY);
    for (let x = 0; x <= w; x += 10) c.lineTo(x, riverY + Math.sin(x * 0.01 + Date.now() * 0.001) * 5); // Gentle wave
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.closePath();
    c.fill();
    // River shine
    c.globalAlpha = 0.2; c.fillStyle = '#8acaff';
    for (let i = 0; i < 8; i++) {
        const shx = Math.random() * w, shy = riverY + 10 + Math.random() * (h - riverY - 20);
        c.beginPath(); c.ellipse(shx, shy, 20 + Math.random() * 30, 3 + Math.random() * 5, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();

    // === Cave floor stalagmites ===
    const floorY = h * 0.85;
    for (let i = 0; i < 20; i++) {
        const sx = w * 0.05 + Math.random() * w * 0.9, sl = 15 + Math.random() * 50, sw = 3 + Math.random() * 10;
        const grad2 = c.createLinearGradient(sx, floorY + 20, sx, floorY + 20 - sl);
        grad2.addColorStop(0, '#2a2040'); grad2.addColorStop(1, 'rgba(30,20,50,0.2)');
        c.fillStyle = grad2; c.beginPath();
        c.moveTo(sx - sw / 2, floorY + 20); c.lineTo(sx, floorY + 20 - sl); c.lineTo(sx + sw / 2, floorY + 20);
        c.closePath(); c.fill();
    }

    // === Crystals on walls ===
    const crystalColors = ['#b388ff', '#ce93d8', '#80cbc4', '#4fc3f7', '#ea80fc'];
    for (let i = 0; i < 8; i++) {
        const onLeft = Math.random() > 0.5;
        const cx2 = onLeft ? w * 0.02 + Math.random() * w * 0.1 : w * 0.88 + Math.random() * w * 0.1;
        const cy2 = h * 0.35 + Math.random() * h * 0.35;
        const csz = 8 + Math.random() * 18;
        const col = crystalColors[Math.floor(Math.random() * crystalColors.length)];
        c.fillStyle = col; c.globalAlpha = 0.7;
        c.beginPath(); c.moveTo(cx2, cy2); c.lineTo(cx2 - csz * 0.3, cy2 + csz);
        c.lineTo(cx2 + csz * 0.3, cy2 + csz); c.closePath(); c.fill();
        // Glow
        c.globalAlpha = 0.15;
        const cg = c.createRadialGradient(cx2, cy2 + csz * 0.3, 0, cx2, cy2 + csz * 0.3, csz * 2);
        cg.addColorStop(0, col); cg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = cg; c.beginPath(); c.arc(cx2, cy2 + csz * 0.3, csz * 2, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
}

/* --- Cave Entities --- */
const CAVE_FAUNA = {
    spider: { w: 35, h: 30, cat: 'ceiling', wt: { idle: 30, descending: 35, ascending: 25, resting: 10 }, dur: { idle: [3, 6], descending: [4, 8], ascending: [3, 6], resting: [2, 5] } },
    bat: { w: 45, h: 30, cat: 'air', wt: { sleeping: 35, flying: 40, gliding: 25 }, dur: { sleeping: [5, 12], flying: [4, 10], gliding: [3, 6] } },
    glowworm: { w: 20, h: 15, cat: 'ceiling', wt: { glowing: 60, dim: 40 }, dur: { glowing: [5, 12], dim: [3, 8] } },
    crystal: { w: 30, h: 40, cat: 'static', wt: { idle: 50, shimmering: 50 }, dur: { idle: [4, 10], shimmering: [3, 8] } },
    cavefish: { w: 25, h: 15, cat: 'water', wt: { swimming: 70, idle: 30 }, dur: { swimming: [5, 12], idle: [2, 5] } },
};
let caveEntities = [];

// SVG generators for cave entities
function spiderSVG() { return `<svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="8" fill="#2a2a30"/><circle cx="20" cy="12" r="5" fill="#3a3a40"/><circle cx="18" cy="10" r="1.5" fill="#ff4444"/><circle cx="22" cy="10" r="1.5" fill="#ff4444"/><line x1="12" y1="18" x2="3" y2="12" stroke="#2a2a30" stroke-width="1.5"/><line x1="12" y1="20" x2="2" y2="22" stroke="#2a2a30" stroke-width="1.5"/><line x1="12" y1="22" x2="4" y2="28" stroke="#2a2a30" stroke-width="1.5"/><line x1="28" y1="18" x2="37" y2="12" stroke="#2a2a30" stroke-width="1.5"/><line x1="28" y1="20" x2="38" y2="22" stroke="#2a2a30" stroke-width="1.5"/><line x1="28" y1="22" x2="36" y2="28" stroke="#2a2a30" stroke-width="1.5"/></svg>`; }
function batSVG() { return `<svg viewBox="0 0 50 35" xmlns="http://www.w3.org/2000/svg"><ellipse cx="25" cy="20" rx="6" ry="7" fill="#2a2030"/><circle cx="25" cy="15" r="4" fill="#3a2a40"/><circle cx="23" cy="14" r="1" fill="#ffcc00"/><circle cx="27" cy="14" r="1" fill="#ffcc00"/><path d="M19 18 Q10 8 2 15 Q8 12 14 18 Z" fill="#3a2a45"/><path d="M31 18 Q40 8 48 15 Q42 12 36 18 Z" fill="#3a2a45"/><path d="M23 13 L22 10" stroke="#3a2a40" stroke-width="0.8"/><path d="M27 13 L28 10" stroke="#3a2a40" stroke-width="0.8"/></svg>`; }
function glowwormSVG() { return `<svg viewBox="0 0 20 15" xmlns="http://www.w3.org/2000/svg"><ellipse cx="10" cy="8" rx="6" ry="4" fill="#2a4a3a"/><circle cx="10" cy="8" r="3" fill="#60ffa0" opacity="0.6"/><circle cx="10" cy="8" r="5" fill="#60ffa0" opacity="0.15"/></svg>`; }
function crystalSVG() { return `<svg viewBox="0 0 30 45" xmlns="http://www.w3.org/2000/svg"><polygon points="15,0 8,35 22,35" fill="#b388ff" opacity="0.8"/><polygon points="15,0 10,25 15,35 20,25" fill="#ce93d8" opacity="0.6"/><polygon points="15,2 12,18 18,18" fill="rgba(255,255,255,0.2)"/><polygon points="6,15 1,40 11,40" fill="#9575cd" opacity="0.6"/><polygon points="24,12 19,38 29,38" fill="#7e57c2" opacity="0.6"/></svg>`; }
function cavefishSVG() { return `<svg viewBox="0 0 30 18" xmlns="http://www.w3.org/2000/svg"><ellipse cx="15" cy="9" rx="10" ry="5" fill="rgba(120,180,255,0.6)"/><polygon points="26,9 32,4 32,14" fill="rgba(100,160,240,0.5)"/><circle cx="10" cy="8" r="1.5" fill="rgba(255,255,255,0.7)"/><circle cx="10" cy="8" r="0.8" fill="#1a1a3a"/></svg>`; }

const CAVE_SVG_MAP = { spider: spiderSVG, bat: batSVG, glowworm: glowwormSVG, crystal: crystalSVG, cavefish: cavefishSVG };

class CaveEntity {
    constructor(type) {
        const d = CAVE_FAUNA[type]; this.type = type; this.d = d; this.alive = true;
        this.w = d.w * (0.8 + Math.random() * 0.4); this.h = d.h * (0.8 + Math.random() * 0.4);
        this.face = Math.random() > 0.5 ? 1 : -1; this.vx = 0; this.vy = 0;
        this._respawn();
        this.state = this._pick(); this.timer = this._dur();
        this.threadLen = 0; this.baseY = this.y;
        this.el = document.createElement('div');
        this.el.className = 'cave-entity state-' + this.state;
        this.el.style.width = this.w + 'px'; this.el.style.height = this.h + 'px';
        this.el.style.position = 'absolute';
        this.el.innerHTML = CAVE_SVG_MAP[type]();
        if (d.cat === 'ceiling') {
            const thread = document.createElement('div'); thread.className = 'thread';
            thread.style.height = '0px'; this.threadEl = thread; this.el.appendChild(thread);
        }
        const zzz = document.createElement('div'); zzz.className = 'zzz-cave'; zzz.textContent = 'z z z'; this.el.appendChild(zzz);
        this._render();
        document.getElementById('cave-entity-layer').appendChild(this.el);
    }
    _pick() { const w = this.d.wt, ks = Object.keys(w), tot = ks.reduce((s, k) => s + w[k], 0); let r = Math.random() * tot; for (const k of ks) { r -= w[k]; if (r <= 0) return k; } return ks[0]; }
    _dur() { const r = this.d.dur[this.state]; return (r[0] + Math.random() * (r[1] - r[0])) * 60; }
    _transition() { this.state = this._pick(); this.timer = this._dur(); }
    _respawn() {
        const sec = document.getElementById('cave-section');
        const sw = sec ? sec.offsetWidth : W(), sh = sec ? sec.offsetHeight : H();
        switch (this.d.cat) {
            case 'ceiling': this.x = sw * 0.1 + Math.random() * sw * 0.8; this.y = sh * 0.18 + Math.random() * sh * 0.05; this.baseY = this.y; break;
            case 'air': this.x = sw * 0.1 + Math.random() * sw * 0.8; this.y = sh * 0.25 + Math.random() * sh * 0.35; break;
            case 'static': this.x = sw * 0.05 + Math.random() * sw * 0.9; this.y = sh * 0.3 + Math.random() * sh * 0.4; break;
            case 'water': this.x = sw * 0.15 + Math.random() * sw * 0.7; this.y = sh * 0.72 + Math.random() * sh * 0.08; break;
        }
    }
    update() {
        if (!this.alive) return;
        this.timer--;
        if (this.timer <= 0) this._transition();
        const sec = document.getElementById('cave-section');
        const sw = sec ? sec.offsetWidth : W(), sh = sec ? sec.offsetHeight : H();

        switch (this.type) {
            case 'spider':
                if (this.state === 'descending') {
                    this.threadLen = Math.min(this.threadLen + 0.5, 60 + Math.random() * 40);
                    this.y = this.baseY + this.threadLen;
                } else if (this.state === 'ascending') {
                    this.threadLen = Math.max(0, this.threadLen - 0.8);
                    this.y = this.baseY + this.threadLen;
                } else {
                    // idle/resting — gentle sway
                    this.y = this.baseY + this.threadLen + Math.sin(Date.now() * 0.002) * 1.5;
                }
                if (this.threadEl) this.threadEl.style.height = this.threadLen + 'px';
                break;
            case 'bat':
                if (this.state === 'flying') {
                    if (!this.tx || Math.abs(this.x - this.tx) < 20) {
                        this.tx = sw * 0.1 + Math.random() * sw * 0.8;
                        this.ty = sh * 0.2 + Math.random() * sh * 0.35;
                    }
                    const dx = this.tx - this.x, dy = this.ty - this.y, dd = Math.sqrt(dx * dx + dy * dy);
                    if (dd > 5) { this.vx += (dx / dd) * 0.15; this.vy += (dy / dd) * 0.15; }
                    this.face = this.vx > 0 ? -1 : 1;
                    this.vx *= 0.96; this.vy *= 0.96;
                    this.y += Math.sin(Date.now() * 0.005) * 0.3;
                } else if (this.state === 'gliding') {
                    this.vx += (Math.random() - 0.5) * 0.05;
                    this.vy += Math.sin(Date.now() * 0.002) * 0.03;
                    this.face = this.vx > 0 ? -1 : 1;
                    this.vx *= 0.99; this.vy *= 0.98;
                } else {
                    // sleeping — hang from ceiling
                    this.vx = 0; this.vy = 0;
                    this.y = sh * 0.19 + Math.sin(Date.now() * 0.001) * 0.5;
                }
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0) this.x = sw; if (this.x > sw) this.x = 0;
                this.y = Math.max(sh * 0.18, Math.min(sh * 0.65, this.y));
                break;
            case 'glowworm':
                // static with gentle sway
                this.y = this.baseY + Math.sin(Date.now() * 0.001 + this.x * 0.1) * 2;
                break;
            case 'crystal':
                // completely static
                break;
                break;
            case 'cavefish':
                if (this.state === 'swimming') {
                    this.vx += (Math.random() - 0.5) * 0.1;
                    this.vx = Math.max(-1, Math.min(1, this.vx));
                    this.face = this.vx > 0 ? -1 : 1;
                    this.y += Math.sin(Date.now() * 0.003 + this.x * 0.05) * 0.2;
                } else {
                    this.vx *= 0.95;
                }
                this.x += this.vx;
                if (this.x < sw * 0.1) this.vx = Math.abs(this.vx) + 0.2;
                if (this.x > sw * 0.85) this.vx = -Math.abs(this.vx) - 0.2;
                // Clamp to water
                const riverY = sh * 0.75;
                this.y = Math.max(riverY + 15, Math.min(sh - 10, this.y)); // Ensure below water
                break;
        }
        this._render();
    }
    _render() {
        this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px';
        this.el.className = 'cave-entity state-' + this.state + (this.face === 1 ? ' face-l' : ' face-r');
    }
    destroy() { this.alive = false; this.el.remove(); }
}

function spawnCaveEntities() {
    // Spiders
    for (let i = 0; i < 3; i++) caveEntities.push(new CaveEntity('spider'));
    // Bats
    for (let i = 0; i < 2; i++) caveEntities.push(new CaveEntity('bat'));
    // Glowworms
    for (let i = 0; i < 6; i++) caveEntities.push(new CaveEntity('glowworm'));
    // Crystals
    for (let i = 0; i < 4; i++) caveEntities.push(new CaveEntity('crystal'));
    // Cave fish
    for (let i = 0; i < 3; i++) caveEntities.push(new CaveEntity('cavefish'));
}

function tickCaveEntities() {
    caveEntities.forEach(e => e.update());
    requestAnimationFrame(tickCaveEntities);
}

// Dripstone particles
function dripEffect() {
    const sec = document.getElementById('cave-section');
    const layer = document.getElementById('cave-entity-layer');
    if (!sec || !layer) return;
    const sw = sec.offsetWidth, sh = sec.offsetHeight;
    for (let i = 0; i < 2; i++) {
        const drip = document.createElement('div');
        drip.className = 'drip-particle';
        drip.style.left = (sw * 0.15 + Math.random() * sw * 0.7) + 'px';
        drip.style.top = (sh * 0.18 + Math.random() * sh * 0.05) + 'px';
        layer.appendChild(drip);
        setTimeout(() => { if (drip.parentNode) drip.remove(); }, 1200);
    }
}

/* --- Pomodoro Timer --- */
let pomoState = 'idle'; // idle, focus, break, done, paused
let defaultTime = 25 * 60; // User-set default
let pomoTime = defaultTime; // seconds remaining
let pomoInterval = null;
const BREAK_DURATION = 5 * 60;
const audioEnd = new Audio('elements/Clock_end.mp3');
const audioClick = new Audio('elements/Tomato_clicked.m4a');

function formatTime(s) {
    const m = Math.floor(Math.abs(s) / 60), sec = Math.abs(s) % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

function initPomodoro() {
    const startBtn = document.getElementById('pomo-start');
    const resetBtn = document.getElementById('pomo-reset');
    const tomato = document.getElementById('pomo-tomato');
    const plusBtn = document.getElementById('pomo-plus');
    const minusBtn = document.getElementById('pomo-minus');
    const timerDisplay = document.getElementById('pomo-timer');
    if (!startBtn || !resetBtn) return;

    const updateDisplay = () => {
        timerDisplay.textContent = formatTime(pomoTime);
    };

    tomato.addEventListener('click', (e) => {
        if (e.target.closest('.pomo-controls') || e.target.closest('.pomo-adj-btn')) return;
        audioClick.currentTime = 0;
        audioClick.play().catch(() => { });
    });

    plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pomoState !== 'idle' && pomoState !== 'done' && pomoState !== 'paused') return;
        // Smart Add: Round up to next 5 minute interval
        // Ex: 1:00 (60s) -> 5:00 (300s). 5:00 -> 10:00.
        let m = Math.floor(defaultTime / 60);
        let nextM = (Math.floor(m / 5) + 1) * 5;
        defaultTime = nextM * 60;
        pomoTime = defaultTime;
        updateDisplay();
    });

    minusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pomoState !== 'idle' && pomoState !== 'done' && pomoState !== 'paused') return;
        // Smart Subtract: Round down to previous 5 minute interval
        let m = Math.floor(defaultTime / 60);
        let prevM = (Math.ceil(m / 5) - 1) * 5;
        if (prevM < 5) prevM = 1; // Min 1 minute
        if (m === 1) prevM = 1; // Stuck at 1
        defaultTime = prevM * 60;
        if (defaultTime < 60) defaultTime = 60;
        pomoTime = defaultTime;
        updateDisplay();
    });

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pomoInterval) {
            clearInterval(pomoInterval); pomoInterval = null;
            startBtn.textContent = 'Resume';
            tomato.classList.remove('active');
            pomoState = 'paused';
        } else {
            if (pomoState === 'idle' || pomoState === 'done') {
                pomoState = 'focus';
                pomoTime = defaultTime;
            } else if (pomoState === 'paused') {
                pomoState = 'focus';
            }
            tomato.classList.add('active'); tomato.classList.remove('done');
            startBtn.textContent = 'Pause';
            document.getElementById('pomo-label').textContent = 'Focus time!';
            pomoInterval = setInterval(pomoTick, 1000);
        }
    });

    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearInterval(pomoInterval); pomoInterval = null;
        pomoState = 'idle';
        pomoTime = defaultTime;
        tomato.classList.remove('active', 'done');
        updateDisplay();
        document.getElementById('pomo-label').textContent = 'Click to start focus!';
        document.getElementById('pomo-start').textContent = 'Start';
    });

    updateDisplay();
}

function pomoTick() {
    pomoTime--;
    if (pomoTime <= 0) {
        clearInterval(pomoInterval); pomoInterval = null;
        const tomato = document.getElementById('pomo-tomato');

        audioEnd.currentTime = 0;
        audioEnd.play().catch(() => { });

        if (pomoState === 'focus') {
            pomoState = 'done'; pomoTime = 300; // 5 Minutes Fixed
            tomato.classList.remove('active'); tomato.classList.add('done');
            document.getElementById('pomo-label').textContent = 'Time for a break!';
            document.getElementById('pomo-start').textContent = 'Start Break';
        } else if (pomoState === 'break') {
            pomoState = 'done'; pomoTime = defaultTime;
            tomato.classList.remove('active'); tomato.classList.add('done');
            document.getElementById('pomo-label').textContent = 'Break over! Ready?';
            document.getElementById('pomo-start').textContent = 'Start Focus';
        }
    }
    const m = Math.floor(Math.abs(pomoTime) / 60), s = Math.abs(pomoTime) % 60;
    document.getElementById('pomo-timer').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/* --- Init Cave --- */
function initCave() {
    drawCaveLandscape();
    spawnCaveEntities();
    tickCaveEntities();
    setInterval(dripEffect, 3000);
    initPomodoro();
}
