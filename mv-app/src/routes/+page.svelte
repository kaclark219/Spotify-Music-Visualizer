<script lang="ts">
    import { onMount } from 'svelte';
    import { getCurrentlyPlaying, getAudioFeatures, setVolume, type GetCurrentlyPlayingResult, type SongInfo, type NoTrackPlaying, type ErrorInfo, type AudioFeatures } from '$lib/spotify';
    import { loginWithSpotify, logoutWithSpotify } from '$lib/auth';
    import SongProgressBar from '$lib/SongProgressBar.svelte';
    import SinVisualizer from '$lib/Visualizer.svelte';
    import BubbleViz from '$lib/BubbleVisualizer.svelte';

    import '../style.css';

    let selectedVisualizer = 'sin';
    let showOptions = false;
    let audioFeatures: AudioFeatures | null = null;
    let volumeLevel = 50; // Default volume level
    let showVolumeControl = false;

    function setVisualizer(type: string) {
        selectedVisualizer = type;
        showOptions = false;
    }

    type SongInfo = {
        id: string;
        title: string;
        artist: string;
        albumArt: string;
        genre: string;
        progress_ms: number;
        duration_ms: number;
        is_playing: boolean;
        volume: number;
    };

    type NoTrackPlaying = { noTrackPlaying: true };
    type ErrorInfo = { error: string };

    let song: SongInfo | null = null;
    let error: string | null = null;

    let currentProgress = 0;
    let currentDuration = 1;

    async function fetchSong() {
        const result: GetCurrentlyPlayingResult = await getCurrentlyPlaying();

        // 1) If it's the "noTrackPlaying" object, keep the old 'song' and mark paused
        if ('noTrackPlaying' in result && result.noTrackPlaying) {
            if (song) {
                song.is_playing = false;
            }
            return;
        } else if ('error' in result) {
            if (result.error === 'User not authenticated') {
                error = result.error;
                song = null;
            } else {
                console.error(result.error);
            }
            return;
        } else {
            const oldId = song?.id;
            song = result;
            error = null;
            currentProgress = song.progress_ms;
            currentDuration = song.duration_ms;
            volumeLevel = song.volume;
            
            // If we've got a new song, fetch its audio features
            if (oldId !== song.id) {
                fetchAudioFeatures(song.id);
            }
        }
    }
    
    async function fetchAudioFeatures(trackId: string) {
        try {
            const features = await getAudioFeatures(trackId);
            if ('error' in features) {
                console.error("Error fetching audio features:", features.error);
                return;
            }
            
            audioFeatures = features;
            console.log("Audio features loaded:", features);
        } catch (error) {
            console.error("Failed to get audio features:", error);
        }
    }
    
    async function handleVolumeChange() {
        if (!song) return;
        
        // Update the volume in Spotify
        const success = await setVolume(volumeLevel);
        if (success && song) {
            song.volume = volumeLevel;
        }
    }

    onMount(() => {
        fetchSong();
        const interval = setInterval(fetchSong, 1000); // Refresh every 1s
        const progressInterval = setInterval(() => {
            if (song?.is_playing && currentProgress < currentDuration) {
                currentProgress = currentProgress + 1000;
            }
        }, 1000); // Visual progress update

        return () => {
            clearInterval(interval);
            clearInterval(progressInterval);
        };
    });

    let color1 = '#ff007f';
    let color2 = '#00ffff';
    let color3 = '#ffffff';

</script>

<main class={error ? "login-page" : "now-playing-page"}>
    {#if error}
        <div class="login-container">
            <img class="logo" src="/visualizer-logo.png" alt="Dissonant Pulse" />
            <!-- <p class="error-message">{error}</p> -->
            <p>A music visualization experience.</p>
            <button class="login-button" on:click={loginWithSpotify}>Login with Spotify</button>
        </div>
    {:else if song}
        <div class="options-wrapper">
            <button class="options-toggle" on:click={() => showOptions = !showOptions}>Settings</button>
            {#if showOptions}
            <div class="options-popup">
                <p>Select Visualization:</p>
                <div class="visualization-buttons">
                    <button on:click={() => setVisualizer('sin')}>
                        <img src="/sin-preview.png" alt="Sin Waves Preview" />
                        <span>Sin Waves</span>
                    </button>
                    <button on:click={() => setVisualizer('bubbles')}>
                        <img src="/bubble-preview.png" alt="Bubble Pulse Preview" />
                        <span>Bubble Pulse</span>
                    </button>
                </div>
                
                <div class="volume-control">
                    <p>Volume: {volumeLevel}%</p>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        bind:value={volumeLevel}
                        on:change={handleVolumeChange}
                    />
                    <p class="volume-hint">Adjust volume to change visualization size</p>
                </div>
            
                <div class="color-picker-group">
                    <p>Customize Colors:</p>
                    <label>
                        <input type="color" bind:value={color1} />
                    </label>
                    <label>
                        <input type="color" bind:value={color2} />
                    </label>
                    <label>
                        <input type="color" bind:value={color3} />
                    </label>
                </div>
                
                {#if audioFeatures}
                <div class="audio-info">
                    <p>Track Info:</p>
                    <ul>
                        <li>BPM: {audioFeatures.tempo.toFixed(1)}</li>
                        <li>Energy: {(audioFeatures.energy * 100).toFixed(0)}%</li>
                        <li>Loudness: {audioFeatures.loudness.toFixed(1)}dB</li>
                    </ul>
                </div>
                {/if}
            </div>
            
            {/if}
        </div>
        <div class="visualizer">
            {#if selectedVisualizer === 'sin'}
                <SinVisualizer {song} />
            {:else if selectedVisualizer === 'bubbles'}
                <BubbleViz {song} />
            {/if}
        </div>
        <div class="bottom-bar">
            <div class="now-playing-content">
                <img class="album-art" src={song.albumArt} alt="Album Art" />
                <div class="song-details">
                    <p class="song-title">{song.title}</p>
                    <p class="song-artist">{song.artist}</p>
                </div>
                <SongProgressBar progress={currentProgress} duration={currentDuration} />
            </div>
        </div>
    {/if}
</main>
{#if !error}
    <button class="logout-button" on:click={logoutWithSpotify}>Log Out</button>
{/if}

<style>
    /* Add these new styles */
    .volume-control {
        margin: 20px 0;
        padding: 10px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }
    
    .volume-control input[type="range"] {
        width: 100%;
        margin: 10px 0;
    }
    
    .volume-hint {
        font-size: 0.8em;
        color: rgba(255, 255, 255, 0.7);
        font-style: italic;
        margin-top: 5px;
    }
    
    .audio-info {
        margin-top: 20px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }
    
    .audio-info ul {
        list-style: none;
        padding: 0;
        margin: 10px 0 0 0;
    }
    
    .audio-info li {
        margin-bottom: 5px;
    }
</style>