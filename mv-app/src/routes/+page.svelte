<script lang="ts">
    import { onMount } from 'svelte';
    import { getCurrentlyPlaying, setVolume, type GetCurrentlyPlayingResult, type SongInfo, type NoTrackPlaying, type ErrorInfo } from '$lib/spotify';
    import { loginWithSpotify, logoutWithSpotify } from '$lib/auth';
    import SongProgressBar from '$lib/SongProgressBar.svelte';
    import SinVisualizer from '$lib/Visualizer.svelte';
    import BubbleViz from '$lib/BubbleVisualizer.svelte';
    import WaveViz from '$lib/WaveVisualizer.svelte';
    import { genreColors } from '$lib/genre-mapping';

    import '../style.css';

    let selectedVisualizer = 'sin';
    let showOptions = false;
    let volumeLevel = 50; // Default volume level
    let showVolumeControl = false;

    function setVisualizer(type: string) {
        selectedVisualizer = type;
        showOptions = false;
    }

    type SongInfo = {
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
            song = result;
            error = null;
            currentProgress = song.progress_ms;
            currentDuration = song.duration_ms;
            volumeLevel = song.volume;
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

    let previousSongId: string | null = null;

    $: if (song && song.genre) {
        const currentSongId = `${song.title}-${song.artist}`;

        if (currentSongId !== previousSongId) {
            previousSongId = currentSongId;

            const genre = song.genre.toLowerCase();
            console.log('Genre:', genre);
            const genreSet = genreColors[genre];

            if (genreSet?.length >= 3) {
                [color1, color2, color3] = genreSet;
            } else {
                [color1, color2, color3] = ['#ffffff', '#888888', '#000000'];
            }
        }
    }



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
                    <button on:click={() => setVisualizer('waves')}>
                        <img src="/ring-preview.PNG" alt="Wave Ring Preview" />
                        <span>Wave Ring</span>
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
            </div>
            
            {/if}
        </div>
        <div class="visualizer">
            {#if selectedVisualizer === 'sin'}
                <SinVisualizer {song} {color1} {color2} {color3} />
            {:else if selectedVisualizer === 'bubbles'}
                <BubbleViz {song} {color1} {color2} {color3} />
            {:else if selectedVisualizer === 'waves'}
                <WaveViz {song} {color1} {color2} {color3} />
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

