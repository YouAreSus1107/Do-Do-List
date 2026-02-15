
/* TASKVIBE v18 - Core Logic & Supabase Integration */

// Global State
let tasks = JSON.parse(localStorage.getItem('taskvibe-tasks') || '[]');
let currentView = 'list', calendarDate = new Date(), selectedCalDate = null, phIdx = 0;
let mouseX = -9999, mouseY = -9999, mouseDown = false, dragSproutTick = 0;
const W = () => Math.max(100, window.innerWidth), H = () => Math.max(100, window.innerHeight), GROUND_Y = () => H() * 0.68;
const TASK_SHAPES = ['shape-leaf', 'shape-cloud', 'shape-stone', 'shape-flower', 'shape-mushroom', 'shape-crystal'];
const SHAPE_SPRITES = { 'shape-leaf': 'sprites/fern.svg', 'shape-cloud': 'sprites/cloud.svg', 'shape-stone': 'sprites/mushroom.svg', 'shape-flower': 'sprites/flower-pink.svg', 'shape-mushroom': 'sprites/mushroom.svg', 'shape-crystal': 'sprites/flower-purple.svg' };
const placeholders = ["Plant a new task...", "What needs growing today?", "Scatter some seeds...", "Whisper to the forest...", "The creatures await...", "Nature doesn't procrastinate."];
const completionMsgs = ["The forest celebrates!", "A flower blooms!", "The woodland creatures applaud!", "Task composted!", "The oaks nod approval.", "A butterfly was born!"];
const emptyMsgs = [{ s: 'sprites/deer.svg', t: 'The forest is quiet...', u: 'Plant a task and watch it sprout!' }, { s: 'sprites/rabbit.svg', t: 'Even the bunnies nap', u: 'Add something!' }, { s: 'sprites/fox.svg', t: 'A fox watches...', u: 'Scatter some tasks.' }];
const taglines = ["Nature is working. You should too.", "Grow your tasks, grow yourself.", "The forest whispers: do the thing.", "Wild productivity, naturally."];
const EVENTS = [
    { text: "A MYSTIC WIND blows through...", type: 'wind', dur: 6000 },
    { text: "A TRAVELING MERCHANT offers wares.", type: 'visitor', dur: 8000 },
    { text: "THE MUSHROOM KING demands tribute!", type: 'royal', dur: 7000 },
    { text: "A PORTAL OPENED! Tasks exist in 47 dimensions.", type: 'portal', dur: 6000 },
    { text: "A COSMIC SQUIRREL judged you.", type: 'chaos', dur: 5000 },
    { text: "HEAVY RAIN brings growth.", type: 'storm', dur: 6000 },
    { text: "A SHOOTING STAR grants focus.", type: 'cosmic', dur: 5000 }
];
const pick = a => a[Math.floor(Math.random() * a.length)];
function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5) }
function todayStr() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
function fmtDate(s) { if (!s) return ''; const d = new Date(s + 'T00:00:00'), m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return m[d.getMonth()] + ' ' + d.getDate() }
function save() { localStorage.setItem('taskvibe-tasks', JSON.stringify(tasks)) }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML }

/* ===== LANDSCAPE CANVAS (static) ===== */
const lc = document.getElementById('landscape-canvas'), lctx = lc.getContext('2d');
let treelineSeeds1 = [], treelineSeeds2 = [], forestTrees = [], landscapeSeeded = false;

function hillY(x, baseY, amp, seed) { return baseY + Math.sin(x * 0.004 + seed) * amp * 0.5 + Math.sin(x * 0.01 + seed * 3) * amp * 0.3 + Math.sin(x * 0.002) * amp * 0.4; }

function seedLandscape() {
    const w = W(), h = H();
    treelineSeeds1 = []; treelineSeeds2 = []; forestTrees = [];
    for (let x = 0; x < w; x += 14 + Math.random() * 10)treelineSeeds1.push({ x: x / w, h: 10 + Math.random() * 18 });
    for (let x = 0; x < w; x += 12 + Math.random() * 9)treelineSeeds2.push({ x: x / w, h: 8 + Math.random() * 16 });
    for (let i = 0; i < 12; i++) { forestTrees.push({ x: Math.random() * 0.35, sz: 30 + Math.random() * 40, trunkW: 3 + Math.random() * 3 }); }
    landscapeSeeded = true;
}

