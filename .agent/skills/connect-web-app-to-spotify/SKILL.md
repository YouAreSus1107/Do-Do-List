---
description: Connect a static web app to Spotify using OAuth 2.0 PKCE flow (No Backend Required).
---

# Connect Web App to Spotify (PKCE)

This skill provides a complete, copy-paste solution for adding a "Now Playing" widget to a static website using the Spotify Web API.

## 1. Spotify Dashboard Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Create an App.
3. Edit Settings -> **Redirect URIs**: add your app URL (e.g., `http://127.0.0.1:5500/` or `https://your-site.netlify.app/`).
4. Copy the **Client ID**.

## 2. Implementation

### `app_spotify.js` (The Logic)
Create this file and link it in your HTML.

```javascript
const SPOTIFY_CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const REDIRECT_URI = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? window.location.origin + window.location.pathname
    : window.location.origin + '/';

const SCOPES = 'user-read-currently-playing user-read-playback-state';

// ... (Copy the full PKCE auth logic from the reference implementation) ...
```

### HTML
```html
<div id="spotify-widget"></div>
```

### CSS
```css
#spotify-widget {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
}
/* ... Add styling for .spotify-playing, .spotify-cover-huge ... */
```

## 3. How it Works (PKCE)
1. **Login**: Generates a random `code_verifier` and SHA-256 `code_challenge`. Redirects user to Spotify.
2. **Callback**: User returns with `?code=...`. App sends `code` + `code_verifier` to get tokens.
3. **Storage**: Access Token and Refresh Token are stored in `localStorage`.
4. **Polling**: App checks `v1/me/player/currently-playing` every few seconds.
5. **Refresh**: If Access Token expires (1 hr), uses Refresh Token to get a new one automatically.
