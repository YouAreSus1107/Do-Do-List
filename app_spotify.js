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