function drawStaticLandscape() {
    const w = lc.width, h = lc.height, g = GROUND_Y();
    lctx.clearRect(0, 0, w, h);
    // Sky
    const sky = lctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#4a7c9b'); sky.addColorStop(0.3, '#6b9dba'); sky.addColorStop(0.6, '#8fbdd4'); sky.addColorStop(1, '#b8d8c8');
    lctx.fillStyle = sky; lctx.fillRect(0, 0, w, h * 4);

    // Background Mountains
    drawMountains(lctx, h * 0.28, w, 90);

    // FIX: All hills fully opaque to prevent transparency clipping
    drawHillFill(lctx, h * 0.35, 80, '#4a7a6a', 1.0, 0.3, w, h);
    drawHillFill(lctx, h * 0.40, 60, '#3d6b5a', 1.0, 0.5, w, h);

    // Treeline 1
    lctx.globalAlpha = 0.9; lctx.fillStyle = '#2d5a48';
    treelineSeeds1.forEach(t => { const base = hillY(t.x * w, h * 0.35, 80, 0.3); lctx.beginPath(); lctx.moveTo(t.x * w, base - t.h); lctx.lineTo(t.x * w - 5, base); lctx.lineTo(t.x * w + 5, base); lctx.closePath(); lctx.fill(); });

    drawHillFill(lctx, h * 0.48, 70, '#2d6840', 1.0, 0.7, w, h);
    drawHillFill(lctx, h * 0.52, 50, '#267038', 1.0, 1.0, w, h);

    // Treeline 2
    lctx.globalAlpha = 0.9; lctx.fillStyle = '#256048';
    treelineSeeds2.forEach(t => { const base = hillY(t.x * w, h * 0.52, 50, 1.0); lctx.beginPath(); lctx.moveTo(t.x * w, base - t.h); lctx.lineTo(t.x * w - 4, base); lctx.lineTo(t.x * w + 4, base); lctx.closePath(); lctx.fill(); });
    lctx.globalAlpha = 1;

    // Pond
    drawPond(lctx, w * 0.35, g - 10, w * 0.18, h * 0.03);
    // River
    lctx.save(); lctx.globalAlpha = 0.4; lctx.strokeStyle = '#3a8898'; lctx.lineWidth = 5; lctx.lineCap = 'round';
    lctx.beginPath(); lctx.moveTo(w * 0.46, g - 8); lctx.quadraticCurveTo(w * 0.58, g + 20, w * 0.7, g + 40); lctx.stroke(); lctx.restore();

    // Ground fill
    const grd = lctx.createLinearGradient(0, g - 30, 0, h);
    grd.addColorStop(0, '#2a6b32'); grd.addColorStop(0.3, '#1e5a28'); grd.addColorStop(1, '#153d1c');
    lctx.fillStyle = grd; lctx.beginPath(); lctx.moveTo(0, g);
    for (let x = 0; x <= w; x += 4) { const yo = Math.sin(x * 0.008) * 12 + Math.sin(x * 0.02) * 5 + Math.sin(x * 0.003) * 20; lctx.lineTo(x, g + yo); }
    lctx.lineTo(w, h * 4); lctx.lineTo(0, h * 4); lctx.closePath(); lctx.fill();

    // Cave
    if (typeof drawNewCave !== 'undefined') drawNewCave(lctx, w * 0.85, g - 10);
    // Logs/Rocks/Forest
    drawLogs(lctx, w * 0.45, g + 45); drawLogs(lctx, w * 0.52, g + 50);
    drawRock(lctx, w * 0.6, g + 25, 22, 15, '#4d4d45'); drawRock(lctx, w * 0.2, g + 10, 35, 22, '#636358');
    drawForestRegion(lctx, g, w);
    drawMush(lctx, w * 0.15, g + 55, 6); drawMush(lctx, w * 0.55, g + 35, 5);
}

