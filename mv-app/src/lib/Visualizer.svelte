<script lang="ts">
    import { onMount } from 'svelte';
    import * as THREE from 'three';
    import { genreColors } from './genre-mapping';
  
    export let song: { title: string; artist: string; albumArt: string | null; genre: string } | null = null;
  
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
  
    const vertexShader = `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      varying vec3 vColor;
  
      float noise(vec3 p) {
          return sin(p.x * p.y * p.z);
      }
  
      void main() {
          vec3 pos = position;
          float n = noise(pos * 0.5 + time * 0.1);
          pos += normal * n * 0.5;
          vColor = color1 * (sin(time * 0.1) * 0.5 + 0.5) +
                   color2 * (sin(time * 0.2) * 0.5 + 0.5) +
                   color3 * (sin(time * 0.3) * 0.5 + 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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
    });
  
    function initAudio() {
      if (!song || !song.albumArt) return;
      audioElement = new Audio(song.albumArt);
      audioElement.loop = true;
      audioElement.play();
  
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
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
  
      const geometry = new THREE.SphereGeometry(2, 64, 64);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color('#ffffff') },
          color2: { value: new THREE.Color('#888888') },
          color3: { value: new THREE.Color('#000000') },
        },
        wireframe: true,
      });
  
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      camera.position.z = 5;
  
      threeInitialized = true;
  
      if (song) {
        updateColorsForSong();
        initAudio();
      }
    }
  
    function updateColorsForSong() {
      if (!threeInitialized || !mesh || !song || !song.genre) return;
  
      const genreSet = genreColors[song.genre] || [];
      const colors = genreSet.length >= 3
        ? genreSet
        : ['#ffffff', '#888888', '#000000'];
  
      const material = mesh.material as THREE.ShaderMaterial;
      material.uniforms.color1.value = new THREE.Color(colors[0]);
      material.uniforms.color2.value = new THREE.Color(colors[1]);
      material.uniforms.color3.value = new THREE.Color(colors[2]);
    }
  
    function animateBlob() {
      const animate = () => {
        requestAnimationFrame(animate);
        if (!mesh || !clock) return;
  
        const elapsedTime = clock.getElapsedTime();
        (mesh.material as THREE.ShaderMaterial).uniforms.time.value = elapsedTime;
  
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
  
      animate();
    }
  
    $: if (threeInitialized && song) {
      updateColorsForSong();
      initAudio();
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