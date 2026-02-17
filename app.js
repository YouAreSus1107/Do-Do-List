
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
    // Dirt/Brown mound
    c.fillStyle = '#5d4037'; c.beginPath(); c.moveTo(cx - 70, cy + 40); c.lineTo(cx - 50, cy - 40); c.lineTo(cx, cy - 65); c.lineTo(cx + 50, cy - 45); c.lineTo(cx + 80, cy + 40); c.closePath(); c.fill();
    // Inner depth (Darker brown)
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, 70); g.addColorStop(0, '#26160c'); g.addColorStop(1, '#3e2723'); c.fillStyle = g; c.beginPath(); c.moveTo(cx - 55, cy + 40); c.lineTo(cx - 35, cy - 25); c.lineTo(cx, cy - 50); c.lineTo(cx + 35, cy - 30); c.lineTo(cx + 65, cy + 40); c.closePath(); c.fill();
    // Stalactites/Teeth (Lighter dirt)
    c.fillStyle = '#795548';[[-25, 18], [0, 25], [25, 20]].forEach(([dx, h]) => { c.beginPath(); c.moveTo(cx + dx - 6, cy - 45); c.lineTo(cx + dx, cy - 45 + h); c.lineTo(cx + dx + 6, cy - 45); c.fill(); });
    // Crystals
    const cols = ['#b388ff', '#ce93d8', '#80cbc4'];[[-40, 20, 0], [-15, 25, 1], [20, 22, 2], [45, 18, 0]].forEach(([dx, h, ci]) => { c.globalAlpha = 0.7; c.fillStyle = cols[ci]; c.beginPath(); c.moveTo(cx + dx, cy + 35); c.lineTo(cx + dx + 4, cy + 35 - h); c.lineTo(cx + dx + 8, cy + 35); c.fill(); }); c.globalAlpha = 1;
}

/* ===== DOM REFS ===== */
const $ = id => document.getElementById(id);
const taskInput = $('task-input'), taskDate = $('task-date'), addBtn = $('add-btn'), taskList = $('task-list'), emptyState = $('empty-state'), listView = $('list-view'), calView = $('calendar-view'), btnList = $('btn-list-view'), btnCal = $('btn-calendar-view'), calTitle = $('cal-month-title'), calGrid = $('calendar-grid'), calPrev = $('cal-prev'), calNext = $('cal-next'), dayDetail = $('day-detail'), dayTitle = $('day-detail-title'), dayTasks = $('day-detail-tasks'), closeDetail = $('close-detail'), toastBox = $('toast-container'), tagEl = $('tagline');

/* ===== MODAL LOGIC ===== */
const descModal = $('desc-modal'), descInput = $('desc-input'), descSave = $('desc-save'), descCancel = $('desc-cancel');
let currentEditingTaskId = null;

function openDescModal(task) {
    currentEditingTaskId = task.id;
    descInput.value = task.description || '';
    descModal.style.display = 'flex';
    // Small timeout to allow display:flex to apply before adding class for transition
    setTimeout(() => {
        descModal.classList.add('active');
        descInput.focus();
    }, 10);
}

function closeDescModal() {
    descModal.classList.remove('active');
    setTimeout(() => {
        descModal.style.display = 'none';
        currentEditingTaskId = null;
    }, 300);
}

if (descCancel) descCancel.addEventListener('click', closeDescModal);
if (descSave) descSave.addEventListener('click', () => {
    if (!currentEditingTaskId) return;
    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (task) {
        task.description = descInput.value.trim();
        save();
        if (window.saveCloudTask) window.saveCloudTask(task); // Sync
        renderTasks(); // update UI to show icon
        renderCal(); // update calendar view if needed
        toast('Description updated! 📝');
    }
    closeDescModal();
});

