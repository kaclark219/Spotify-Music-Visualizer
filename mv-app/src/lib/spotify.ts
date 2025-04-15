import { refreshAccessToken } from '$lib/auth';

export type SongInfo = {
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

export type AudioFeatures = {
    tempo: number;     // BPM
    energy: number;    // 0.0 to 1.0 scale - higher means more energetic
    loudness: number;  // dB typically around -60 to 0 - higher means louder
    key: number;       // Musical key (0=C, 1=C♯/D♭, 2=D, etc.)
    mode: number;      // 0 = minor, 1 = major
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

    const playerResponse = await fetch("https://api.spotify.com/v1/me/player", {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    let volume = 50; // Default value
    
    if (playerResponse.ok) {
        const playerData = await playerResponse.json();
        volume = playerData.device?.volume_percent || 50;
    }

    return {
        id: data.item.id || "",
        title: data.item.name || "Unknown Title",
        artist: artist.name || "Unknown Artist",
        albumArt: data.item.album?.images?.[0]?.url || "",
        genre: genre,
        progress_ms: data.progress_ms || 0,
        duration_ms: data.item.duration_ms || 1,
        is_playing: data.is_playing ?? false,
        volume: volume
    };
}

export async function getAudioFeatures(trackId: string): Promise<AudioFeatures | ErrorInfo> {
    let accessToken = localStorage.getItem('spotify_access_token');

    if (!accessToken) {
        accessToken = await refreshAccessToken();
        if (!accessToken) return { error: 'User not authenticated' };
    }

    const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        return { error: `Failed to get audio features: ${response.status}` };
    }

    const data = await response.json();
    
    return {
        tempo: data.tempo,           // BPM
        energy: data.energy,         // 0.0 to 1.0
        loudness: data.loudness,     // typically -60 to 0 dB
        key: data.key,               // musical key
        mode: data.mode              // minor or major
    };
}

export async function setVolume(volumeLevel: number): Promise<boolean> {
    let accessToken = localStorage.getItem('spotify_access_token');

    if (!accessToken) {
        accessToken = await refreshAccessToken();
        if (!accessToken) return false;
    }

    const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumeLevel}`, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${accessToken}` }
    });

    return response.ok;
}

