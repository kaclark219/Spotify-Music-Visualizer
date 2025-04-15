<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { genreColors } from './genre-mapping';
  import { getAudioFeatures } from '$lib/spotify';

  export let song: { 
    id: string;
    title: string; 
    artist: string; 
    albumArt: string | null; 
    genre: string;
    volume: number;
  } | null = null;

  const hardcodedBPM: Record<string, number> = {
    "War Pigs - Black Sabbath": 91,
    "That That (prod. & feat. SUGA of BTS) - PSY": 130,
    "Talk talk - Charli xcx": 130,
    "Drunk on Halloween - Wallows": 101,
    "Summer Hate (Feat. Rain) - ZICO": 137,
    "Afterthought - Joji": 84,
  };
  const hardcodedGenres: Record<string, string> = {
    "War Pigs - Black Sabbath": "metal",
    "That That (prod. & feat. SUGA of BTS) - PSY": "k-pop",
    "Talk talk - Charli xcx": "pop",
    "Drunk on Halloween - Wallows": "indie",
    "Summer Hate (Feat. Rain) - ZICO": "k-rap",
    "Afterthought - Joji": "hip-hop",
  };

  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let bubbles: THREE.Mesh[] = [];
  let clock: THREE.Clock;
  let threeInitialized = false;
  let currentSongKey = '';
  
  // Audio feature state
  let currentBPM = 120;
  let currentVolume = 50;
  let currentEnergy = 0.5;
  let baseScale = 1.0;

  function createBubble(color: THREE.Color): THREE.Mesh {
    // Randomize bubble size, but we'll scale it later based on volume
    const bubbleSize = Math.random() * 0.4 + 0.2;
    
    const geometry = new THREE.SphereGeometry(bubbleSize, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.6,
      emissive: color.clone().multiplyScalar(0.1),
      emissiveIntensity: 0.3
    });
    
    const bubble = new THREE.Mesh(geometry, material);
    
    // Store original size for scaling with volume later
    bubble.userData.originalSize = bubbleSize;
    
    bubble.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 5
    );
    
    bubble.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      Math.random() * 0.02 + 0.01,
      0
    );
    
    return bubble;
  }
  
  async function fetchAudioFeatures(trackId: string) {
    try {
      const features = await getAudioFeatures(trackId);
      if ('error' in features) {
        console.error("Error fetching audio features:", features.error);
        return;
      }
      
      // Update our audio state with real values
      currentBPM = features.tempo;
      currentEnergy = features.energy;
      
      console.log("Audio features fetched:", features);
    } catch (error) {
      console.error("Failed to fetch audio features:", error);
    }
  }

  function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, 800);
    clock = new THREE.Clock();
    camera.position.z = 5;
    threeInitialized = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 3);
    const pointLight = new THREE.PointLight(0xffffff, 4);
    pointLight.position.set(0, 4, 5);
    scene.add(ambientLight, pointLight);

    if (song) {
      generateBubblesForSong(song);
    }
  }

  function clearBubbles() {
    for (const bubble of bubbles) {
      scene.remove(bubble);
      bubble.geometry.dispose();
      (bubble.material as THREE.Material).dispose();
    }
    bubbles = [];
  }

  function generateBubblesForSong(songData: typeof song) {
    if (!songData) return;
    
    const songKey = `${songData.title} - ${songData.artist}`;
    const genre = hardcodedGenres[songKey] ?? songData.genre ?? 'default';
    const genreSet = genreColors[genre] || ['#ffffff', '#ffeecc', '#ccf5ff'];

    if (songKey !== currentSongKey) {
      currentSongKey = songKey;
      clearBubbles();
      for (let i = 0; i < 50; i++) {
        const color = new THREE.Color(genreSet[i % genreSet.length]);
        const bubble = createBubble(color);
        scene.add(bubble);
        bubbles.push(bubble);
      }
      
      // Fetch audio features if track ID is available
      if (songData.id) {
        fetchAudioFeatures(songData.id);
      }
    }
    
    // Always update the current volume when song data changes
    if (songData.volume !== undefined) {
      currentVolume = songData.volume;
    }
  }
  
  function calculateVolumeScale(): number {
    // Get the current volume (0-100)
    const volume = song?.volume ?? currentVolume;
    
    // Calculate a volume multiplier that gives us a range between 0.5 (quiet) and 2.0 (loud)
    // We use energy as an additional factor to make more energetic songs more responsive
    return 0.5 + (1.5 * (volume / 100) * (currentEnergy || 0.5));
  }

  function animateBubbles() {
    const animate = () => {
      requestAnimationFrame(animate);
      if (!clock || !song) return;

      const elapsed = clock.getElapsedTime();
      const songKey = `${song.title} - ${song.artist}`;
      const bpm = hardcodedBPM[songKey] ?? currentBPM ?? 120;
      
      // Calculate beat pulse based on BPM
      const beatFrequency = bpm / 60; // Beats per second
      const beat = Math.abs(Math.sin(elapsed * beatFrequency * Math.PI));
      
      // Calculate volume-based scaling
      const volumeScale = calculateVolumeScale();

      for (const bubble of bubbles) {
        // Calculate scale based on original size, beat pulse, and volume
        const baseSize = bubble.userData.originalSize || 1.0;
        const beatEffect = 1 + beat * 0.4;
        
        // Combine beat effect with volume scale
        const finalScale = baseSize * beatEffect * volumeScale;
        
        bubble.scale.set(finalScale, finalScale, finalScale);

        bubble.position.add(bubble.userData.velocity);
        
        // Rotation speed also affected by volume
        const rotationSpeed = 0.008 + (beat * 0.004 * volumeScale);
        bubble.rotation.y += rotationSpeed;
        bubble.rotation.x += rotationSpeed / 2;

        // Wrap bubbles around edges
        if (bubble.position.y > 7) bubble.position.y = -7;
        if (bubble.position.x > 6) bubble.position.x = -6;
        if (bubble.position.x < -6) bubble.position.x = 6;
      }

      renderer.render(scene, camera);
    };

    animate();
  }

  onMount(() => {
    initThreeJS();
    animateBubbles();
  });

  $: if (threeInitialized && song) {
    generateBubblesForSong(song);
  }
</script>

<canvas bind:this={canvas} class="visualizer-canvas"></canvas>

<style>
  .visualizer-canvas {
    width: 100%;
    height: 800px;
    display: block;
  }
</style>