// Close on outside click
if (descModal) descModal.addEventListener('click', (e) => {
    if (e.target === descModal) closeDescModal();
});

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
    const ts = taskDate.value || todayStr();
    // Filter: Show undated or selected date's tasks
    const visibleTasks = tasks.filter(t => !t.date || t.date === ts);

    if (!visibleTasks.length) { emptyState.classList.add('visible'); const m = pick(emptyMsgs); emptyState.querySelector('.empty-sprite').src = m.s; emptyState.querySelector('h3').textContent = m.t; emptyState.querySelector('p').textContent = m.u; return; }
    emptyState.classList.remove('visible');

    visibleTasks.forEach((task, i) => {
        const shape = task.shape || pick(TASK_SHAPES), src = SHAPE_SPRITES[shape] || 'sprites/fern.svg';
        const c = document.createElement('div'); c.className = `task-card ${shape}${task.completed ? ' completed' : ''}${task.style === 'fancy' ? ' task-fancy' : ''}`; c.dataset.id = task.id;
        // No entrance animation for completed tasks
        if (!task.completed) c.style.animationDelay = `${i * 0.06}s`;
        else c.style.animation = 'none';

        // Tooltip & Icon
        const descIndicator = task.description ?
            `<div class="task-desc-icon">📝<div class="task-tooltip">${esc(task.description)}</div></div>`
            : '';

        c.innerHTML = `<span class="drag-handle">&#x2807;</span><img src="${src}" class="task-shape-sprite" alt="" draggable="false"><label class="task-checkbox"><input type="checkbox" ${task.completed ? 'checked' : ''}><span class="checkmark"></span></label><span class="task-text">${esc(task.text)}</span>${descIndicator}${task.date ? `<span class="task-date-badge">${fmtDate(task.date)}</span>` : ''}<div class="task-actions"><button class="task-style-btn" title="Toggle Style"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></button><button class="task-delete" title="Delete"><svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>`;
        c.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTask(task.id));
        c.querySelector('.task-style-btn').addEventListener('click', e => { e.stopPropagation(); toggleTaskStyle(task.id); });
        c.querySelector('.task-delete').addEventListener('click', e => { e.stopPropagation(); deleteTask(task.id); });

        // Right Click for Description
        c.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            openDescModal(task);
        });

        c.addEventListener('mousedown', e => {
            if (e.button !== 0) return; // Only left click drags
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

                if (speed > THROW_THRESH) { // Allow throw delete for all tasks
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
    const todayDateObj = new Date(); todayDateObj.setHours(0, 0, 0, 0);

    for (let i = 0; i < fd; i++) { const e = document.createElement('div'); e.className = 'cal-cell empty'; calGrid.appendChild(e); }

    for (let d = 1; d <= dim; d++) {
        const c = document.createElement('div'); c.className = 'cal-cell'; c.textContent = d;
        const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const cDateObj = new Date(ds + 'T00:00:00');

        // Task Counts
        let dTasks = tasks.filter(t => t.date === ds);
        // Sort: Incomplete first
        dTasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);

        const hasIncomplete = dTasks.some(t => !t.completed);

        // Expiry Logic: Past date + Incomplete tasks
        if (cDateObj < todayDateObj && hasIncomplete) {
            c.classList.add('expired');
        }

        if (ds === ts) c.classList.add('today');
        if (selectedCalDate === ds) c.classList.add('selected');

        if (dTasks.length) {
            const dots = document.createElement('div'); dots.className = 'cal-dots';

            // Show first 3 dots
            dTasks.slice(0, 3).forEach(t => {
                const dt = document.createElement('div');
                dt.className = `cal-dot ${t.completed ? 'completed' : ''}`;
                dots.appendChild(dt);
            });

            // More Bar
            if (dTasks.length > 3) {
                const dt = document.createElement('div');
                const hiddenTasks = dTasks.slice(3);
                const allHiddenDone = hiddenTasks.every(t => t.completed);
                dt.className = `cal-dot more ${allHiddenDone ? 'completed' : ''}`;
                dots.appendChild(dt);
            }
            c.appendChild(dots);
        }

        c.addEventListener('click', () => showDay(ds));

        // Context Menu
        c.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, ds);
        });

        calGrid.appendChild(c);
    }
}

/* ===== CONTEXT MENU LOGIC ===== */
const ctxMenu = $('context-menu'), ctxCopy = $('ctx-copy'), ctxPaste = $('ctx-paste');
let clipboardTasks = null;
let contextDate = null;

function showContextMenu(x, y, date) {
    if (!ctxMenu) return;
    contextDate = date;
    const hasTasks = tasks.some(t => t.date === date);

    // Toggle state
    if (!hasTasks) ctxCopy.classList.add('disabled'); else ctxCopy.classList.remove('disabled');
    if (!clipboardTasks || !clipboardTasks.length) ctxPaste.classList.add('disabled'); else ctxPaste.classList.remove('disabled');

    ctxMenu.style.left = `${x}px`;
    ctxMenu.style.top = `${y}px`;
    ctxMenu.classList.add('active');
}

function hideContextMenu() {
    if (ctxMenu) ctxMenu.classList.remove('active');
}

