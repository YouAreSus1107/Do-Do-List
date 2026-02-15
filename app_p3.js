
/* ===== PHYSICS CARD SYSTEM & CONFETTI (Clean Core) ===== */

/* ===== PHYSICS CARD SYSTEM ===== */
let physicsCards = [], grabCard = null, grabOff = { x: 0, y: 0 }, velHistory = [];
const GRAVITY = 0.6, BOUNCE = 0.4, FRICTION = 0.98, GROUND_PAD = 60, THROW_THRESH = 5, CARD_W = 340, CARD_H = 62;

class PhysicsCard {
    constructor(el, task, origIdx, x, y) {
        this.el = el; this.task = task; this.taskId = task.id; this.origIdx = origIdx;
        this.w = el.offsetWidth || CARD_W; this.h = el.offsetHeight || CARD_H;
        this.x = x !== undefined ? x : W() / 2 - this.w / 2; this.y = y !== undefined ? y : H() / 2 - this.h / 2;
        this.vx = 0; this.vy = 0; this.grounded = false; this.rot = 0; this.rv = 0;
        el.classList.add('physics-card', 'thrown');
        el.style.position = 'fixed'; el.style.left = this.x + 'px'; el.style.top = this.y + 'px';
        el.style.width = this.w + 'px'; el.style.zIndex = '9999';
        el.style.transform = 'none';
        if (!el.parentNode || el.parentNode !== document.body) document.body.appendChild(el);
        this._sync();
    }
    update() {
        if (this.grounded) {
            if (grabCard === this) this._sync(); // Sync if grabbed
            return;
        }
        this.vy += GRAVITY; this.vx *= FRICTION; this.x += this.vx; this.y += this.vy; this.rot += this.rv; this.rv *= 0.98;
        const floor = H() - this.h - GROUND_PAD;
        if (this.y >= floor) {
            this.y = floor; this.vy *= -BOUNCE; this.vx *= 0.9; this.rv *= 0.7;
            if (Math.abs(this.vy) < 1.5) {
                this.vy = 0; this.vx *= 0.92; this.rv = 0;
                this.rot = (this.rot % 360 + 360) % 360; if (this.rot > 180) this.rot -= 360; this.rot *= 0.8;
                if (Math.abs(this.vx) < 0.3 && Math.abs(this.rot) < 2) {
                    this.grounded = true; this.rot = 0;
                    this.el.classList.remove('thrown'); this.el.classList.add('grounded');
                }
            }
        }
        if (this.x < 0) { this.x = 0; this.vx *= -0.5; } if (this.x > W() - this.w) { this.x = W() - this.w; this.vx *= -0.5; }
        this._sync();
    }
    _sync() { this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px'; this.el.style.transform = `rotate(${this.rot}deg)`; }
    returnToList() { this.el.remove(); physicsCards = physicsCards.filter(c => c !== this); renderTasks(); }
}
function resolveCollisions() {
    for (let i = 0; i < physicsCards.length; i++) {
        const a = physicsCards[i];
        for (let j = i + 1; j < physicsCards.length; j++) {
            const b = physicsCards[j];
            const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x); const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
            if (ox > 0 && oy > 0) { const cx1 = a.x + a.w / 2, cx2 = b.x + b.w / 2, cy1 = a.y + a.h / 2, cy2 = b.y + b.h / 2; if (oy < ox) { const push = oy / 2 + 0.5; if (cy1 < cy2) { a.y -= push; b.y += push; } else { a.y += push; b.y -= push; } if (!a.grounded) a.vy *= -0.3; if (!b.grounded) b.vy *= -0.3; } else { const push = ox / 2 + 0.5; if (cx1 < cx2) { a.x -= push; b.x += push; } else { a.x += push; b.x -= push; } if (!a.grounded) a.vx *= -0.3; if (!b.grounded) b.vx *= -0.3; } a._sync(); b._sync(); }
        }
    }
}
function physicsLoop() { physicsCards.forEach(c => c.update()); resolveCollisions(); requestAnimationFrame(physicsLoop); }

/* ===== CONFETTI ===== */
const cc = document.getElementById('confetti-canvas'), cctx = cc.getContext('2d'); let confP = [], confAnim = false;
function confetti() { const cols = ['#4ade80', '#22c55e', '#f472b6', '#fbbf24', '#fb923c', '#c084fc', '#67e8f9']; for (let i = 0; i < 50; i++)confP.push({ x: cc.width * 0.3 + Math.random() * cc.width * 0.4, y: cc.height + 10, vx: (Math.random() - 0.5) * 10, vy: -(8 + Math.random() * 12), color: pick(cols), sz: 3 + Math.random() * 7, rot: Math.random() * 360, rs: (Math.random() - 0.5) * 8, g: 0.22, op: 1, sh: ['c', 'l', 'p'][Math.floor(Math.random() * 3)] }); if (!confAnim) { confAnim = true; animConf(); } }
function animConf() { cctx.clearRect(0, 0, cc.width, cc.height); confP.forEach(p => { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.rs; p.op -= 0.009; cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot * Math.PI / 180); cctx.globalAlpha = Math.max(0, p.op); cctx.fillStyle = p.color; if (p.sh === 'l') { cctx.beginPath(); cctx.ellipse(0, 0, p.sz, p.sz * 0.35, 0.3, 0, Math.PI * 2); cctx.fill(); } else if (p.sh === 'p') { cctx.beginPath(); cctx.ellipse(0, 0, p.sz * 0.8, p.sz * 0.4, 0, 0, Math.PI * 2); cctx.fill(); } else { cctx.beginPath(); cctx.arc(0, 0, p.sz * 0.4, 0, Math.PI * 2); cctx.fill(); } cctx.restore(); }); confP = confP.filter(p => p.op > 0 && p.y < cc.height + 50); if (confP.length) requestAnimationFrame(animConf); else { confAnim = false; cctx.clearRect(0, 0, cc.width, cc.height); } }