function drawMountains(c, by, w, mH) {
    c.globalAlpha = 1.0;
    const pks = [[0.1, 0.6], [0.25, 0.9], [0.4, 0.7], [0.55, 1], [0.7, 0.8], [0.85, 0.65], [0.95, 0.5]];
    ['#507a8a', '#406a7a', '#305a6a'].forEach((cl, ci) => {
        c.fillStyle = cl; c.beginPath(); c.moveTo(0, by + 20 * ci);
        pks.forEach(([px, ph]) => c.lineTo(px * w, by - mH * ph + ci * 25));
        c.lineTo(w, by + 20 * ci); c.lineTo(w, by + 200); c.lineTo(0, by + 200); c.closePath(); c.fill();
        if (ci === 0) { c.fillStyle = 'rgba(255,255,255,0.2)'; pks.forEach(([px, ph]) => { const t = by - mH * ph; c.beginPath(); c.moveTo(px * w, t); c.lineTo(px * w - 12, t + 15); c.lineTo(px * w + 12, t + 15); c.closePath(); c.fill(); }); }
    });
}
function drawHillFill(c, y, amp, col, op, seed, w, h) { c.globalAlpha = op; c.fillStyle = col; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 3)c.lineTo(x, hillY(x, y, amp, seed)); c.lineTo(w, h * 4); c.lineTo(0, h * 4); c.closePath(); c.fill(); c.globalAlpha = 1; }
function drawPond(c, cx, cy, rx, ry) { c.save(); c.globalAlpha = 0.55; const pg = c.createRadialGradient(cx, cy, 0, cx, cy, rx); pg.addColorStop(0, '#3a8a9a'); pg.addColorStop(0.6, '#2a7080'); pg.addColorStop(1, '#1a5060'); c.fillStyle = pg; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 0.12; c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(cx - rx * 0.3 + i * rx * 0.3, cy, 6, 2, 0.3, 0, Math.PI * 2); c.fill(); } c.restore(); }
function drawRock(c, x, y, rw, rh, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x - rw / 2, y); c.quadraticCurveTo(x - rw / 2, y - rh, x - rw * 0.2, y - rh); c.quadraticCurveTo(x, y - rh - 5, x + rw * 0.3, y - rh + 2); c.quadraticCurveTo(x + rw / 2, y - rh + 5, x + rw / 2, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(x - rw * 0.3, y - rh + 3); c.quadraticCurveTo(x - rw * 0.1, y - rh - 2, x + rw * 0.1, y - rh + 4); c.lineTo(x - rw * 0.1, y - rh * 0.5); c.closePath(); c.fill(); }
function drawMush(c, x, y, sz) { c.fillStyle = '#c4956a'; c.fillRect(x - 1, y - sz, 2, sz); c.fillStyle = '#d44'; c.beginPath(); c.arc(x, y - sz, sz * 0.7, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(x - 2, y - sz - 1, 1.5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 2, y - sz - 2, 1, 0, Math.PI * 2); c.fill(); }
function drawLogs(c, x, y) { c.fillStyle = '#5a3d20'; c.beginPath(); c.ellipse(x, y, 30, 6, 0.1, 0, Math.PI * 2); c.fill(); c.fillStyle = '#4a2d15'; c.beginPath(); c.ellipse(x - 30, y - 1, 6, 6, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#6a4d30'; c.lineWidth = 0.8;[3, 5].forEach(r => { c.beginPath(); c.arc(x - 30, y - 1, r, 0, Math.PI * 2); c.stroke(); }); c.fillStyle = '#3a8a3a'; c.globalAlpha = 0.5; c.beginPath(); c.ellipse(x - 10, y - 5, 8, 3, 0, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(x + 8, y - 4, 6, 2, 0.2, Math.PI, 0); c.fill(); c.globalAlpha = 1; }
function drawForestRegion(c, g, w) {
    forestTrees.forEach(t => { const tx = t.x * w; c.fillStyle = '#4a2d15'; c.fillRect(tx - t.trunkW / 2, g + 5, t.trunkW, t.sz * 0.4);['#1a5c2a', '#1e6b30', '#227a35'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(tx, g + 5 - i * t.sz * 0.18, t.sz * 0.22 - i * 3, 0, Math.PI * 2); c.fill(); }); });
    c.fillStyle = '#1a4a20'; c.globalAlpha = 0.6; for (let x = 0; x < w * 0.35; x += 8 + Math.random() * 6) { const bh = 5 + Math.random() * 10; c.beginPath(); c.ellipse(x, g + 15, 4, bh, 0, Math.PI, 0); c.fill(); } c.globalAlpha = 1;
}
function drawNewCave(c, cx, cy) {
    c.fillStyle = '#18181e'; c.beginPath(); c.moveTo(cx - 70, cy + 40); c.lineTo(cx - 50, cy - 40); c.lineTo(cx, cy - 65); c.lineTo(cx + 50, cy - 45); c.lineTo(cx + 80, cy + 40); c.closePath(); c.fill();
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, 70); g.addColorStop(0, '#050508'); g.addColorStop(1, '#18181e'); c.fillStyle = g; c.beginPath(); c.moveTo(cx - 55, cy + 40); c.lineTo(cx - 35, cy - 25); c.lineTo(cx, cy - 50); c.lineTo(cx + 35, cy - 30); c.lineTo(cx + 65, cy + 40); c.closePath(); c.fill();
    c.fillStyle = '#2a2a35';[[-25, 18], [0, 25], [25, 20]].forEach(([dx, h]) => { c.beginPath(); c.moveTo(cx + dx - 6, cy - 45); c.lineTo(cx + dx, cy - 45 + h); c.lineTo(cx + dx + 6, cy - 45); c.fill(); });
    const cols = ['#b388ff', '#ce93d8', '#80cbc4'];[[-40, 20, 0], [-15, 25, 1], [20, 22, 2], [45, 18, 0]].forEach(([dx, h, ci]) => { c.globalAlpha = 0.7; c.fillStyle = cols[ci]; c.beginPath(); c.moveTo(cx + dx, cy + 35); c.lineTo(cx + dx + 4, cy + 35 - h); c.lineTo(cx + dx + 8, cy + 35); c.fill(); }); c.globalAlpha = 1;
}

/* ===== DOM REFS ===== */
const $ = id => document.getElementById(id);
const taskInput = $('task-input'), taskDate = $('task-date'), addBtn = $('add-btn'), taskList = $('task-list'), emptyState = $('empty-state'), listView = $('list-view'), calView = $('calendar-view'), btnList = $('btn-list-view'), btnCal = $('btn-calendar-view'), calTitle = $('cal-month-title'), calGrid = $('calendar-grid'), calPrev = $('cal-prev'), calNext = $('cal-next'), dayDetail = $('day-detail'), dayTitle = $('day-detail-title'), dayTasks = $('day-detail-tasks'), closeDetail = $('close-detail'), toastBox = $('toast-container'), tagEl = $('tagline');

/* ===== TASK CRUD ===== */
function addTask() {
    const text = taskInput.value.trim(); if (!text) { taskInput.classList.add('shake'); setTimeout(() => taskInput.classList.remove('shake'), 500); return; }
    const shape = pick(TASK_SHAPES);
    const newTask = { id: genId(), text, completed: false, date: taskDate.value || null, createdAt: Date.now(), shape, style: 'normal' };
    tasks.unshift(newTask);
    save();
    if (window.saveCloudTask) window.saveCloudTask(newTask, 0); // V18 Sync
    taskInput.value = ''; renderTasks(); renderCal(); toast(`"${text.length > 25 ? text.slice(0, 25) + '...' : text}" sprouted!`); triggerEvt(); if (countFlora() < 17) entities.push(new FloraEntity(pick(FLORA_TYPES))); entities.push(new FaunaEntity(pick(['butterfly', 'bee'])));
}
function toggleTask(id) {
    const t = tasks.find(t => t.id === id); if (!t) return;
    t.completed = !t.completed;
    save();
    if (window.saveCloudTask) window.saveCloudTask(t); // V18 Sync
    if (t.completed) { toast(pick(completionMsgs)); confetti(); entities.push(new FaunaEntity('butterfly')); } renderTasks(); renderCal(); if (selectedCalDate) showDay(selectedCalDate);
}
function toggleTaskStyle(id) {
    const t = tasks.find(t => t.id === id); if (!t) return;
    t.style = (t.style === 'fancy') ? 'normal' : 'fancy';
    save();
    if (window.saveCloudTask) window.saveCloudTask(t); // V18 Sync
    renderTasks();
}
function deleteTask(id) {
    const taskToDelete = tasks.find(t => t.id === id);
    const c = document.querySelector(`[data-id="${id}"]`);
    const doDelete = () => {
        if (taskToDelete && window.deleteCloudTaskByDbId) window.deleteCloudTaskByDbId(taskToDelete.db_id); // V18 Sync
        tasks = tasks.filter(t => t.id !== id); save(); renderTasks(); renderCal(); if (selectedCalDate) showDay(selectedCalDate);
    };
    if (c) { c.classList.add('task-removing'); setTimeout(doDelete, 500); } else { doDelete(); }
}

/* ===== RENDER TASKS (GROVE VIEW - TODAY ONLY) ===== */
function renderTasks() {
    taskList.innerHTML = '';
    const ts = todayStr();
    // Filter: Show undated or today's tasks
    const visibleTasks = tasks.filter(t => !t.date || t.date === ts);

    if (!visibleTasks.length) { emptyState.classList.add('visible'); const m = pick(emptyMsgs); emptyState.querySelector('.empty-sprite').src = m.s; emptyState.querySelector('h3').textContent = m.t; emptyState.querySelector('p').textContent = m.u; return; }
    emptyState.classList.remove('visible');

    visibleTasks.forEach((task, i) => {
        const shape = task.shape || pick(TASK_SHAPES), src = SHAPE_SPRITES[shape] || 'sprites/fern.svg';
        const c = document.createElement('div'); c.className = `task-card ${shape}${task.completed ? ' completed' : ''}${task.style === 'fancy' ? ' task-fancy' : ''}`; c.dataset.id = task.id;
        // No entrance animation for completed tasks
        if (!task.completed) c.style.animationDelay = `${i * 0.06}s`;
        else c.style.animation = 'none';
        c.innerHTML = `<span class="drag-handle">&#x2807;</span><img src="${src}" class="task-shape-sprite" alt="" draggable="false"><label class="task-checkbox"><input type="checkbox" ${task.completed ? 'checked' : ''}><span class="checkmark"></span></label><span class="task-text">${esc(task.text)}</span>${task.date ? `<span class="task-date-badge">${fmtDate(task.date)}</span>` : ''}<div class="task-actions"><button class="task-style-btn" title="Toggle Style"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></button><button class="task-delete" title="Delete"><svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>`;
        c.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTask(task.id));
        c.querySelector('.task-style-btn').addEventListener('click', e => { e.stopPropagation(); toggleTaskStyle(task.id); });
        c.querySelector('.task-delete').addEventListener('click', e => { e.stopPropagation(); deleteTask(task.id); });
        c.addEventListener('mousedown', e => {
            if (e.target.closest('.task-checkbox') || e.target.closest('.task-delete') || e.target.closest('.task-style-btn')) return;
            e.preventDefault();
            const r = c.getBoundingClientRect(); grabOff = { x: e.clientX - r.left, y: e.clientY - r.top };
            const clone = c.cloneNode(true); clone.style.position = 'fixed'; clone.style.left = r.left + 'px'; clone.style.top = r.top + 'px'; clone.style.width = r.width + 'px'; clone.style.zIndex = '9999'; clone.style.pointerEvents = 'none'; clone.classList.add('grabbed'); clone.style.animation = 'none';
            document.body.appendChild(clone);
            const pc2 = new PhysicsCard(clone, task, i, r.left, r.top); pc2.grounded = true; grabCard = pc2; physicsCards.push(pc2); velHistory = []; c.style.opacity = '0';

            const onMove = ev => { if (!grabCard) return; const nx = ev.clientX - grabOff.x, ny = ev.clientY - grabOff.y; grabCard.x = nx; grabCard.y = ny; grabCard._sync(); velHistory.push({ x: ev.clientX, y: ev.clientY, t: Date.now() }); if (velHistory.length > 8) velHistory.shift(); const cards = Array.from(taskList.children).filter(el => el !== c && !el.classList.contains('task-placeholder')); const myY = ev.clientY; let insIdx = cards.length; for (let k = 0; k < cards.length; k++) { const cr = cards[k].getBoundingClientRect(); if (myY < cr.top + cr.height / 2) { insIdx = k; break; } } const oldP = taskList.querySelector('.task-placeholder'); if (oldP) oldP.remove(); const ph = document.createElement('div'); ph.className = 'task-placeholder'; if (insIdx >= cards.length) taskList.appendChild(ph); else taskList.insertBefore(ph, cards[insIdx]); };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); const oldP = taskList.querySelector('.task-placeholder');
                let nextElId = null;
                if (oldP) {
                    const nextEl = oldP.nextElementSibling;
                    if (nextEl) nextElId = nextEl.dataset.id;
                    oldP.remove();
                }
                if (!grabCard) return; c.style.opacity = ''; let tvx = 0, tvy = 0; if (velHistory.length >= 2) { const a = velHistory[0], b = velHistory[velHistory.length - 1], dt = Math.max(1, b.t - a.t); tvx = (b.x - a.x) / dt * 16; tvy = (b.y - a.y) / dt * 16; } const speed = Math.sqrt(tvx * tvx + tvy * tvy);

                if (speed > THROW_THRESH && !grabCard.task.db_id) { // Only throw if not synced/important? Or handle throw delete.
                    // THROW
                    grabCard.vx = tvx; grabCard.vy = tvy; grabCard.rv = (tvx + tvy) * 0.3; grabCard.grounded = false; grabCard.el.classList.remove('grabbed'); grabCard.el.classList.add('thrown'); grabCard.el.style.pointerEvents = 'auto';
                    tasks = tasks.filter(t => t.id !== task.id);
                    save();
                    if (window.deleteCloudTaskByDbId) window.deleteCloudTaskByDbId(task.db_id); // V18 Sync Throw = Delete from list
                    renderTasks();
                } else {
                    // DROP / REORDER
                    if (nextElId === undefined) {
                        // logic fallthrough for re-render
                    } else {
                        // Remove from current pos
                        const curIdx = tasks.findIndex(x => x.id === task.id);
                        if (curIdx > -1) tasks.splice(curIdx, 1);

                        // Find target pos
                        let targetIdx = tasks.length;
                        if (nextElId) {
                            const tIdx = tasks.findIndex(x => x.id === nextElId);
                            if (tIdx > -1) targetIdx = tIdx;
                        }
                        tasks.splice(targetIdx, 0, task);
                        save();
                        if (window.syncAllTasksToCloud) window.syncAllTasksToCloud(); // V18 Sync Reorder
                    }
                    grabCard.el.remove(); physicsCards = physicsCards.filter(p => p !== grabCard); renderTasks();
                } grabCard = null;
            };
            document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
        });
        taskList.appendChild(c);
    });
}

