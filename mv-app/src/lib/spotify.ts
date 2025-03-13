import { refreshAccessToken } from '$lib/auth';

type SongInfo = {
    title: string;
    artist: string;
    albumArt: string;
};

type ErrorInfo = {
    error: string;
};

export async function getCurrentlyPlaying(): Promise<SongInfo | ErrorInfo> {
    let accessToken = localStorage.getItem('spotify_access_token');

    if (!accessToken) {
        accessToken = await refreshAccessToken();
        if (!accessToken) return { error: 'User not authenticated' };
    }

    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (response.status === 204) return { error: "No song is currently playing" };

    const data = await response.json();
    return {
        title: data.item.name,
        artist: data.item.artists[0].name,
        albumArt: data.item.album.images[0].url
    };
}
