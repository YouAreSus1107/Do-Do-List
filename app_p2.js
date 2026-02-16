
/* ===== NATURE CANVAS (animated) ===== */
const nc = document.getElementById('nature-canvas'), ctx = nc.getContext('2d');
let frame = 0, grassBlades = [], fireflies = [], leaves = [], pollen = [];

function seedNature() {
    const w = W(), h = H(); grassBlades = []; fireflies = []; leaves = []; pollen = [];
    for (let i = 0; i < Math.floor(w / 4); i++)grassBlades.push({ x: Math.random() * w, h: 12 + Math.random() * 30, w: 1 + Math.random() * 1.5, hue: 90 + Math.random() * 50, off: Math.random() * 6.28, spd: 0.3 + Math.random() * 0.4, amp: 3 + Math.random() * 5 });
    for (let i = 0; i < 15; i++)fireflies.push({ x: Math.random() * w, y: h * 0.3 + Math.random() * h * 0.5, sz: 2 + Math.random() * 3, off: Math.random() * 6.28, spd: 0.5 + Math.random() * 1.5, dx: (Math.random() - 0.5) * 0.6, dy: (Math.random() - 0.5) * 0.4, hue: 50 + Math.random() * 20 });
    for (let i = 0; i < 10; i++)newLeaf();
    for (let i = 0; i < 25; i++)pollen.push({ x: Math.random() * w, y: Math.random() * h, sz: 1 + Math.random() * 2, sx: (Math.random() - 0.5) * 0.2, sy: -0.08 - Math.random() * 0.2, op: 0.2 + Math.random() * 0.3, hue: Math.random() > 0.5 ? 110 : 55 });
}
function newLeaf() { leaves.push({ x: Math.random() * nc.width, y: -15 - Math.random() * 60, sz: 4 + Math.random() * 6, sy: 0.25 + Math.random() * 0.5, sx: (Math.random() - 0.5) * 0.6, rot: Math.random() * 360, rs: (Math.random() - 0.5) * 2, off: Math.random() * 6.28, hue: [95, 105, 40, 30][Math.floor(Math.random() * 4)], sat: 50 + Math.random() * 40, op: 0.3 + Math.random() * 0.35 }) }
function animateNature() {
    frame++; const t = frame * 0.02; ctx.clearRect(0, 0, nc.width, nc.height); const gy = H();
    for (let i = leaves.length - 1; i >= 0; i--) { const l = leaves[i]; l.y += l.sy; l.x += l.sx + Math.sin(t + l.off) * 0.4; l.rot += l.rs; if (l.y > gy + 15) { leaves.splice(i, 1); newLeaf(); continue; } ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot * Math.PI / 180); ctx.globalAlpha = l.op; ctx.fillStyle = `hsl(${l.hue},${l.sat}%,40%)`; ctx.beginPath(); ctx.ellipse(0, 0, l.sz, l.sz * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    pollen.forEach(p => { p.x += p.sx + Math.sin(t * 0.5 + p.x * 0.01) * 0.12; p.y += p.sy; if (p.y < -10) { p.y = nc.height + 10; p.x = Math.random() * nc.width; } ctx.globalAlpha = p.op * (0.5 + Math.sin(t + p.x) * 0.5); ctx.fillStyle = `hsl(${p.hue},60%,70%)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill(); });
    fireflies.forEach(f => { f.x += f.dx + Math.sin(t * 0.3 + f.off) * 0.4; f.y += f.dy + Math.cos(t * 0.4 + f.off) * 0.3; if (f.x < -20) f.x = nc.width + 20; if (f.x > nc.width + 20) f.x = -20; if (f.y < nc.height * 0.2) f.y = nc.height * 0.7; if (f.y > nc.height) f.y = nc.height * 0.3; const p = Math.sin(t * f.spd + f.off), sz = f.sz * (0.6 + p * 0.4), a = 0.3 + p * 0.7; const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, sz * 5); g.addColorStop(0, `hsla(${f.hue},100%,75%,${a * 0.4})`); g.addColorStop(1, `hsla(${f.hue},100%,50%,0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, sz * 5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = a; ctx.fillStyle = `hsl(${f.hue},100%,85%)`; ctx.beginPath(); ctx.arc(f.x, f.y, sz, 0, Math.PI * 2); ctx.fill(); });
    grassBlades.forEach(b => { const sw = Math.sin(t * b.spd + b.off) * b.amp; ctx.globalAlpha = 0.5; ctx.strokeStyle = `hsl(${b.hue},55%,28%)`; ctx.lineWidth = b.w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.x, gy); ctx.quadraticCurveTo(b.x + sw * 0.5, gy - b.h * 0.5, b.x + sw, gy - b.h); ctx.stroke(); });
    ctx.globalAlpha = 1; requestAnimationFrame(animateNature);
}

/* ===== ENTITY SYSTEM ===== */
let entities = [];
const FAUNA = {
    deer: { spr: 'sprites/deer.svg', cat: 'ground', w: 90, h: 75, spd: 0.3, fSpd: 3, fR: 150, wt: { idle: 40, walking: 30, eating: 20, sleeping: 10 }, dur: { idle: [4, 9], walking: [5, 11], eating: [3, 7], sleeping: [6, 15] } },
    fox: { spr: 'sprites/fox.svg', cat: 'ground', w: 60, h: 48, spd: 0.5, fSpd: 4, fR: 130, wt: { idle: 30, walking: 35, eating: 15, sleeping: 20 }, dur: { idle: [3, 7], walking: [4, 8], eating: [2, 5], sleeping: [5, 12] } },
    rabbit: { spr: 'sprites/rabbit.svg', cat: 'ground', w: 50, h: 44, spd: 0.4, fSpd: 5, fR: 180, wt: { idle: 25, walking: 30, eating: 30, sleeping: 15 }, dur: { idle: [2, 5], walking: [3, 6], eating: [3, 6], sleeping: [4, 10] } },
    squirrel: { spr: 'sprites/squirrel.svg', cat: 'ground', w: 45, h: 40, spd: 0.7, fSpd: 5.5, fR: 160, wt: { idle: 20, walking: 35, eating: 35, sleeping: 10 }, dur: { idle: [1, 4], walking: [3, 6], eating: [3, 7], sleeping: [3, 8] } },
    butterfly: { spr: 'sprites/butterfly.svg', cat: 'air', w: 50, h: 40, spd: 0.6, fSpd: 3.5, fR: 120, wt: { idle: 15, flying: 65, resting: 20 }, dur: { idle: [1, 3], flying: [5, 12], resting: [2, 5] } },
    bird: { spr: 'sprites/bird.svg', cat: 'sky', w: 55, h: 35, spd: 1.2, fSpd: 4, fR: 140, wt: { flying: 60, gliding: 40 }, dur: { flying: [6, 14], gliding: [3, 7] } },
    bee: { spr: 'sprites/bee.svg', cat: 'air', w: 30, h: 30, spd: 0.8, fSpd: 4, fR: 100, wt: { flying: 55, hovering: 45 }, dur: { flying: [4, 9], hovering: [2, 5] } },
};
const FLORA_TYPES = ['tree', 'flower-pink', 'flower-yellow', 'flower-purple', 'fern', 'mushroom', 'grass'];
const FLORA_DEF = { tree: { spr: 'sprites/tree.svg', w: 80, h: 100 }, 'flower-pink': { spr: 'sprites/flower-pink.svg', w: 36, h: 44 }, 'flower-yellow': { spr: 'sprites/flower-yellow.svg', w: 34, h: 42 }, 'flower-purple': { spr: 'sprites/flower-purple.svg', w: 34, h: 42 }, fern: { spr: 'sprites/fern.svg', w: 40, h: 44 }, mushroom: { spr: 'sprites/mushroom.svg', w: 34, h: 38 }, grass: { spr: 'sprites/grass.svg', w: 42, h: 26 } };
const SPROUT_TYPES = ['flower-pink', 'flower-yellow', 'flower-purple', 'fern', 'mushroom', 'grass'];
const FAUNA_KEYS = Object.keys(FAUNA); const MAX_CT = { deer: 2, fox: 2, rabbit: 3, squirrel: 2, butterfly: 4, bird: 3, bee: 3 };

class FaunaEntity {
    constructor(type) {
        const d = FAUNA[type]; this.type = type; this.d = d; this.alive = true;
        this.w = d.w * (0.8 + Math.random() * 0.4); this.h = d.h * (0.8 + Math.random() * 0.4); this.face = Math.random() > 0.5 ? 1 : -1; this.vx = 0; this.vy = 0;
        this._respawn();
        this.state = this._pick(); this.timer = this._dur(); this.tx = this.x; this.ty = this.y; this.fleeing = false; this.fleeTmr = 0;
        this.el = document.createElement('div'); this.el.className = 'entity state-' + this.state; this.el.style.width = this.w + 'px'; this.el.style.height = this.h + 'px';
        this.el.style.position = 'absolute'; this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px';
        const img = document.createElement('img'); img.src = d.spr; img.alt = ''; img.draggable = false; this.el.appendChild(img);
        const z = document.createElement('div'); z.className = 'zzz'; z.textContent = 'Z z z'; this.el.appendChild(z);
        this._render(); document.getElementById('entity-layer').appendChild(this.el);
    }
    _pick() { const w = this.d.wt, ks = Object.keys(w), tot = ks.reduce((s, k) => s + w[k], 0); let r = Math.random() * tot; for (const k of ks) { r -= w[k]; if (r <= 0) return k; } return ks[0]; }
    _dur() { const r = this.d.dur[this.state]; return (r[0] + Math.random() * (r[1] - r[0])) * 60; }
    _transition() { this.state = this._pick(); this.timer = this._dur(); if (this.state === 'walking' || this.state === 'flying') this._newTgt(); if (this.state === 'gliding') { this.vx = (Math.random() > 0.5 ? 1 : -1) * this.d.spd * 1.5; this.vy = (Math.random() - 0.3) * 0.3; } }
    _newTgt() {
        const gy = GROUND_Y(), ww = W(), hh = H();
        if (this.d.cat === 'ground') { this.tx = 50 + Math.random() * (ww - 100); this.ty = gy + 20 + Math.random() * (hh * 0.25); }
        else if (this.d.cat === 'air') { this.tx = 50 + Math.random() * (ww - 100); this.ty = hh * 0.15 + Math.random() * hh * 0.3; }
        else { this.tx = this.x + 200 + Math.random() * 300; this.ty = H() * 0.05 + Math.random() * hh * 0.15; }
    }
    _respawn() {
        const gy = GROUND_Y(), ww = W(), hh = H();
        if (this.d.cat === 'ground') { this.x = 50 + Math.random() * (ww - 100); this.y = gy + 20 + Math.random() * (hh * 0.25); }
        else if (this.d.cat === 'air') { this.x = 50 + Math.random() * (ww - 100); this.y = hh * 0.2 + Math.random() * hh * 0.3; }
        else { this.x = -100; this.y = hh * 0.05 + Math.random() * hh * 0.15; }
    }
    update() {
        if (!this.alive) return;
        if (this.x < 10 && this.y < 10) this._respawn();
        if (this.d.cat !== 'ground') { const dx = this.x + this.w / 2 - mouseX, dy = this.y + this.h / 2 - mouseY, dist = Math.sqrt(dx * dx + dy * dy); if (dist < this.d.fR && dist > 0) { this.fleeing = true; this.fleeTmr = 80; const a = Math.atan2(dy, dx); this.vx = Math.cos(a) * this.d.fSpd; this.vy = Math.sin(a) * this.d.fSpd; this.face = this.vx > 0 ? -1 : 1; } }
        if (this.fleeing) { this.fleeTmr--; if (this.fleeTmr <= 0) { this.fleeing = false; this.vx *= 0.3; this.vy *= 0.3; } this.x += this.vx; this.y += this.vy; this.vx *= 0.97; this.vy *= 0.97; this._clamp(); this._render(); return; }
        this.timer--; if (this.timer <= 0) this._transition(); const sp = this.d.spd;
        switch (this.state) {
            case 'idle': case 'resting': case 'hovering': this.vx *= 0.9; this.vy *= 0.9; if (this.state === 'hovering') { this.x += Math.sin(Date.now() * 0.003 + this.x) * 0.3; this.y += Math.cos(Date.now() * 0.002 + this.y) * 0.2; } break;
            case 'walking': { const dx = this.tx - this.x, dy = this.ty - this.y, dd = Math.sqrt(dx * dx + dy * dy); if (dd > 5) { this.vx += (dx / dd) * sp * 0.1; this.vy += (dy / dd) * sp * 0.05; this.face = this.vx > 0 ? -1 : 1; } else { this.vx *= 0.8; this.vy *= 0.8; if (this.timer > 60) this._newTgt(); } this.vx *= 0.95; this.vy *= 0.95; break; }
            case 'flying': { const dx = this.tx - this.x, dy = this.ty - this.y, dd = Math.sqrt(dx * dx + dy * dy); if (dd > 10) { this.vx += (dx / dd) * sp * 0.12; this.vy += (dy / dd) * sp * 0.12; this.face = this.vx > 0 ? -1 : 1; } else this._newTgt(); this.vx *= 0.96; this.vy *= 0.96; this.y += Math.sin(Date.now() * 0.005 + this.x * 0.01) * 0.35; break; }
            case 'gliding': this.x += this.vx; this.y += this.vy; this.face = this.vx > 0 ? -1 : 1; this.y += Math.sin(Date.now() * 0.002) * 0.25; break;
            case 'eating': this.vx *= 0.9; this.vy *= 0.9; break; case 'sleeping': this.vx = 0; this.vy = 0; break;
        }
        this.x += this.vx; this.y += this.vy; this._clamp(); this._render();
    }
    _clamp() {
        if (this.x < -this.w) this.x = W() + 10; if (this.x > W() + this.w) this.x = -10;
        const gy = GROUND_Y(), hh = H();
        if (this.d.cat === 'ground') { this.y = Math.max(gy, Math.min(hh - this.h, this.y)); }
        else if (this.d.cat === 'sky') { this.y = Math.max(10, Math.min(hh * 0.3, this.y)); if (this.x > W() + 100) this._respawn(); }
        else { this.y = Math.max(hh * 0.08, Math.min(hh * 0.55, this.y)); }
    }
    _render() { this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px'; const st = this.fleeing ? 'fleeing' : this.state; this.el.className = 'entity state-' + st; let ex = ''; if (this.state === 'eating') ex = ' rotate(8deg)'; else if (this.state === 'sleeping') ex = ' rotate(5deg) scaleY(0.85)'; this.el.style.transform = ex + ' scaleX(' + this.face + ')'; }
    destroy() { this.alive = false; this.el.style.opacity = '0'; this.el.style.transition = 'opacity 0.5s'; setTimeout(() => { if (this.el.parentNode) this.el.remove(); }, 600); }
}

class FloraEntity {
    constructor(type, px, py) {
        const d = FLORA_DEF[type]; this.type = type; this.alive = true; this.w = d.w * (0.7 + Math.random() * 0.5); this.h = d.h * (0.7 + Math.random() * 0.5);
        this.x = px !== undefined ? px : 50 + Math.random() * (W() - 100); this.y = py !== undefined ? py : GROUND_Y() + 10 + Math.random() * (H() * 0.28);
        this.el = document.createElement('div'); this.el.className = 'entity flora sprouting'; this.el.style.position = 'absolute';
        this.el.style.width = this.w + 'px'; this.el.style.height = this.h + 'px';
        this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px';
        const img = document.createElement('img'); img.src = d.spr; img.alt = ''; img.draggable = false; this.el.appendChild(img); document.getElementById('entity-layer').appendChild(this.el);
    }
    destroy() { this.alive = false; this.el.style.transition = 'opacity 1.2s'; this.el.style.opacity = '0'; setTimeout(() => { if (this.el.parentNode) this.el.remove(); }, 1400); }
}

// Day/Night Logic
function isNight() { const h = new Date().getHours(); return h < 6 || h >= 18; }
function updateDayNight() {
    const night = isNight();
    document.body.classList.toggle('night-mode', night);
    const sun = document.querySelector('.env-sun');
    if (sun) {
        const targetSrc = night ? 'sprites/moon.svg' : 'sprites/sun.svg';
        if (!sun.src.endsWith(targetSrc)) sun.src = targetSrc;
    }
    if (night) {
        entities = entities.filter(e => {
            if (e instanceof FaunaEntity && (e.type === 'bee' || e.type === 'butterfly')) {
                e.el.remove(); return false;
            }
            return true;
        });
    }
}

function countF(t) { return entities.filter(e => e.type === t && e.alive).length; }
function countFlora() { return entities.filter(e => e instanceof FloraEntity && e.alive).length; }

function spawnInitial() {
    updateDayNight();
    for (let i = 0; i < 10; i++) entities.push(new FloraEntity(pick(FLORA_TYPES)));
    if (isNight()) {
        setTimeout(() => entities.push(new FaunaEntity('deer')), 800);
        setTimeout(() => entities.push(new FaunaEntity('fox')), 3500);
    } else {
        setTimeout(() => entities.push(new FaunaEntity('deer')), 800);
        setTimeout(() => entities.push(new FaunaEntity('rabbit')), 1500);
        setTimeout(() => entities.push(new FaunaEntity('butterfly')), 1000);
        setTimeout(() => entities.push(new FaunaEntity('butterfly')), 2200);
        setTimeout(() => entities.push(new FaunaEntity('bird')), 1800);
        setTimeout(() => entities.push(new FaunaEntity('bee')), 2800);
        setTimeout(() => entities.push(new FaunaEntity('fox')), 3500);
        setTimeout(() => entities.push(new FaunaEntity('squirrel')), 3000);
    }
}

function entityTimers() {
    setInterval(() => {
        if (isNight()) return; // Reduced spawning at night
        const t = pick(FAUNA_KEYS);
        if (t === 'bee' || t === 'butterfly') return; // Double check
        if (countF(t) < MAX_CT[t]) entities.push(new FaunaEntity(t));
    }, 9000 + Math.random() * 7000);

    // Separate timer for day spawning
    setInterval(() => {
        if (isNight()) return;
        const t = pick(['bee', 'butterfly', 'bird']);
        if (countF(t) < MAX_CT[t]) entities.push(new FaunaEntity(t));
    }, 12000);

    setInterval(() => { if (countFlora() < 14) entities.push(new FloraEntity(pick(FLORA_TYPES))); }, 7000 + Math.random() * 5000);
    setInterval(() => { const fl = entities.filter(e => e instanceof FloraEntity && e.alive); if (fl.length > 8) pick(fl).destroy(); }, 14000);
    setInterval(updateDayNight, 10000); // Check every 10s
}

function tickEntities() { entities = entities.filter(e => e.alive || (e.el && e.el.parentNode)); entities.forEach(e => { if (e.update) e.update(); }); requestAnimationFrame(tickEntities); }

/* ===== CLICK-DRAG SPROUT ===== */
const pc = document.getElementById('particle-canvas'), pctx = pc.getContext('2d'); let clickP = [], pAnim = false;
function initMouse() {
    document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
    document.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; mouseDown = false; });
    document.addEventListener('mousedown', e => { if (!e.target.closest('.app-container') && !e.target.closest('.event-overlay') && !e.target.closest('.physics-card')) { mouseDown = true; doSprout(e.clientX, e.clientY); } });
    document.addEventListener('mouseup', () => { mouseDown = false; dragSproutTick = 0; });
    document.addEventListener('mousemove', e => { if (!mouseDown || e.target.closest('.app-container')) return; dragSproutTick++; if (dragSproutTick % 8 === 0) doSprout(e.clientX, e.clientY); });
}
function doSprout(cx, cy) { burstP(cx, cy); const f = new FloraEntity(pick(SPROUT_TYPES), cx - 15 + Math.random() * 30, cy - 8); entities.push(f); setTimeout(() => f.destroy(), 5000 + Math.random() * 4000); }
function burstP(cx, cy) { const th = [{ c: ['#4ade80', '#22c55e', '#86efac', '#166534'], s: 'leaf' }, { c: ['#f472b6', '#ec4899', '#fce7f3', '#db2777'], s: 'petal' }, { c: ['#fbbf24', '#f59e0b', '#fef3c7', '#d97706'], s: 'pollen' }]; const t = pick(th); for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3.5; clickP.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, sz: 2 + Math.random() * 4, col: pick(t.c), life: 1, dec: 0.015 + Math.random() * 0.02, sh: t.s, rot: Math.random() * 360, rs: (Math.random() - 0.5) * 5 }); } if (!pAnim) { pAnim = true; animP(); } }
function animP() { pctx.clearRect(0, 0, pc.width, pc.height); clickP.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= p.dec; p.rot += p.rs; pctx.save(); pctx.translate(p.x, p.y); pctx.rotate(p.rot * Math.PI / 180); pctx.globalAlpha = Math.max(0, p.life); pctx.fillStyle = p.col; if (p.sh === 'leaf') { pctx.beginPath(); pctx.ellipse(0, 0, p.sz, p.sz * 0.35, 0.3, 0, Math.PI * 2); pctx.fill(); } else if (p.sh === 'petal') { pctx.beginPath(); pctx.ellipse(0, 0, p.sz * 0.7, p.sz * 0.5, 0.5, 0, Math.PI * 2); pctx.fill(); } else { pctx.beginPath(); pctx.arc(0, 0, p.sz * 0.4, 0, Math.PI * 2); cctx.fill(); } cctx.restore(); }); clickP = clickP.filter(p => p.op > 0 && p.y < cc.height + 50); if (confP.length) requestAnimationFrame(animP); else { confAnim = false; cctx.clearRect(0, 0, cc.width, cc.height); } }