function switchView(v) { currentView = v; listView.classList.toggle('active', v === 'list'); calView.classList.toggle('active', v === 'calendar'); btnList.classList.toggle('active', v === 'list'); btnCal.classList.toggle('active', v === 'calendar'); if (v === 'calendar') renderCal(); dayDetail.style.display = 'none'; }
function renderCal() {
    const y = calendarDate.getFullYear(), m = calendarDate.getMonth(); const ms = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    calTitle.textContent = `${ms[m]} ${y}`; calGrid.querySelectorAll('.cal-cell').forEach(c => c.remove());
    const fd = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(), ts = todayStr();
    for (let i = 0; i < fd; i++) { const e = document.createElement('div'); e.className = 'cal-cell empty'; calGrid.appendChild(e); }
    for (let d = 1; d <= dim; d++) {
        const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; const c = document.createElement('div'); c.className = 'cal-cell'; if (ds === ts) c.classList.add('today'); const dt = tasks.filter(t => t.date === ds); if (dt.length) c.classList.add('has-tasks'); if (selectedCalDate === ds) c.classList.add('selected');
        c.innerHTML = `<span>${d}</span>${dt.length ? `<div class="cal-task-count"><img src="sprites/fern.svg" class="cal-icon"> ${dt.length}</div>` : ''}`;
        c.addEventListener('click', () => { selectedCalDate = ds; taskDate.value = ds; renderCal(); showDay(ds); }); calGrid.appendChild(c);
    }
}
function navMonth(d) { calendarDate.setMonth(calendarDate.getMonth() + d); selectedCalDate = null; dayDetail.style.display = 'none'; renderCal(); }

