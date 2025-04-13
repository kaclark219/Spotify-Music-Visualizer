<script lang="ts">
    import { onMount } from 'svelte';
    import { getCurrentlyPlaying, type GetCurrentlyPlayingResult, type SongInfo, type NoTrackPlaying, type ErrorInfo } from '$lib/spotify';
    import { loginWithSpotify, logoutWithSpotify } from '$lib/auth';
    import SongProgressBar from '$lib/SongProgressBar.svelte';
    import Visualizer from '$lib/Visualizer.svelte';

    import '../style.css';

    type SongInfo = {
        title: string;
        artist: string;
        albumArt: string;
        genre: string;
        progress_ms: number;
        duration_ms: number;
        is_playing: boolean;
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
        <div class="visualizer">
            <Visualizer {song} />
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
