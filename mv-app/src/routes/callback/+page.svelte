<script lang="ts">
    import { onMount } from 'svelte';
    import { getAccessToken } from '$lib/auth';
    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            getAccessToken(code);
        }
    });
</script>

<main>
    <p>Authenticating with Spotify...</p>
</main>