function showDay(ds) {
    dayDetail.style.display = 'block';
    dayDetail.innerHTML = `
        <button id="close-detail" title="Close">&times;</button>
        <h3>${fmtDate(ds)}</h3>
        <input type="text" class="day-task-input" id="day-input" placeholder="Add task..." autocomplete="off">
        <div id="day-list-items"></div>
    `;
    const list = dayDetail.querySelector('#day-list-items');
    const inp = dayDetail.querySelector('#day-input');

    dayDetail.querySelector('#close-detail').addEventListener('click', () => {
        dayDetail.style.display = 'none'; selectedCalDate = null; renderCal();
    });

    const renderDayList = () => {
        list.innerHTML = '';
        const dt = tasks.filter(t => t.date === ds);
        if (!dt.length) {
            list.innerHTML = '<p style="opacity:0.6;font-size:0.9rem;text-align:center;">No tasks planned.</p>';
        } else {
            dt.forEach(t => {
                const el = document.createElement('div'); el.className = 'day-task-item';
                el.innerHTML = `<img src="${SHAPE_SPRITES[t.shape]}" alt="" draggable="false"><span style="${t.completed ? 'text-decoration:line-through;opacity:0.6' : ''}">${esc(t.text)}</span><button class="day-task-del" title="Delete">&times;</button>`;
                el.addEventListener('click', () => { toggleTask(t.id); renderDayList(); });
                el.querySelector('.day-task-del').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.deleteCloudTaskByDbId && t.db_id) window.deleteCloudTaskByDbId(t.db_id); // V18 Sync
                    tasks = tasks.filter(x => x.id !== t.id);
                    save(); renderTasks(); renderCal(); renderDayList();
                });
                list.appendChild(el);
            });
        }
    };
    renderDayList();

    inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && inp.value.trim()) {
            const text = inp.value.trim();
            const newTask = { id: genId(), text, completed: false, date: ds, createdAt: Date.now(), shape: pick(TASK_SHAPES), style: 'normal' };
            tasks.unshift(newTask);
            if (window.saveCloudTask) window.saveCloudTask(newTask, 0); // V18 Sync
            save(); renderTasks(); renderCal(); renderDayList(); inp.value = '';
        }
    });
    inp.focus();
}

