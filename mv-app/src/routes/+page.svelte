<script lang="ts">
    import { onMount } from 'svelte';
    import { getCurrentlyPlaying } from '$lib/spotify';
    import { loginWithSpotify } from '$lib/auth';

    import '../style.css';

    type SongInfo = {
        title: string;
        artist: string;
        albumArt: string;
        genre: string;
    };

    let song: SongInfo | null = null;
    let error: string | null = null;

    async function fetchSong() {
        const result = await getCurrentlyPlaying();
        if ('error' in result) {
            error = result.error;
            song = null; // Ensure song is null when there's an error
        } else {
            song = result;
            error = null; // Clear any previous error
        }
    }

    onMount(() => {
        fetchSong();
        const interval = setInterval(fetchSong, 5000); // Refresh every 5s
        return () => clearInterval(interval); // Cleanup on component unmount
    });
</script>

<main class="now-playing-bar">
    {#if error}
        <p class="error-message">{error}</p>
        <button class="login-button" on:click={loginWithSpotify}>Login with Spotify</button>
    {:else if song}
        <div class="now-playing-content">
            <img class="album-art" src={song.albumArt} alt="Album Art" />
            <div class="song-details">
                <p class="song-title">{song.title}</p>
                <p class="song-artist">{song.artist}</p>
            </div>
        </div>
    {/if}
</main>
