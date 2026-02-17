
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

    // === Cave ceiling stalactites (natural, randomized clusters) ===
    const ceilY = h * 0.18;
    // Create organic clusters instead of evenly distributed spikes
    const clusterCount = 5 + Math.floor(Math.random() * 4);
    for (let ci = 0; ci < clusterCount; ci++) {
        const clusterX = w * 0.05 + Math.random() * w * 0.9;
        const clusterBaseY = ceilY + (Math.random() * 50 - 25); // More Y spread
        const spikesInCluster = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < spikesInCluster; i++) {
            const sx = clusterX + (Math.random() - 0.5) * 40;
            const sy = clusterBaseY + (Math.random() * 20 - 10);
            const sl = 15 + Math.random() * 70;
            const sw = 3 + Math.random() * 10;
            const grad = c.createLinearGradient(sx, sy, sx, sy + sl);
            grad.addColorStop(0, '#2a2040'); grad.addColorStop(1, 'rgba(30,20,50,0.15)');
            c.fillStyle = grad; c.beginPath();
            // Slightly curved stalactite shape
            c.moveTo(sx - sw / 2, sy);
            c.quadraticCurveTo(sx - sw * 0.3, sy + sl * 0.6, sx, sy + sl);
            c.quadraticCurveTo(sx + sw * 0.3, sy + sl * 0.6, sx + sw / 2, sy);
            c.closePath(); c.fill();
        }
    }
    // Add a few lone stalactites for variety
    for (let i = 0; i < 4; i++) {
        const sx = Math.random() * w;
        const sy = ceilY * 0.5 + Math.random() * ceilY;
        const sl = 10 + Math.random() * 35;
        const sw = 2 + Math.random() * 6;
        const grad = c.createLinearGradient(sx, sy, sx, sy + sl);
        grad.addColorStop(0, '#2a2040'); grad.addColorStop(1, 'rgba(30,20,50,0.1)');
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

    // === Cave floor stalagmites (randomized clusters) ===
    const floorY = h * 0.85;
    const stlagClusters = 4 + Math.floor(Math.random() * 3);
    for (let ci = 0; ci < stlagClusters; ci++) {
        const clX = w * 0.08 + Math.random() * w * 0.84;
        const clBaseY = floorY + 15 + (Math.random() * 15 - 8);
        const cnt = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < cnt; i++) {
            const sx = clX + (Math.random() - 0.5) * 35;
            const sy = clBaseY + (Math.random() * 10 - 5);
            const sl = 12 + Math.random() * 45;
            const sw = 3 + Math.random() * 8;
            const grad2 = c.createLinearGradient(sx, sy, sx, sy - sl);
            grad2.addColorStop(0, '#2a2040'); grad2.addColorStop(1, 'rgba(30,20,50,0.15)');
            c.fillStyle = grad2; c.beginPath();
            c.moveTo(sx - sw / 2, sy);
            c.quadraticCurveTo(sx - sw * 0.25, sy - sl * 0.65, sx, sy - sl);
            c.quadraticCurveTo(sx + sw * 0.25, sy - sl * 0.65, sx + sw / 2, sy);
            c.closePath(); c.fill();
        }
    }
    // Lone stalagmites
    for (let i = 0; i < 3; i++) {
        const sx = Math.random() * w;
        const sy = floorY + 10 + Math.random() * 20;
        const sl = 8 + Math.random() * 25;
        const sw = 2 + Math.random() * 5;
        const grad2 = c.createLinearGradient(sx, sy, sx, sy - sl);
        grad2.addColorStop(0, '#2a2040'); grad2.addColorStop(1, 'rgba(30,20,50,0.1)');
        c.fillStyle = grad2; c.beginPath();
        c.moveTo(sx - sw / 2, sy); c.lineTo(sx, sy - sl); c.lineTo(sx + sw / 2, sy);
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

    // === Moss patches on walls ===
    c.globalAlpha = 0.25;
    for (let i = 0; i < 12; i++) {
        const onLeft = Math.random() > 0.5;
        const mx = onLeft ? w * 0.01 + Math.random() * w * 0.08 : w * 0.91 + Math.random() * w * 0.08;
        const my = h * 0.25 + Math.random() * h * 0.5;
        const mw = 10 + Math.random() * 25, mh = 5 + Math.random() * 15;
        c.fillStyle = `hsl(${120 + Math.random() * 30},${30 + Math.random() * 20}%,${15 + Math.random() * 10}%)`;
        c.beginPath(); c.ellipse(mx, my, mw, mh, Math.random() * 0.5, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    // === Glowing mushrooms on floor ===
    const mushColors = ['#60ffa0', '#80ffcc', '#40ff80', '#a0ffe0'];
    for (let i = 0; i < 6; i++) {
        const mx = w * 0.1 + Math.random() * w * 0.8;
        const my = floorY + 15 + Math.random() * 10;
        const ms = 3 + Math.random() * 5;
        const mc = mushColors[Math.floor(Math.random() * mushColors.length)];
        // Stem
        c.fillStyle = '#2a3a30'; c.fillRect(mx - 1, my - ms * 1.5, 2, ms * 1.5);
        // Cap
        c.fillStyle = mc; c.globalAlpha = 0.6;
        c.beginPath(); c.arc(mx, my - ms * 1.5, ms, Math.PI, 0); c.fill();
        // Glow
        c.globalAlpha = 0.1;
        const mg = c.createRadialGradient(mx, my - ms, 0, mx, my - ms, ms * 4);
        mg.addColorStop(0, mc); mg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = mg; c.beginPath(); c.arc(mx, my - ms, ms * 4, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    // === Hanging vines from ceiling ===
    for (let i = 0; i < 8; i++) {
        const vx = w * 0.08 + Math.random() * w * 0.84;
        const vy = ceilY + Math.random() * 20;
        const vLen = 30 + Math.random() * 60;
        c.strokeStyle = `rgba(${40 + Math.random() * 20},${80 + Math.random() * 30},${30 + Math.random() * 20},0.4)`;
        c.lineWidth = 1 + Math.random() * 1.5;
        c.beginPath(); c.moveTo(vx, vy);
        c.bezierCurveTo(vx - 10 + Math.random() * 20, vy + vLen * 0.3,
            vx - 15 + Math.random() * 30, vy + vLen * 0.6,
            vx - 5 + Math.random() * 10, vy + vLen);
        c.stroke();
        // Little leaf at tip
        c.fillStyle = 'rgba(50,100,40,0.3)';
        c.beginPath(); c.ellipse(vx - 5 + Math.random() * 10, vy + vLen, 4, 2, Math.random(), 0, Math.PI * 2); c.fill();
    }

    // === Spider webs on ceiling ===
    for (let i = 0; i < 3; i++) {
        const wx = w * 0.1 + Math.random() * w * 0.8;
        const wy = ceilY + Math.random() * h * 0.08;
        const wr = 20 + Math.random() * 30;
        c.strokeStyle = 'rgba(200,200,220,0.15)';
        c.lineWidth = 0.5;
        // Radial threads
        const spokes = 6 + Math.floor(Math.random() * 4);
        for (let s = 0; s < spokes; s++) {
            const angle = (s / spokes) * Math.PI * 2;
            c.beginPath();
            c.moveTo(wx, wy);
            c.lineTo(wx + Math.cos(angle) * wr, wy + Math.sin(angle) * wr * 0.6);
            c.stroke();
        }
        // Spiral threads
        for (let r = 0.3; r <= 1; r += 0.25) {
            c.beginPath();
            for (let s = 0; s <= spokes; s++) {
                const angle = (s / spokes) * Math.PI * 2;
                const px = wx + Math.cos(angle) * wr * r;
                const py = wy + Math.sin(angle) * wr * r * 0.6;
                if (s === 0) c.moveTo(px, py); else c.lineTo(px, py);
            }
            c.stroke();
        }
    }

    // === Floor pebbles ===
    c.globalAlpha = 0.3;
    for (let i = 0; i < 15; i++) {
        const px = w * 0.05 + Math.random() * w * 0.9;
        const py = floorY + 20 + Math.random() * (h - floorY - 25);
        const pr = 2 + Math.random() * 4;
        c.fillStyle = `rgba(${40 + Math.random() * 30},${30 + Math.random() * 20},${50 + Math.random() * 20},0.5)`;
        c.beginPath(); c.ellipse(px, py, pr, pr * 0.6, Math.random(), 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    // === Large Riverbed Stones ===
    for (let i = 0; i < 8; i++) {
        const sx = w * 0.1 + Math.random() * w * 0.8;
        const sy = floorY + 25 + Math.random() * (h - floorY - 30);
        const sr = 6 + Math.random() * 8;
        c.fillStyle = `rgba(${30 + Math.random() * 20},${20 + Math.random() * 15},${40 + Math.random() * 20},0.8)`;
        c.beginPath(); c.ellipse(sx, sy, sr, sr * 0.6, Math.random(), 0, Math.PI * 2); c.fill();
        // Highlight
        c.fillStyle = 'rgba(255,255,255,0.05)';
        c.beginPath(); c.ellipse(sx - 2, sy - 2, sr * 0.3, sr * 0.2, 0, 0, Math.PI * 2); c.fill();
    }
}

/* --- Cave Entities --- */
const CAVE_FAUNA = {
    spider: { w: 35, h: 30, cat: 'ceiling', wt: { idle: 30, descending: 35, ascending: 25, resting: 10 }, dur: { idle: [3, 6], descending: [4, 8], ascending: [3, 6], resting: [2, 5] } },
    bat: { w: 45, h: 30, cat: 'air', wt: { sleeping: 35, flying: 40, gliding: 25 }, dur: { sleeping: [5, 12], flying: [4, 10], gliding: [3, 6] } },
    glowworm: { w: 20, h: 15, cat: 'ceiling', wt: { glowing: 60, dim: 40 }, dur: { glowing: [5, 12], dim: [3, 8] } },
    crystal: { w: 30, h: 40, cat: 'static', wt: { idle: 50, shimmering: 50 }, dur: { idle: [4, 10], shimmering: [3, 8] } },
    cavefish: { w: 25, h: 15, cat: 'water', wt: { swimming: 70, idle: 30 }, dur: { swimming: [5, 12], idle: [2, 5] } },
    fish: { w: 30, h: 20, cat: 'water', wt: { swimming: 65, idle: 35 }, dur: { swimming: [4, 8], idle: [2, 5] } },
    'fish-gold': { w: 35, h: 24, cat: 'water', wt: { swimming: 55, idle: 45 }, dur: { swimming: [5, 10], idle: [3, 6] } },
    squid: { w: 30, h: 32, cat: 'water', wt: { swimming: 50, idle: 50 }, dur: { swimming: [4, 9], idle: [3, 7] } },
    crab: { w: 35, h: 22, cat: 'water', wt: { swimming: 40, idle: 60 }, dur: { swimming: [3, 6], idle: [4, 8] } },
    pufferfish: { w: 30, h: 28, cat: 'water', wt: { swimming: 50, idle: 50 }, dur: { swimming: [3, 7], idle: [3, 6] } },
};
let caveEntities = [];

// SVG generators for cave entities
function spiderSVG() { return `<svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="8" fill="#2a2a30"/><circle cx="20" cy="12" r="5" fill="#3a3a40"/><circle cx="18" cy="10" r="1.5" fill="#ff4444"/><circle cx="22" cy="10" r="1.5" fill="#ff4444"/><line x1="12" y1="18" x2="3" y2="12" stroke="#2a2a30" stroke-width="1.5"/><line x1="12" y1="20" x2="2" y2="22" stroke="#2a2a30" stroke-width="1.5"/><line x1="12" y1="22" x2="4" y2="28" stroke="#2a2a30" stroke-width="1.5"/><line x1="28" y1="18" x2="37" y2="12" stroke="#2a2a30" stroke-width="1.5"/><line x1="28" y1="20" x2="38" y2="22" stroke="#2a2a30" stroke-width="1.5"/><line x1="28" y1="22" x2="36" y2="28" stroke="#2a2a30" stroke-width="1.5"/></svg>`; }
function batSVG() { return `<svg viewBox="0 0 50 35" xmlns="http://www.w3.org/2000/svg"><ellipse cx="25" cy="20" rx="6" ry="7" fill="#2a2030"/><circle cx="25" cy="15" r="4" fill="#3a2a40"/><circle cx="23" cy="14" r="1" fill="#ffcc00"/><circle cx="27" cy="14" r="1" fill="#ffcc00"/><path d="M19 18 Q10 8 2 15 Q8 12 14 18 Z" fill="#3a2a45"/><path d="M31 18 Q40 8 48 15 Q42 12 36 18 Z" fill="#3a2a45"/><path d="M23 13 L22 10" stroke="#3a2a40" stroke-width="0.8"/><path d="M27 13 L28 10" stroke="#3a2a40" stroke-width="0.8"/></svg>`; }
function glowwormSVG() { return `<svg viewBox="0 0 20 15" xmlns="http://www.w3.org/2000/svg"><ellipse cx="10" cy="8" rx="6" ry="4" fill="#2a4a3a"/><circle cx="10" cy="8" r="3" fill="#60ffa0" opacity="0.6"/><circle cx="10" cy="8" r="5" fill="#60ffa0" opacity="0.15"/></svg>`; }
function crystalSVG() { return `<svg viewBox="0 0 30 45" xmlns="http://www.w3.org/2000/svg"><polygon points="15,0 8,35 22,35" fill="#b388ff" opacity="0.8"/><polygon points="15,0 10,25 15,35 20,25" fill="#ce93d8" opacity="0.6"/><polygon points="15,2 12,18 18,18" fill="rgba(255,255,255,0.2)"/><polygon points="6,15 1,40 11,40" fill="#9575cd" opacity="0.6"/><polygon points="24,12 19,38 29,38" fill="#7e57c2" opacity="0.6"/></svg>`; }
function cavefishSVG() { return `<svg viewBox="0 0 30 18" xmlns="http://www.w3.org/2000/svg"><ellipse cx="15" cy="9" rx="10" ry="5" fill="rgba(120,180,255,0.6)"/><polygon points="26,9 32,4 32,14" fill="rgba(100,160,240,0.5)"/><circle cx="10" cy="8" r="1.5" fill="rgba(255,255,255,0.7)"/><circle cx="10" cy="8" r="0.8" fill="#1a1a3a"/></svg>`; }
function fishSVG() { return `<svg viewBox="-3 -3 56 36" xmlns="http://www.w3.org/2000/svg"><ellipse cx="22" cy="15" rx="15" ry="9" fill="#5090d0"/><polygon points="38,15 48,8 48,22" fill="#4080c0" opacity="0.8"/><ellipse cx="22" cy="17" rx="10" ry="5" fill="#80b8e8" opacity="0.4"/><circle cx="13" cy="13" r="2.5" fill="white"/><circle cx="13" cy="13" r="1.3" fill="#1a1a3a"/><path d="M22 6 Q26 3 28 6" fill="#5090d0" opacity="0.7"/></svg>`; }
function fishGoldSVG() { return `<svg viewBox="-3 -3 61 41" xmlns="http://www.w3.org/2000/svg"><ellipse cx="25" cy="18" rx="17" ry="11" fill="#e8a030"/><polygon points="43,18 53,10 53,26" fill="#d89020" opacity="0.8"/><ellipse cx="25" cy="20" rx="11" ry="6" fill="#f0c060" opacity="0.4"/><ellipse cx="20" cy="14" rx="4" ry="3" fill="#d07020" opacity="0.5"/><circle cx="15" cy="15" r="2.8" fill="white"/><circle cx="15" cy="15" r="1.5" fill="#1a1a3a"/><path d="M25 7 Q29 4 32 7" fill="#e8a030" opacity="0.7"/></svg>`; }
function squidSVG() { return `<svg viewBox="-3 -3 50 50" xmlns="http://www.w3.org/2000/svg"><ellipse cx="22" cy="15" rx="10" ry="14" fill="#d07098"/><ellipse cx="22" cy="12" rx="6" ry="8" fill="#e890a8" opacity="0.4"/><circle cx="17" cy="18" r="2.5" fill="white"/><circle cx="17" cy="18" r="1.3" fill="#1a1a3a"/><circle cx="27" cy="18" r="2.5" fill="white"/><circle cx="27" cy="18" r="1.3" fill="#1a1a3a"/><path d="M14 26 Q10 34 13 40" stroke="#d07098" stroke-width="2" fill="none"/><path d="M18 28 Q16 36 18 42" stroke="#d07098" stroke-width="2" fill="none"/><path d="M22 28 Q22 37 24 42" stroke="#d07098" stroke-width="2" fill="none"/><path d="M26 28 Q28 36 26 42" stroke="#d07098" stroke-width="2" fill="none"/><path d="M30 26 Q34 34 31 40" stroke="#d07098" stroke-width="2" fill="none"/></svg>`; }
function crabSVG() { return `<svg viewBox="-3 -3 60 36" xmlns="http://www.w3.org/2000/svg"><ellipse cx="27" cy="18" rx="14" ry="9" fill="#e05030"/><ellipse cx="27" cy="16" rx="9" ry="4" fill="#e86848" opacity="0.4"/><line x1="18" y1="4" x2="22" y2="10" stroke="#c04020" stroke-width="2"/><line x1="36" y1="4" x2="32" y2="10" stroke="#c04020" stroke-width="2"/><circle cx="18" cy="3" r="2.2" fill="white"/><circle cx="18" cy="3" r="1.2" fill="#1a1a3a"/><circle cx="36" cy="3" r="2.2" fill="white"/><circle cx="36" cy="3" r="1.2" fill="#1a1a3a"/><line x1="10" y1="20" x2="3" y2="26" stroke="#c04020" stroke-width="1.5"/><line x1="15" y1="22" x2="7" y2="26" stroke="#c04020" stroke-width="1.5"/><line x1="40" y1="22" x2="47" y2="26" stroke="#c04020" stroke-width="1.5"/><line x1="44" y1="20" x2="51" y2="26" stroke="#c04020" stroke-width="1.5"/><ellipse cx="7" cy="10" rx="4" ry="3" fill="#d85040"/><ellipse cx="47" cy="10" rx="4" ry="3" fill="#d85040"/></svg>`; }
function pufferfishSVG() { return `<svg viewBox="-3 -3 50 44" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="20" rx="12" ry="12" r="12" fill="#f0d050"/><ellipse cx="22" cy="24" rx="8" ry="5" fill="#f8e890" opacity="0.5"/><line x1="22" y1="8" x2="22" y2="4" stroke="#d8b030" stroke-width="1.2"/><line x1="14" y1="10" x2="11" y2="6" stroke="#d8b030" stroke-width="1.2"/><line x1="30" y1="10" x2="33" y2="6" stroke="#d8b030" stroke-width="1.2"/><line x1="10" y1="16" x2="6" y2="14" stroke="#d8b030" stroke-width="1.2"/><line x1="34" y1="16" x2="38" y2="14" stroke="#d8b030" stroke-width="1.2"/><line x1="10" y1="26" x2="6" y2="28" stroke="#d8b030" stroke-width="1.2"/><line x1="34" y1="26" x2="38" y2="28" stroke="#d8b030" stroke-width="1.2"/><line x1="14" y1="30" x2="11" y2="34" stroke="#d8b030" stroke-width="1.2"/><line x1="30" y1="30" x2="33" y2="34" stroke="#d8b030" stroke-width="1.2"/><circle cx="17" cy="17" r="3" fill="white"/><circle cx="17" cy="17" r="1.5" fill="#1a1a3a"/><circle cx="27" cy="17" r="3" fill="white"/><circle cx="27" cy="17" r="1.5" fill="#1a1a3a"/><polygon points="34,20 42,16 40,22 42,28 34,24" fill="#e8c040" opacity="0.7"/></svg>`; }

const CAVE_SVG_MAP = { spider: spiderSVG, bat: batSVG, glowworm: glowwormSVG, crystal: crystalSVG, cavefish: cavefishSVG, fish: fishSVG, 'fish-gold': fishGoldSVG, squid: squidSVG, crab: crabSVG, pufferfish: pufferfishSVG };

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
            case 'water':
                this.x = sw * 0.15 + Math.random() * sw * 0.7;
                if (this.type === 'crab') {
                    // Crabs crawl on the bottom
                    this.y = sh * 0.9 + Math.random() * sh * 0.08;
                } else {
                    // Fish swim in the middle
                    this.y = sh * 0.72 + Math.random() * sh * 0.08;
                }
                break;
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
                    // idle/resting — gentle sway (Fixed Jitter)
                    // Use a consistent time-based sine wave, no randomness in Y
                    this.y = this.baseY + this.threadLen + Math.sin(Date.now() * 0.0015 + this.x * 0.01) * 2;
                }
                if (this.threadEl) {
                    this.threadEl.style.height = this.threadLen + 'px';
                    this.threadEl.style.left = '50%'; // Align to center of body
                }
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
            default:
                // Generic water entity movement (fish, fish-gold, squid, crab, pufferfish, cavefish)
                if (this.d.cat === 'water') {
                    if (this.state === 'swimming') {
                        this.vx += (Math.random() - 0.5) * 0.1;
                        this.vx = Math.max(-1.2, Math.min(1.2, this.vx));
                        this.face = this.vx > 0 ? -1 : 1;
                        this.y += Math.sin(Date.now() * 0.003 + this.x * 0.05) * 0.2;
                    } else {
                        this.vx *= 0.95;
                    }
                    this.x += this.vx;
                    if (this.x < sw * 0.1) this.vx = Math.abs(this.vx) + 0.2;
                    if (this.x > sw * 0.85) this.vx = -Math.abs(this.vx) - 0.2;
                    // Clamp to water
                    const riverY2 = sh * 0.75;
                    if (this.type === 'crab') {
                        // Crabs stay on bottom
                        this.y = Math.max(sh * 0.82, Math.min(sh * 0.95, this.y));
                    } else {
                        this.y = Math.max(riverY2 + 15, Math.min(sh * 0.9, this.y));
                    }
                }
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
    // Spiders on ceiling
    for (let i = 0; i < 4; i++) caveEntities.push(new CaveEntity('spider'));
    // Bats
    for (let i = 0; i < 3; i++) caveEntities.push(new CaveEntity('bat'));
    // Glowworms
    for (let i = 0; i < 8; i++) caveEntities.push(new CaveEntity('glowworm'));
    // Crystals
    for (let i = 0; i < 5; i++) caveEntities.push(new CaveEntity('crystal'));
    // Cave fish (translucent)
    for (let i = 0; i < 2; i++) caveEntities.push(new CaveEntity('cavefish'));
    // Marine life in the underground river
    for (let i = 0; i < 2; i++) caveEntities.push(new CaveEntity('fish'));
    caveEntities.push(new CaveEntity('fish-gold'));
    caveEntities.push(new CaveEntity('squid'));
    for (let i = 0; i < 2; i++) caveEntities.push(new CaveEntity('crab'));
    caveEntities.push(new CaveEntity('pufferfish'));
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
