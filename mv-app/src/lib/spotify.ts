import { refreshAccessToken } from '$lib/auth';

export type SongInfo = {
    title: string;
    artist: string;
    albumArt: string;
    genre: string;
    progress_ms: number;
    duration_ms: number;
    is_playing: boolean;
};

export type ErrorInfo = {
    error: string;
};

export type NoTrackPlaying = {
    noTrackPlaying: true;
};

export type GetCurrentlyPlayingResult = SongInfo | ErrorInfo | NoTrackPlaying;

async function getArtistGenre(artistId: string, accessToken: string): Promise<string> {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (!response.ok) return "Unknown";
    
    const artistData = await response.json();
    return artistData.genres.length > 0 ? artistData.genres[0] : "Unknown";
}

export async function getCurrentlyPlaying(): Promise<GetCurrentlyPlayingResult> {
    let accessToken = localStorage.getItem('spotify_access_token');

    if (!accessToken) {
        accessToken = await refreshAccessToken();
        if (!accessToken) return { error: 'User not authenticated' };
    }

    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (response.status === 204) {
        return { noTrackPlaying: true };
    }

    const data = await response.json();
    console.log("Spotify API response:", data);

    if (!data || !data.item) {
        return { error: "No song data available" };
    }

    const artist = data.item.artists?.[0];
    if (!artist) return { error: "No artist found" };

    const genre = await getArtistGenre(artist.id, accessToken);

    return {
        title: data.item.name || "Unknown Title",
        artist: artist.name || "Unknown Artist",
        albumArt: data.item.album?.images?.[0]?.url || "",
        genre: genre,
        progress_ms: data.progress_ms || 0,
        duration_ms: data.item.duration_ms || 1,
        is_playing: data.is_playing ?? false,
    };
}

