
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

        // Customizable Username Logic
        if (userDisplay) {
            const firstName = currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name.split(' ')[0] : 'User';
            // Render Input
            userDisplay.innerHTML = `Hi, <input type="text" class="username-input" value="${firstName}" spellcheck="false">!`;

            const input = userDisplay.querySelector('.username-input');
            // Save on change/blur
            const saveName = async () => {
                const newName = input.value.trim();
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
                    // Update local object to prevent re-save
                    currentUser.user_metadata.full_name = newName;
                    input.blur();
                }
            };

            input.addEventListener('change', saveName);
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
        }
        loadCloudTasks();
    } else {
        console.log('No session/User logged out');
        currentUser = null;
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userDisplay) userDisplay.textContent = '';

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

    // 4. Force Reload
    window.location.replace(window.location.pathname);
}

// === Data Sync ===

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
        // Replace local tasks
        tasks = data.map(record => {
            const t = record.content;
            t.db_id = record.id;
            return t;
        });

        save(); // Update localStorage
        renderTasks();
        renderCal();
        console.log('Cloud tasks loaded:', tasks.length);
    } else {
        if (tasks.length > 0) {
            const c = confirm('Cloud is empty. Sync your local tasks?');
            if (c) syncAllTasksToCloud();
        }
    }
}

async function saveCloudTask(task, index) {
    if (!supabaseClient || !currentUser) return;

    const content = { ...task };
    delete content.db_id;

    if (task.db_id) {
        const { error } = await supabaseClient
            .from('tasks')
            .update({ content: content, updated_at: new Date() })
            .eq('id', task.db_id);
        if (error) console.error('Update error:', error);
    } else {
        // Log explicitly before insert
        console.log('Attempting to insert task for user:', currentUser.id);
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert([{ content: content, user_id: currentUser.id }])
            .select();

        if (error) {
            console.error('Insert error details:', error);
            alert('Cloud Save Failed: ' + error.message); // User feedback
        } else if (data && data[0]) {
            task.db_id = data[0].id;
            save(); // Save the new ID locally
            console.log('Task saved to cloud:', task.db_id);
        }
    }
}

async function deleteCloudTaskByDbId(dbId) {
    if (!supabaseClient || !currentUser || !dbId) return;
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', dbId);
    if (error) console.error('Delete error:', error);
}

async function syncAllTasksToCloud() {
    if (!supabaseClient || !currentUser) return;
    console.log('Starting full sync...');
    for (let i = 0; i < tasks.length; i++) {
        await saveCloudTask(tasks[i], i);
    }
    alert('Sync complete!');
}

// Expose
window.initSupabase = initSupabase;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.saveCloudTask = saveCloudTask;
window.deleteCloudTaskByDbId = deleteCloudTaskByDbId;
window.syncAllTasksToCloud = syncAllTasksToCloud;