// Global click to hide
window.addEventListener('click', hideContextMenu);

if (ctxCopy) ctxCopy.addEventListener('click', () => {
    if (!contextDate) return;
    const tasksToCopy = tasks.filter(t => t.date === contextDate);
    if (tasksToCopy.length) {
        clipboardTasks = JSON.parse(JSON.stringify(tasksToCopy)); // Deep copy
        toast(`Copied ${tasksToCopy.length} tasks! 📋`);
    }
});

if (ctxPaste) ctxPaste.addEventListener('click', () => {
    if (!contextDate || !clipboardTasks) return;
    let count = 0;
    clipboardTasks.forEach(t => {
        // Clone and re-assign ID and Date
        const newTask = { ...t, id: genId(), date: contextDate, createdAt: Date.now() };
        tasks.unshift(newTask);
        if (window.saveCloudTask) window.saveCloudTask(newTask, 0);
        count++;
    });
    save();
    renderCal();
    if (selectedCalDate) showDay(selectedCalDate); // Refresh detail view if open
    toast(`Pasted ${count} tasks to ${fmtDate(contextDate)}! 🌱`);
});
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
                // Tooltip & Icon
                const descIndicator = t.description ?
                    `<div class="task-desc-icon">📝<div class="task-tooltip">${esc(t.description)}</div></div>`
                    : '';

                el.innerHTML = `<img src="${SHAPE_SPRITES[t.shape]}" alt="" draggable="false"><span style="${t.completed ? 'text-decoration:line-through;opacity:0.6' : ''}">${esc(t.text)}</span>${descIndicator}<button class="day-task-del" title="Delete">&times;</button>`;
                el.addEventListener('click', (e) => {
                    // Prevent toggle if clicking description/icon
                    if (e.target.closest('.task-desc-icon')) return;
                    toggleTask(t.id); renderDayList();
                });
                // Right Click for Description
                el.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    openDescModal(t);
                });
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

function toast(m) {
    if (m && m.toLowerCase().includes('sync')) return; // SPAM FILTER
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; toastBox.appendChild(t); setTimeout(() => { if (t.parentNode) t.remove(); }, 3200);
}

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
    if (window.resizeStickies) window.resizeStickies();
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
    btnList.addEventListener('click', () => { switchView('list'); taskDate.value = todayStr(); }); btnCal.addEventListener('click', () => switchView('calendar'));
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
/* ===== INTERACTIVE ELEMENTS (app_p6.js) ===== */
/* Sticky Notes, Stickers, and Draggable Decor */

const STICKY_COLORS = ['#fef3c7', '#dcfce7', '#fae8ff', '#dbeafe']; // Yellow, Green, Pink, Blue
let stickyNotes = [];
let dragSticky = null;
let stickyOffset = { x: 0, y: 0 };

class StickyNote {
    constructor(id, x, y, text = '', colorIdx = 0, rot = 0, db_id = null) {
        this.id = id || 'sticky-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        this.db_id = db_id; // Persist DB ID
        this.x = x;
        this.y = y;
        this.text = text;
        this.colorIdx = colorIdx;
        this.color = STICKY_COLORS[colorIdx];
        this.rot = rot || (Math.random() * 10 - 5);
        this.el = null;
        this.lastSave = 0;
        this.render();
    }

    render() {
        if (this.el) this.el.remove();

        const el = document.createElement('div');
        el.className = 'sticky-note';
        el.style.left = this.x + 'px';
        el.style.top = this.y + 'px';
        el.style.backgroundColor = this.color;
        el.style.setProperty('--rot', this.rot + 'deg');
        el.style.transform = `rotate(${this.rot}deg)`;

        // Structure
        el.innerHTML = `
            <div class="sticky-pin"></div>
            <textarea class="sticky-content" placeholder="Write something...">${this.text}</textarea>
            <div class="sticky-controls">
                <button class="sticky-color-btn" title="Change Color">🎨</button>
                <button class="sticky-del-btn" title="Delete">✖</button>
            </div>
        `;

        // Interactive
        const textarea = el.querySelector('textarea');
        textarea.addEventListener('input', () => {
            this.text = textarea.value;
            this.el.style.height = 'auto';
            this.el.style.height = textarea.scrollHeight + 'px';
            this.saveDebounced();
        });
        // Auto-resize initial
        setTimeout(() => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }, 0);

