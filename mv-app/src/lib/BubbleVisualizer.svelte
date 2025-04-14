<script lang="ts">
    import { onMount } from 'svelte';
    import * as THREE from 'three';
    import { genreColors } from './genre-mapping';
  
    export let song: { title: string; artist: string; albumArt: string | null; genre: string } | null = null;
  
    const hardcodedBPM: Record<string, number> = {
      "War Pigs - Black Sabbath": 91,
      "That That (prod. & feat. SUGA of BTS) - PSY": 130,
      "Talk talk - Charli xcx": 130,
      "Drunk on Halloween - Wallows": 101,
      "Summer Hate (Feat. Rain) - ZICO": 137,
    };
  
    let canvas: HTMLCanvasElement;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let bubbles: THREE.Mesh[] = [];
    let clock: THREE.Clock;
    let threeInitialized = false;
    let currentSongKey = '';
  
    function createBubble(color: THREE.Color): THREE.Mesh {
      const geometry = new THREE.SphereGeometry(Math.random() * 0.4 + 0.2, 64, 64);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.1,
        metalness: 1.0,
        emissive: color.clone().multiplyScalar(1.2),
        emissiveIntensity: 3.5
      });
      const bubble = new THREE.Mesh(geometry, material);
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
      const genreSet = genreColors[songData.genre] || ['#ffffff', '#ffeecc', '#ccf5ff'];
      const songKey = `${songData.title} - ${songData.artist}`;
  
      if (songKey !== currentSongKey) {
        currentSongKey = songKey;
        clearBubbles();
        for (let i = 0; i < 50; i++) {
          const color = new THREE.Color(genreSet[i % genreSet.length]);
          const bubble = createBubble(color);
          scene.add(bubble);
          bubbles.push(bubble);
        }
      }
    }
  
    function animateBubbles() {
      const animate = () => {
        requestAnimationFrame(animate);
        if (!clock || !song) return;
  
        const elapsed = clock.getElapsedTime();
        const songKey = `${song.title} - ${song.artist}`;
        const bpm = hardcodedBPM[songKey] ?? 120;
        const beat = Math.abs(Math.sin(elapsed * (bpm / 60)));
  
        for (const bubble of bubbles) {
          const scale = 1 + beat * 0.4;
          bubble.scale.set(scale, scale, scale);
  
          bubble.position.add(bubble.userData.velocity);
          bubble.rotation.y += 0.008 + beat * 0.004;
          bubble.rotation.x += 0.004 + beat * 0.002;
  
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
  