function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; toastBox.appendChild(t); setTimeout(() => { if (t.parentNode) t.remove(); }, 3200); }

/* ===== FLIP CLOCK & TRICIA ===== */
let prevDigits = '------';
let triciaLines = [];
let triciaIdx = 0;
let dialogueEl = null;

const DEFAULT_TRICIA = ["I think I fell head over heels for snake jazz.", "Snake jazz is like the soundtrack of my life.", "Summer, your playlist is so supes shook.", "We should totally start a vibe club.", "Why does no one appreciate snake jazz like I do?", "Ugh, math class is so not my vibe.", "I swear Jerry’s bees are, like, goal energy.", "Is it weird that I think bees are aesthetic?", "Summer, let’s hit the mall after school.", "Morty, don’t trip on the halls.", "Your sweater is a whole mood.", "I could nap under those lockers forever.", "This cafeteria pizza is totally peak chaos.", "Let’s form a band called The Vibe Travelers.", "Principal is watching us like we’re some kind of documentary.", "Summer, you gotta teach me that look.", "I love deep-space fashion trends.", "Why is everyone obsessed with that alien smoothie?", "Let’s make epic our middle name.", "My hair looks terrifyingly amazing today."];
async function loadTriciaLines() {
    try {
        const resp = await fetch('elements/tricia lines.txt'); if (!resp.ok) throw new Error('Fetch failed'); const text = await resp.text(); const lines = text.split(/\n\s*\n/).map(l => l.trim()).filter(l => l.length > 0); if (lines.length > 0) triciaLines = lines; else triciaLines = DEFAULT_TRICIA;
    } catch (e) { triciaLines = DEFAULT_TRICIA; }
}
function updateDialogue() { if (!dialogueEl) return; if (!triciaLines.length) triciaLines = DEFAULT_TRICIA; dialogueEl.textContent = pick(triciaLines); dialogueEl.style.animation = 'none'; void dialogueEl.offsetWidth; dialogueEl.style.animation = ''; }
function nextDialogue() { updateDialogue(); }
function initClock() {
    const widget = document.createElement('div'); widget.className = 'corner-widget';
    widget.innerHTML = `<div class="tricia-area"><div class="tricia-dialogue" id="tricia-dialogue">You got this bestie!</div><video src="sprites/tricia_loop.webm" class="cheerleader-video" autoplay loop muted playsinline></video></div><div class="flip-clock" id="flip-clock"><div class="flip-digit" id="fd-h0"><div class="flip-digit-inner">0</div></div><div class="flip-digit" id="fd-h1"><div class="flip-digit-inner">0</div></div><span class="flip-separator">:</span><div class="flip-digit" id="fd-m0"><div class="flip-digit-inner">0</div></div><div class="flip-digit" id="fd-m1"><div class="flip-digit-inner">0</div></div><span class="flip-separator">:</span><div class="flip-digit" id="fd-s0"><div class="flip-digit-inner">0</div></div><div class="flip-digit" id="fd-s1"><div class="flip-digit-inner">0</div></div><span class="flip-period" id="flip-period">AM</span></div>`;
    const surface = document.getElementById('surface-section'); if (surface) surface.appendChild(widget); else document.body.appendChild(widget);
    dialogueEl = document.getElementById('tricia-dialogue'); loadTriciaLines().then(() => updateDialogue()); setInterval(updateDialogue, 60000); dialogueEl.style.cursor = 'pointer'; dialogueEl.style.pointerEvents = 'auto'; dialogueEl.addEventListener('click', nextDialogue); updateFlipClock(); setInterval(updateFlipClock, 1000);

    // Watchdog for Tricia Video
    setInterval(() => {
        const v = document.querySelector('.cheerleader-video');
        if (v && v.paused) {
            console.log('Tricia frozen, restarting...');
            v.play().catch(e => console.log('Tricia autoplay prevented:', e));
        }
    }, 2500);
}
function updateFlipClock() {
    const now = new Date(); let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds(); const period = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; const digits = String(h12).padStart(2, '0') + String(m).padStart(2, '0') + String(s).padStart(2, '0'); const ids = ['fd-h0', 'fd-h1', 'fd-m0', 'fd-m1', 'fd-s0', 'fd-s1'];
    for (let i = 0; i < 6; i++) { if (digits[i] !== prevDigits[i]) { const el = document.getElementById(ids[i]); if (el) { const inner = el.querySelector('.flip-digit-inner'); inner.textContent = digits[i]; inner.classList.remove('flipping'); void inner.offsetWidth; inner.classList.add('flipping'); } } }
    prevDigits = digits; const pEl = document.getElementById('flip-period'); if (pEl) pEl.textContent = period;
}