        el.querySelector('.sticky-del-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.delete();
        });

        el.querySelector('.sticky-color-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.cycleColor();
        });

        el.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
            e.preventDefault();
            startDragSticky(this, e);
        });

        document.getElementById('sticky-note-layer').appendChild(el);
        this.el = el;
    }

    cycleColor() {
        this.colorIdx = (this.colorIdx + 1) % STICKY_COLORS.length;
        this.color = STICKY_COLORS[this.colorIdx];
        this.el.style.backgroundColor = this.color;
        this.save();
    }

    delete() {
        this.el.style.animation = 'shakeDelete 0.4s ease-in-out forwards';
        setTimeout(() => {
            this.el.remove();
            stickyNotes = stickyNotes.filter(n => n !== this);
            deleteCloudSticky(this.id);
        }, 400);
    }

    saveDebounced() {
        const now = Date.now();
        if (now - this.lastSave > 1000) {
            this.save();
            this.lastSave = now;
        } else {
            clearTimeout(this.saveTimer);
            this.saveTimer = setTimeout(() => this.save(), 1000);
        }
    }

    save() {
        if (window.saveCloudSticky) window.saveCloudSticky(this);
    }
}

/* === Draggable Logic === */
function startDragSticky(note, e) {
    dragSticky = note;
    const rect = note.el.getBoundingClientRect();
    const sec = document.getElementById('cave-section');
    const secRect = sec.getBoundingClientRect();

    // Offset relative to the NOTE, not screen
    stickyOffset.x = e.clientX - rect.left;
    stickyOffset.y = e.clientY - rect.top;

    note.el.style.zIndex = '100'; // Bring to front
    note.el.style.transition = 'none';

    document.addEventListener('mousemove', onDragSticky);
    document.addEventListener('mouseup', onStopDragSticky);
}

function onDragSticky(e) {
    if (!dragSticky) return;
    const sec = document.getElementById('cave-section');
    const secRect = sec.getBoundingClientRect();

    // Calculate relative position within cave section
    let nx = e.clientX - secRect.left - stickyOffset.x;
    let ny = e.clientY - secRect.top - stickyOffset.y;

    // Boundaries
    const maxX = secRect.width - dragSticky.el.offsetWidth;
    const maxY = secRect.height - dragSticky.el.offsetHeight;

    nx = Math.max(0, Math.min(nx, maxX));
    ny = Math.max(0, Math.min(ny, maxY));

    dragSticky.x = nx;
    dragSticky.y = ny;
    dragSticky.el.style.left = nx + 'px';
    dragSticky.el.style.top = ny + 'px';
}

function stopDragSticky() {
    onStopDragSticky();
}

// Global Resize Handler for Stickies
function resizeStickies() {
    const sec = document.getElementById('cave-section');
    if (!sec) return;
    const secRect = sec.getBoundingClientRect();
    const maxX = secRect.width - 150; // approx width
    const maxY = secRect.height - 150; // approx height

    stickyNotes.forEach(note => {
        if (!note.el) return;
        const noteW = note.el.offsetWidth || 150;
        const noteH = note.el.offsetHeight || 150;

        let newX = Math.max(10, Math.min(note.x, secRect.width - noteW - 10));
        let newY = Math.max(10, Math.min(note.y, secRect.height - noteH - 10));

        if (newX !== note.x || newY !== note.y) {
            note.x = newX;
            note.y = newY;
            note.el.style.left = newX + 'px';
            note.el.style.top = newY + 'px';
            note.saveDebounced();
        }
    });
}
window.resizeStickies = resizeStickies;

function onStopDragSticky() {
    if (dragSticky) {
        dragSticky.el.style.zIndex = '';
        dragSticky.el.style.transition = '';
        dragSticky.save(); // Save new pos
        dragSticky = null;
    }
    document.removeEventListener('mousemove', onDragSticky);
    document.removeEventListener('mouseup', onStopDragSticky);
}

/* === Public API === */
function spawnStickyBtn() {
    // Random pos (avoid center/tomato clock)
    const sec = document.getElementById('cave-section');
    const w = sec ? sec.offsetWidth : W();
    const h = sec ? sec.offsetHeight : H();

    let x, y;
    // Simple retry to avoid center area (approx 300x300 in middle)
    let safe = false;
    let attempts = 0;
    while (!safe && attempts < 10) {
        x = 50 + Math.random() * (w - 100);
        y = 50 + Math.random() * (h - 150);
        // Check center distance
        const dx = x - w / 2;
        const dy = y - h / 2;
        if (Math.sqrt(dx * dx + dy * dy) > 250) safe = true; // Outside 250px radius from center
        attempts++;
    }

    const note = new StickyNote(null, x, y);
    stickyNotes.push(note);
    note.save();
}

