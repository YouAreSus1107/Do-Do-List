# Skill: Connect Web App to Google via Supabase

This skill guides you through connecting a vanilla HTML/JS web application to Google Authentication using Supabase.

## Prerequisites
- A Google Cloud Platform (GCP) Project.
- A Supabase Project.
- A Vanilla JS/HTML web app.

## Step 1: Google Cloud Setup (OAuth)
1.  Go to **GCP Console > APIs & Services > OAuth consent screen**.
    -   User Type: **External**.
    -   Fill in App Name, Support Email, Developer Email.
    -   Save & Continue (Scopes can be default/empty for basic login).
2.  Go to **Credentials**.
    -   **Create Credentials** > **OAuth client ID**.
    -   Application type: **Web application**.
    -   **Authorized JavaScript origins**:
        -   `http://localhost:8000` (Local Dev)
        -   `https://<your-project>.supabase.co`
    -   **Authorized redirect URIs**:
        -   `https://<your-project>.supabase.co/auth/v1/callback`
3.  Copy the **Client ID** and **Client Secret**.

## Step 2: Supabase Setup
1.  Go to **Supabase Dashboard > Authentication > Providers > Google**.
2.  Enable **Google**.
3.  Paste the **Client ID** and **Client Secret** from GCP.
4.  Copy the **Redirect URL** provided by Supabase (it should match the one you put in GCP).
5.  Click **Save**.

## Step 3: Frontend Implementation

### HTML
Add the Supabase JS library via CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### JavaScript (`app.js`)
Initialize and handle auth. **Critical:** Use the "Manual Hash Parsing" strategy for maximum reliability.

```javascript
/* Supabase Config */
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key'; // WARNING: Use the ANON key, not service_role!

let supabaseClient = null;

function initSupabase() {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- STRATEGY: Manual Hash Parsing ---
    // Sometimes createClient fails to detect the hash automatically (clock skew, race conditions).
    // We manually parse it to ensure reliability.
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
            supabaseClient.auth.setSession({
                access_token,
                refresh_token
            }).then(({ data, error }) => {
                if (!error) {
                    window.history.replaceState(null, null, ' '); // Clean URL
                    handleUser(data.session.user);
                }
            });
            return;
        }
    }

    // Default Check
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) handleUser(session.user);
    });

    // Listener
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session) handleUser(session.user);
        else handleLogout();
    });
}

async function login() {
    await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
}

async function logout() {
    await supabaseClient.auth.signOut();
    localStorage.clear(); // CRITICAL: Clear local state
    window.location.reload();
}
```

## ⚠️ Troubleshooting Guide (Deep Cuts)

### 1. "Token issued in the future" or "Auth Session Null"
*   **Cause**: System clock skew or race conditions.
*   **Fix**: Use the **Manual Hash Parsing** method shown above. It bypasses the library's internal clock checks.

### 2. "Invalid API Key"
*   **Cause**: You might have pasted the `service_role` key or concatenated two keys.
*   **Fix**: Ensure you are using the `anon` / `public` key formatted like a JWT (`eyJ...`).

### 3. Login Loops / Sticky State
*   **Cause**: `localStorage` retaining old tokens (`sb-...`).
*   **Fix**: In your `logout()` function, forcefully clear `localStorage` or at least all keys starting with `sb-`.

### 4. `file://` Protocol
*   **Cause**: OAuth redirects do not work with file paths.
*   **Fix**: You **MUST** use a local server (`python -m http.server 8000` or VS Code Live Server).
