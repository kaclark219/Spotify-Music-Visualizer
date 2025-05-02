# Spotify Music Visualizer

A real-time, audio-reactive music visualizer that connects to your Spotify playback. Built with Svelte, TypeScript, Three.js, and the Web Audio API, it visualizes beats, frequencies, and volume in multiple customizable visual styles.

## Features

- Spotify Web Playback integration
- Real-time audio analysis (FFT, volume scaling, BPM sync)
- Multiple visualizer modes:
  - Sine waves
  - Bubbles
  - Circular ripples
- Dynamic color theming (user customization support)
- Responsive and performance-optimized with Three.js and shaders
- Genre-based color mapping
- Svelte + TypeScript front-end

## Tech Stack

- **Frontend:** Svelte, TypeScript
- **3D Graphics:** Three.js, GLSL shaders
- **Audio Processing:** Web Audio API, Spotify Web Playback SDK
- **Authentication & API:** Spotify OAuth 2.0, Spotify Web API

## Getting Started

### Prerequisites

- Node.js 18+
- Spotify Premium account (required for Web Playback SDK)

### Spotify App Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications) and create a new app.
2. Add the following Redirect URI:  
   `http://localhost:5173/callback`
3. Note your **Client ID** and **Client Secret**.

### Installation

```bash
git clone https://github.com/kaclark219/Spotify-Music-Visualizer.git
cd Spotify-Music-Visualizer
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
```

### Run the App

```bash
npm run dev
```
Then open `http://localhost:5173` in your browser.

## Visualizer Styles

| Visualizer | Description |
|------------|-------------|
| Sine wave | Organic blob of sine waves that scales to volume and BPM |
| Bubbles | Floating bubbles reacting to volume and BPM |
| Ripple | Circular ripples and BPM |

> **Note:**  
> Due to Spotify’s API rate limits, BPM values are currently hard-coded for specific songs.  
> The API blocked further calls after exceeding request limits during testing.  
> Real-time BPM retrieval will be revisited in future updates.


*The test playlists can be found here:* 
[![Spotify](https://img.shields.io/badge/Listen%20on-Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white)](https://open.spotify.com/playlist/3s3S7g8QmU0CyMvnUcaNWz?utm_source=generator&theme=0)