function clearStickies() {
    stickyNotes.forEach(n => n.el && n.el.remove());
    stickyNotes = [];
}

function loadStickyData(data) {
    // data is array of objects { id, x, y, text, colorIdx, rot, db_id }
    clearStickies();
    data.forEach(d => {
        const note = new StickyNote(d.id, d.x, d.y, d.text, d.colorIdx, d.rot, d.db_id);
        stickyNotes.push(note);
    });
}

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

/* ===== V18 Cloud Sync (Supabase) ===== */

const SUPABASE_URL = 'https://eyahchujwotwwluwsprp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWhjaHVqd290d3dsdXdzcHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjYwODcsImV4cCI6MjA4NjY0MjA4N30.hVV-jibjviUb6dO5H1epF9ne3lD1ZU4qV6EaZDSFNcQ';

let supabaseClient = null;
let currentUser = null;

function initSupabase() {
    console.log('initSupabase called - v19 Fixed Sync');
    console.log('Checking for old conflicting variables...');

    if (typeof window.supabase === 'undefined') {
        console.error('Supabase fetch failed');
        return;
    }

    // Initialize client immediately
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Manual Hash Parsing strategy
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        console.log('Auth hash detected. Attempting manual session set...');
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) userDisplay.textContent = 'Setting session...';

        // Extract tokens
        const params = new URLSearchParams(hash.substring(1)); // remove #
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
            console.log('Tokens extracted. Setting session...');
            supabaseClient.auth.setSession({
                access_token,
                refresh_token
            }).then(({ data, error }) => {
                if (error) {
                    console.error('Manual setSession failed:', error);
                    alert('Login processing failed: ' + error.message);
                } else {
                    console.log('Manual setSession success:', data.session);
                    handleSession(data.session);
                    // Clear hash to clean up URL
                    window.history.replaceState(null, null, ' ');
                }
            });
            return; // Skip default check
        }
    }

    // Default: Check existing session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        console.log('getSession result (default):', session);
        handleSession(session);
    });

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        console.log('onAuthStateChange:', _event, session);
        handleSession(session);
    });
}

function handleSession(session) {
    console.log('handleSession called with:', session);
    const loginBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('user-display');

    if (session) {
        currentUser = session.user;
        console.log('User logged in:', currentUser);
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex'; // Use flex for icon alignment

        // Link Spotify Account
        if (window.setUserSpotify) window.setUserSpotify(currentUser.id);

        // Customizable Username Logic
        if (userDisplay) {
            const firstName = currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name.split(' ')[0] : 'User';
            // Render Input
            userDisplay.innerHTML = `Hi, <input type="text" class="username-input" value="${firstName}" spellcheck="false">!`;

            const input = userDisplay.querySelector('.username-input');
            // Save on change/blur
            const saveName = async () => {
                const newName = input.value.trim();
                // Persist locally immediately
                if (newName) localStorage.setItem('savedUsername', newName);

                if (!newName || newName === firstName) return;
                console.log('Updating username to:', newName);
                const { error } = await supabaseClient.auth.updateUser({
                    data: { full_name: newName }
                });

                if (error) {
                    console.error('Failed to update name:', error);
                    alert('Could not save name: ' + error.message);
                } else {
                    console.log('Username updated!');
                    currentUser.user_metadata.full_name = newName;
                    input.blur();
                }
            };

            input.addEventListener('change', saveName);
            input.addEventListener('input', () => {
                // Also save on input for non-logged in persistence if needed? 
                // Nah, change is fine.
            });
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { input.blur(); saveName(); } });
        }
        loadCloudTasks();
    } else {
        console.log('No session/User logged out');
        currentUser = null;
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';

        // PERSISTENCE CHECK ON LOGOUT
        if (userDisplay) {
            const saved = localStorage.getItem('savedUsername') || 'Guest';
            userDisplay.innerHTML = `Hi, <input type="text" class="username-input" value="${saved}" spellcheck="false">!`;
            // Allow editing 'Guest' name too? check local storage update
            const input = userDisplay.querySelector('.username-input');
            input.addEventListener('change', () => {
                if (input.value.trim()) localStorage.setItem('savedUsername', input.value.trim());
            });
        }

        // IMMEDIATE UI CLEAR
        console.log('Clearing UI tasks...');
        tasks = [];
        save();
        renderTasks();
        renderCal();
    }
}