/* ===== INIT ===== */
let natureSeeded = false;
function resizeAll() {
    [nc, pc, cc, lc].forEach(c => { c.width = W(); c.height = H() }); if (!landscapeSeeded) seedLandscape(); drawStaticLandscape(); if (!natureSeeded) { seedNature(); natureSeeded = true; }
    const groundY = H() - 62 - GROUND_PAD; physicsCards.forEach(c => { if (c.grounded) { c.y = groundY; c._sync(); } });
}
function initToilet() {
    const toilet = document.getElementById('toilet'); const flood = document.getElementById('flood-wave'); if (!toilet || !flood) return;
    toilet.addEventListener('click', () => { flood.classList.add('active'); setTimeout(() => { physicsCards.forEach(c => c.el.remove()); physicsCards = []; grabCard = null; if (typeof entities !== 'undefined') { entities.forEach(e => e.el.remove()); entities = []; } }, 800); setTimeout(() => { flood.classList.remove('active'); }, 2200); });
}
function init() {
    if (window.initSupabase) window.initSupabase(); // V18 Init

    tagEl.textContent = pick(taglines); taskInput.placeholder = placeholders[0];
    setInterval(() => { phIdx++; taskInput.placeholder = placeholders[phIdx % placeholders.length]; }, 4000);
    taskDate.value = todayStr(); renderTasks(); renderCal();
    resizeAll(); setTimeout(resizeAll, 200); setTimeout(resizeAll, 1000);
    window.addEventListener('resize', resizeAll); animateNature(); initMouse(); spawnInitial(); entityTimers(); tickEntities(); physicsLoop();
    addBtn.addEventListener('click', addTask); taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
    btnList.addEventListener('click', () => switchView('list')); btnCal.addEventListener('click', () => switchView('calendar'));
    calPrev.addEventListener('click', () => navMonth(-1)); calNext.addEventListener('click', () => navMonth(1));
    closeDetail.addEventListener('click', () => { dayDetail.style.display = 'none'; selectedCalDate = null; renderCal(); });
    window.addEventListener('keydown', e => { if (e.target === taskInput || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return; if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { taskInput.focus(); } });

    function initDragBack() {
        window.addEventListener('mousedown', e => {
            const cardEl = e.target.closest('.physics-card');
            if (!cardEl || (!cardEl.classList.contains('thrown') && !cardEl.classList.contains('grounded'))) return;
            const pc = physicsCards.find(p => p.el === cardEl);
            if (!pc) return;

            e.preventDefault(); e.stopPropagation(); grabCard = pc; grabCard.grounded = true; grabCard.vx = 0; grabCard.vy = 0; grabCard.el.classList.add('grabbed'); grabCard.el.classList.remove('grounded');
            const r = cardEl.getBoundingClientRect(); grabOff = { x: e.clientX - r.left, y: e.clientY - r.top }; velHistory = [];

            const onMove = ev => {
                if (!grabCard) return;
                const nx = ev.clientX - grabOff.x, ny = ev.clientY - grabOff.y;
                grabCard.x = nx; grabCard.y = ny; grabCard._sync();
                velHistory.push({ x: ev.clientX, y: ev.clientY, t: Date.now() });
                if (velHistory.length > 8) velHistory.shift();

                const listRect = taskList.getBoundingClientRect();
                if (nx + grabCard.w > listRect.left && nx < listRect.right && ny + grabCard.h > listRect.top && ny < listRect.bottom) {
                    const cards = Array.from(taskList.children).filter(el => !el.classList.contains('task-placeholder'));
                    let insIdx = cards.length;
                    for (let k = 0; k < cards.length; k++) { const cr = cards[k].getBoundingClientRect(); if (ev.clientY < cr.top + cr.height / 2) { insIdx = k; break; } }
                    const oldP = taskList.querySelector('.task-placeholder'); if (oldP) oldP.remove();
                    const ph = document.createElement('div'); ph.className = 'task-placeholder';
                    if (insIdx >= cards.length) taskList.appendChild(ph); else taskList.insertBefore(ph, cards[insIdx]);
                } else { const oldP = taskList.querySelector('.task-placeholder'); if (oldP) oldP.remove(); }
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
                if (!grabCard) return;
                const oldP = taskList.querySelector('.task-placeholder');
                if (oldP) {
                    let dropIdx = Array.from(taskList.children).indexOf(oldP); oldP.remove();
                    if (grabCard.task) {
                        tasks.splice(dropIdx, 0, grabCard.task);
                        save();
                        if (window.syncAllTasksToCloud) window.syncAllTasksToCloud(); // V18 Sync Order
                        renderTasks();
                    }
                    grabCard.el.remove(); physicsCards = physicsCards.filter(p => p !== grabCard); grabCard = null;
                } else {
                    let tvx = 0, tvy = 0; if (velHistory.length >= 2) { const a = velHistory[0], b = velHistory[velHistory.length - 1], dt = Math.max(1, b.t - a.t); tvx = (b.x - a.x) / dt * 16; tvy = (b.y - a.y) / dt * 16; }
                    grabCard.vx = tvx; grabCard.vy = tvy; grabCard.rv = (tvx + tvy) * 0.3; grabCard.grounded = false; grabCard.el.classList.remove('grabbed'); grabCard.el.classList.add('thrown');
                }
            };
            document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
        });
    }
    initClock(); initCave(); initToilet(); initDragBack(); triggerEvt(); // V9 Event
}
document.addEventListener('DOMContentLoaded', init);
