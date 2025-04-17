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

  // We'll still keep these as fallbacks
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
  let audioContext: AudioContext;
  let analyser: AnalyserNode;
  let audioElement: HTMLAudioElement;

  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let mesh: THREE.Mesh | null = null;
  let clock: THREE.Clock;
  let threeInitialized = false;
  
  // Base geometry size - we'll scale the entire object from this
  const BASE_SIZE = 7; // Increased from 4 to 7
  
  // Audio feature state
  let currentBPM = 120;
  let currentVolume = 50;
  let currentEnergy = 0.5;
  
  // Scale multiplier based on volume and energy
  let scaleMultiplier = 1.0;

  const vertexShader = `
    uniform float time;
    uniform float frequency;
    varying vec3 vColor;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;

    float noise(vec3 p) {
        return sin(p.x * p.y * p.z);
    }

    vec3 mod289(vec3 x)
    {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x)
    {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x)
    {
      return mod289(((x*34.0)+10.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    vec3 fade(vec3 t) {
      return t*t*t*(t*(t*6.0-15.0)+10.0);
    }

    float pnoise(vec3 P, vec3 rep)
    {
      vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
      vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
      Pi0 = mod289(Pi0);
      Pi1 = mod289(Pi1);
      vec3 Pf0 = fract(P); // Fractional part for interpolation
      vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;

      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);

      vec4 gx0 = ixy0 * (1.0 / 7.0);
      vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);

      vec4 gx1 = ixy1 * (1.0 / 7.0);
      vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);

      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
      vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
      vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
      vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
      vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;

      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);

      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
      return 2.2 * n_xyz;
    }

    void main() {
        float noise = 3. * pnoise(position + time, vec3(10.));
        float displacement = (frequency / 30.) * (noise / 10.);
        
        // Apply regular sin wave displacement unaffected by volume
        vec3 newPosition = position + normal * displacement;
        
        vColor = color1 * (sin(time * 0.1) * 0.5 + 0.5) +
                color2 * (sin(time * 0.2) * 0.5 + 0.5) +
                color3 * (sin(time * 0.3) * 0.5 + 0.5);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    void main() {
        gl_FragColor = vec4(vColor, 1.0);
    }
  `;

  onMount(() => {
    initThreeJS();
    animateBlob();
    
    // If we have a song, fetch its audio features
    if (song?.id) {
      fetchAudioFeatures(song.id);
    }
  });
  
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

  function initAudio() {
    if (!song || !song.albumArt) return;
    audioElement = new Audio(song.albumArt);
    audioElement.loop = true;
    audioElement.play();

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    const sourceNode = audioContext.createMediaElementSource(audioElement);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, 800);

    clock = new THREE.Clock();

    const geometry = new THREE.IcosahedronGeometry(BASE_SIZE, 30);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0.0 },
        frequency: { value: 0.0 },
        color1: { value: new THREE.Color('#ffffff') },
        color2: { value: new THREE.Color('#888888') },
        color3: { value: new THREE.Color('#000000') },
      },
      wireframe: true,
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    camera.position.z = 15; // Moved a bit farther back to see the whole geometry

    threeInitialized = true;

    if (song) {
      updateColorsForSong();
      initAudio();
    }
  }

  function updateColorsForSong() {
    if (!threeInitialized || !mesh || !song || !song.genre) return;

    const songKey = `${song.title} - ${song.artist}`;
    const genre = hardcodedGenres[songKey] ?? song.genre ?? "default";
    const genreSet = genreColors[genre] || [];

    const colors = genreSet.length >= 3
      ? genreSet
      : ['#ffffff', '#888888', '#000000'];

    const material = mesh.material as THREE.ShaderMaterial;
    material.uniforms.color1.value = new THREE.Color(colors[0]);
    material.uniforms.color2.value = new THREE.Color(colors[1]);
    material.uniforms.color3.value = new THREE.Color(colors[2]);
  }
  
  function calculateVolumeScale(): number {
    // Get the current volume from song or hardcoded value
    const volume = song?.volume ?? currentVolume;
    
    // Calculate scale based on volume (0-100) and energy (0-1)
    // This creates a multiplier between 1.2 (quiet) and 2.2 (loud)
    return 1.2 + (1.0 * Math.pow(volume / 100, 1.2) * (currentEnergy || 0.5));
  }

  function animateBlob() {
    const animate = () => {
      requestAnimationFrame(animate);
      if (!mesh || !clock) return;

      const elapsedTime = clock.getElapsedTime();
      (mesh.material as THREE.ShaderMaterial).uniforms.time.value = elapsedTime;

      // Set frequency based on actual BPM if available
      const songKey = song ? `${song.title} - ${song.artist}` : '';
      const bpm = hardcodedBPM[songKey] ?? currentBPM ?? 120;
      
      (mesh.material as THREE.ShaderMaterial).uniforms.frequency.value = bpm;
      
      // Calculate volume scale factor
      const scaleFactor = calculateVolumeScale();
      
      // Apply scale to the entire mesh - this scales the whole geometry
      mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      renderer.render(scene, camera);
    };

    animate();
  }

  $: if (threeInitialized && song) {
    updateColorsForSong();
    initAudio();
    
    // Update current volume from song
    if (song.volume !== undefined) {
      currentVolume = song.volume;
    }
    
    // Fetch audio features if we have a track ID
    if (song.id) {
      fetchAudioFeatures(song.id);
    }
  }
</script>

<canvas bind:this={canvas} class="visualizer-canvas"></canvas>

<style>
  .visualizer-canvas {
      width: 100%;
      height: 700px;
      display: block;
  }
</style>