async function loginWithGoogle() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.href // Redirect back to app
        }
    });
    if (error) alert('Login failed: ' + error.message);
}

async function logout() {
    console.log('Logging out...');

    // 1. Try Supabase SignOut (Best Effort)
    if (supabaseClient) {
        try {
            await supabaseClient.auth.signOut();
        } catch (e) {
            console.error('Supabase signOut error (ignoring):', e);
        }
    }

    // 2. FORCE Clear Local Data
    localStorage.removeItem('tasks');
    localStorage.removeItem('user_settings');
    tasks = []; // Clear memory immediately
    renderTasks();

    // 3. Clear Supabase Tokens
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) localStorage.removeItem(key);
    }

    // 4. Clear Spotify State
    if (window.clearUserSpotify) window.clearUserSpotify();

    // 5. Force Reload
    window.location.replace(window.location.pathname);
}

// === Data Sync ===

// === Sticky Note Sync (New v20) ===
async function loadCloudStickies() {
    if (!supabaseClient || !currentUser) return;
    // We fetch ALL tasks, but filter client-side for now or we could validly query where content->>'type' is 'sticky'
    // For simplicity with existing structure:
    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', currentUser.id); // Get all to filter

    if (error) { console.error('Error loading stickies:', error); return; }

    // Filter for stickies
    const stickies = [];
    if (data) {
        data.forEach(r => {
            if (r.content && r.content.type === 'sticky_note') {
                const s = r.content;
                s.id = r.content.id;
                s.db_id = r.id; // Push DB ID to the object
                stickies.push(s);
            }
        });

    }

    if (window.loadStickyData) window.loadStickyData(stickies);
}

// === Task Sync (Standard) ===
async function saveCloudTask(task) {
    if (!supabaseClient || !currentUser) return;

    // Prepare content payload (strip UI-only fields if needed, or save all)
    const content = { ...task };
    delete content.db_id; // Don't save db_id inside content, it causes recursion/confusion

    if (task.db_id) {
        // Update
        await supabaseClient.from('tasks').update({ content: content, updated_at: new Date() }).eq('id', task.db_id);
    } else {
        // Insert
        const { data, error } = await supabaseClient.from('tasks').insert([{ content: content, user_id: currentUser.id }]).select();
        if (data && data[0]) {
            task.db_id = data[0].id; // Persist back to object
        }
    }
}

async function deleteCloudTaskByDbId(dbId) {
    if (!supabaseClient || !currentUser || !dbId) return;
    const { error } = await supabaseClient.from('tasks').delete().eq('id', dbId);
    if (error) console.error('Delete task error:', error);
}

// Saving Stickies (Re-uses tasks table but with type='sticky_note')
async function saveCloudSticky(sticky) {
    if (!supabaseClient || !currentUser) return;

    // Check if we already have a db_id for this sticky in our local list?
    // app_p6 sticky object might not have db_id unless we loaded it. 
    // We attach it to the memory object in loadStickyData usually.

    const content = {
        type: 'sticky_note',
        id: sticky.id,
        x: sticky.x,
        y: sticky.y,
        text: sticky.text,
        colorIdx: sticky.colorIdx,
        rot: sticky.rot
    };

    // Upsert logic... inefficient but safe: check if exists by custom ID in content? 
    // Or just simple Insert vs Update if we track db_id.
    // Let's search by ID first if we don't have db_id.

    // Strategy: We will treat the 'id' (sticky-time-rand) as unique enough.
    // Ideally we put 'db_id' on the sticky object in memory.

    if (sticky.db_id) {
        // Update
        await supabaseClient.from('tasks').update({ content: content, updated_at: new Date() }).eq('id', sticky.db_id);
    } else {
        // Insert
        const { data, error } = await supabaseClient.from('tasks').insert([{ content: content, user_id: currentUser.id }]).select();
        if (data && data[0]) {
            sticky.db_id = data[0].id; // Persist back to object
        }
    }
}

async function deleteCloudSticky(stickyId) {
    if (!supabaseClient || !currentUser) return;
    // We need to find the DB ID for this sticky ID... 
    // Or we delete based on content->>id match? (Supabase allows this with json filtering)
    // Let's try deleting where content->>id equals stickyId

    // PostgREST syntax for JSON filter: content->>id=eq.VALUE
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('content->>id', stickyId);

    if (error) console.error('Delete sticky error:', error);
    if (error) console.error('Delete sticky error:', error);
}