/* ===== RANDOM EVENTS (V9) ===== */
let evtCool = false;
function triggerEvt() {
    if (evtCool || Math.random() > 0.3) return;
    evtCool = true; setTimeout(() => evtCool = false, 12000);
    const ev = pick(EVENTS);
    toast(ev.text);
    if (typeof spawnEventVisuals === 'function') spawnEventVisuals(ev.type);
}

function spawnEventVisuals(type) {
    if (document.hidden) return;
    switch (type) {
        case 'wind':
            if (typeof grassBlades !== 'undefined') { grassBlades.forEach(b => b.spd *= 4); setTimeout(() => grassBlades.forEach(b => b.spd /= 4), 3000); }
            break;
        case 'visitor':
            if (typeof entities !== 'undefined') entities.push(new FaunaEntity('fox'));
            break;
        case 'royal':
            if (typeof entities !== 'undefined') {
                const k = new FloraEntity('mushroom', W() * 0.5, H() * 0.6);
                k.w *= 2.5; k.h *= 2.5; k.el.style.width = k.w + 'px'; k.el.style.height = k.h + 'px'; k.el.style.filter = 'drop-shadow(0 0 15px gold)'; k.el.style.zIndex = 100;
                entities.push(k);
            }
            break;
        case 'portal':
            document.body.classList.add('event-portal');
            setTimeout(() => document.body.classList.remove('event-portal'), 4000);
            break;
        case 'chaos':
            if (typeof entities !== 'undefined') { for (let i = 0; i < 4; i++) setTimeout(() => entities.push(new FaunaEntity('squirrel')), i * 300); }
            break;
        case 'storm':
            document.body.classList.add('event-storm');
            setTimeout(() => document.body.classList.remove('event-storm'), 5000);
            break;
        case 'cosmic':
            if (typeof fireflies !== 'undefined') { for (let i = 0; i < 15; i++) fireflies.push({ x: Math.random() * W(), y: Math.random() * H(), sz: 4, off: Math.random(), spd: 2, dx: 0, dy: 0, hue: 60 }); }
            break;
    }
}
