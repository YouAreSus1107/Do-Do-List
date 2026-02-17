
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