// Global Sync (used for reorder)
async function syncAllTasksToCloud() {
    if (!supabaseClient || !currentUser) return;
    // For now, we just re-save everything? 
    // Or we rely on 'saveCloudTask' for individual updates.
    // Reorder implies we might need an 'order' field, but currently we just sort by creation/array order.
    // If user reorders in array, we don't strictly persist that order to Supabase unless we have an index.
    // For this quick fix, we'll just log it, or if we want to save order, we need to update ALL tasks with new indices.

    // Attempting to save all tasks with their current array index as 'order'?
    // Let's just update all modified_at timestamps to force sort? No, that's messy.
    // For V1 MVP: Just save any dirty state.

    console.log('Sync all triggered (placeholder for reorder logic)');
}

// Modify loadCloudTasks to IGNORE stickies
async function loadCloudTasks() {
    if (!supabaseClient || !currentUser) return;

    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading cloud tasks:', error);
        return;
    }

    if (data && data.length > 0) {
        // Filter OUT stickies
        const trueTasks = [];
        data.forEach(record => {
            if (!record.content.type || record.content.type !== 'sticky_note') {
                const t = record.content;
                t.db_id = record.id;
                trueTasks.push(t);
            }
        });

        tasks = trueTasks;
        save(); // Update localStorage
        renderTasks();
        renderCal();
        console.log('Cloud tasks loaded:', tasks.length);

        // NOW load stickies
        loadCloudStickies();
    } else {
        // Empty cloud
        // Sync local?
    }
}

// Expose
window.initSupabase = initSupabase;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.saveCloudTask = saveCloudTask;
window.deleteCloudTaskByDbId = deleteCloudTaskByDbId;
window.syncAllTasksToCloud = syncAllTasksToCloud;
window.saveCloudSticky = saveCloudSticky;
window.deleteCloudSticky = deleteCloudSticky;
window.syncAllTasksToCloud = syncAllTasksToCloud;
/* ===== SPOTIFY INTEGRATION (PKCE Flow) ===== */
const SPOTIFY_CLIENT_ID = 'ce11c02e7fab488684ed2b5c53c128f2';
// Determine Redirect URI dynamically (Local vs Production)
const REDIRECT_URI = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? window.location.origin + window.location.pathname // Keep exact path (e.g. /index.html) or root
    : window.location.origin + '/'; // Netlify root

const SCOPES = 'user-read-currently-playing user-read-playback-state';

/* --- Auth State --- */
let currentSpotifyUser = null; // Google User ID
let spotifyToken = null;
let spotifyRefresh = null;
let spotifyExpiry = 0;
let playerInterval = null;

// Called by app_p5.js when Google User logs in
window.setUserSpotify = function (userId) {
    if (currentSpotifyUser === userId) return;
    currentSpotifyUser = userId;

    // Check pending data from callback
    if (window.pendingSpotifyData) {
        console.log("Spotify: Saving pending token for user", userId);
        setToken(window.pendingSpotifyData);
        window.pendingSpotifyData = null;
    }

    // Load tokens for this user
    const store = JSON.parse(localStorage.getItem(`spotify_store_${userId}`) || '{}');
    if (store.access_token) {
        spotifyToken = store.access_token;
        spotifyRefresh = store.refresh_token;
        spotifyExpiry = store.expiry;
        initSpotifyPlayer();
    } else {
        renderSpotifyState();
    }

    console.log(`Spotify: Loaded profile for user ${userId}`);
};

window.clearUserSpotify = function () {
    currentSpotifyUser = null;
    spotifyToken = null;
    spotifyRefresh = null;
    spotifyExpiry = 0;
    if (playerInterval) clearInterval(playerInterval);
    renderSpotifyState();
};

/* --- PKCE Helpers --- */
async function generateCodeVerifier(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/* --- Auth Flow --- */
async function connectSpotify() {
    if (!currentSpotifyUser) {
        alert("Please log in with Google first!");
        return;
    }

    const verifier = await generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    // Store verifier temporarily (global is fine for short auth flow)
    localStorage.setItem('spotify_verifier', verifier);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
        code_challenge_method: 'S256',
        code_challenge: challenge
    });

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function handleSpotifyCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
        const verifier = localStorage.getItem('spotify_verifier');
        const body = new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });

        if (!response.ok) {
            console.error('Spotify Auth Failed', await response.text());
            return;
        }

        const data = await response.json();
        setToken(data);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        initSpotifyPlayer();
    }
}

