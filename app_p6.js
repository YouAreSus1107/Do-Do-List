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
