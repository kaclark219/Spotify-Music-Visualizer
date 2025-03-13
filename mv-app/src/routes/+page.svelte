<script lang="ts">
    import { onMount } from 'svelte';
    import { getCurrentlyPlaying } from '$lib/spotify';
    import { loginWithSpotify } from '$lib/auth';

    type SongInfo = {
        title: string;
        artist: string;
        albumArt: string;
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

<main>
    {#if error}
        <p>{error}</p>
        <button on:click={loginWithSpotify}>Login with Spotify</button>
    {:else if song}
        <h2>Now Playing</h2>
        <p><strong>{song.title}</strong> by {song.artist}</p>
        <img src={song.albumArt} alt="Album Art" width="200" />
    {/if}
</main>