async function refreshToken() {
    if (!spotifyRefresh) return;
    const body = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: spotifyRefresh
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
    });

    if (response.ok) {
        const data = await response.json();
        setToken(data);
    } else {
        logoutSpotify();
    }
}

function setToken(data) {
    if (!currentSpotifyUser) {
        console.warn("No Google User active, cannot save Spotify token.");
        return;
    }

    spotifyToken = data.access_token;
    if (data.refresh_token) spotifyRefresh = data.refresh_token;
    spotifyExpiry = Date.now() + (data.expires_in * 1000);

    const store = {
        access_token: spotifyToken,
        refresh_token: spotifyRefresh,
        expiry: spotifyExpiry
    };

    localStorage.setItem(`spotify_store_${currentSpotifyUser}`, JSON.stringify(store));
}

function logoutSpotify() {
    // Only clears for this session, but user can re-connect or use other account
    // Actually, "logout" here just clears current state. 
    // If they want to "Switch account", they should probably revoke or overwrite.
    // For now, simple clear.
    spotifyToken = null;
    spotifyRefresh = null;
    spotifyExpiry = 0;

    // Update store to empty
    if (currentSpotifyUser) {
        localStorage.removeItem(`spotify_store_${currentSpotifyUser}`);
    }

    renderSpotifyState();
}

/* --- Player Logic --- */
async function fetchNowPlaying() {
    if (!spotifyToken) return null;

    if (Date.now() > spotifyExpiry) {
        await refreshToken();
    }
    if (!spotifyToken) return null;

    try {
        const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });

        if (res.status === 204 || res.status > 400) return null; // Not playing or error
        return await res.json();
    } catch (e) {
        return null;
    }
}

function initSpotifyPlayer() {
    if (!spotifyToken) return;
    renderSpotifyState();

    // Poll every 2.5s
    if (playerInterval) clearInterval(playerInterval);
    playerInterval = setInterval(updateSpotifyUI, 2500);
    updateSpotifyUI();
}

/* --- UI Rendering --- */
const spotifyWidget = document.getElementById('spotify-widget');

async function updateSpotifyUI() {
    const data = await fetchNowPlaying();
    if (!spotifyWidget) return;

    if (!data || !data.item) {
        // Connected but nothing playing
        spotifyWidget.innerHTML = `
            <div class="spotify-idle">
                <div class="spotify-logo-small"></div>
                <span>Waiting for u... ʕ•ᴥ•ʔ</span>
            </div>
        `;
        spotifyWidget.classList.add('connected');
        return;
    }

    const track = data.item;
    const artist = track.artists.map(a => a.name).join(', ');
    const title = track.name;
    const cover = track.album.images[0]?.url;

    spotifyWidget.innerHTML = `
        <div class="spotify-playing">
            <img src="${cover}" class="spotify-cover-huge" alt="Album Art">
            <div class="spotify-info">
                <div class="spotify-title">${title}</div>
                <div class="spotify-artist">${artist}</div>
            </div>
            <div class="spotify-eq">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    spotifyWidget.classList.add('playing');
}

function renderSpotifyState() {
    if (!spotifyWidget) return;

    if (!spotifyToken) {
        // Login Button
        spotifyWidget.innerHTML = `
            <button class="spotify-login-btn" onclick="connectSpotify()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.2-1.32 9.6-.66 13.38 1.68.42.181.6.72.36 1.141zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                Connect Spotify
            </button>
        `;
        spotifyWidget.classList.remove('connected', 'playing');
    } else {
        // Initial Loading State
        spotifyWidget.innerHTML = '<div class="spotify-loading">Connecting...</div>';
        spotifyWidget.classList.add('connected');
    }
}

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
    // Check for callback code first
    if (window.location.search.includes('code=')) {
        // If we have a code, we wait for app_p5 to set the user
        // But handleSpotifyCallback needs to run?
        // Actually, handleSpotifyCallback needs a user to save the token *to*.
        // So we wait until setUserSpotify is called by app_p5, then we check URL?
        // Or we just let handleSpotifyCallback run and if no user, it warns?
        // Let's modify handleSpotifyCallback to wait or warn.

        // Better: We just run it. If setUserSpotify hasn't run, currentSpotifyUser is null.
        // We need to ensure app_p5 runs first. It usually does on load.
        // Let's add a small check in handleSpotifyCallback to retry if no user?
        handleSpotifyCallback();
    } else {
        renderSpotifyState();
    }
});
