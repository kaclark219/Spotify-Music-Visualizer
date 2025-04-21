<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  export let song: { title: string; artist: string; albumArt: string | null; genre: string; volume: number } | null = null;
  export let color1: string = '#ffffff';
  export let color2: string = '#888888';
  export let color3: string = '#000000';

  const hardcodedBPM: Record<string, number> = {
    "War Pigs - Black Sabbath": 91,
    "That That (prod. & feat. SUGA of BTS) - PSY": 130,
    "Talk talk - Charli xcx": 130,
    "Drunk on Halloween - Wallows": 101,
    "Summer Hate (Feat. Rain) - ZICO": 137,
    "Afterthought - Joji": 84,
    "OH GIRL - DPR LIVE": 120,
    "claws - Charli xcx": 135,
    "I'm Not A Vampire - Falling In Reverse": 185,
    "Impossible - RIIZE": 128,
    "Pink - Aerosmith": 172,
    "Westbound Sign - Green Day": 185,
    "Dog Days Are Over - Florence + The Machine": 150,
    "Potion - Djo": 164,
  };

  let bpm = 120;
  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.Camera;
  let renderer: THREE.WebGLRenderer;
  let mesh: THREE.Mesh;
  let clock: THREE.Clock;
  let material: THREE.ShaderMaterial;

  function isNearBlack(hex: string): boolean {
    const c = new THREE.Color(hex);
    return c.r + c.g + c.b < 0.2;
  }

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float time;
    uniform float bpm;
    uniform float volume;
    uniform bool glow1;
    uniform bool glow2;
    uniform bool glow3;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    varying vec2 vUv;

    float ring(vec2 uv, float radius, float width) {
      float d = distance(uv, vec2(0.5));
      return smoothstep(radius + width, radius, d) * smoothstep(radius - width, radius, d);
    }

    void main() {
      float beatSpeed = bpm / 120.0 * 0.5;
      float t = mod(time * beatSpeed, 1.0);
      vec2 uv = vUv;
      vec3 col = vec3(0.0);
      float d = distance(uv, vec2(0.5));

      float volScale = mix(2.5, 0.5, volume);

      float r1 = ring(uv, mod(t + 0.0, 1.0) * volScale, 0.01);
      float r2 = ring(uv, mod(t + 0.33, 1.0) * volScale, 0.01);
      float r3 = ring(uv, mod(t + 0.66, 1.0) * volScale, 0.01);

      col += color1 * r1;
      col += color2 * r2;
      col += color3 * r3;

      if (glow1) col += vec3(1.0) * exp(-10.0 * abs(mod(t + 0.0, 1.0) - d)) * r1;
      if (glow2) col += vec3(1.0) * exp(-10.0 * abs(mod(t + 0.33, 1.0) - d)) * r2;
      if (glow3) col += vec3(1.0) * exp(-10.0 * abs(mod(t + 0.66, 1.0) - d)) * r3;

      float fade = smoothstep(0.9, 0.4, d);
      gl_FragColor = vec4(col * fade, 1.0);
    }
  `;

  onMount(() => {
    initScene();
    animate();
    window.addEventListener('resize', onResize);
  });

  function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    clock = new THREE.Clock();

    const geometry = new THREE.PlaneGeometry(2, 2);
    material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        bpm: { value: bpm },
        volume: { value: 0.5 },
        glow1: { value: false },
        glow2: { value: false },
        glow3: { value: false },
        color1: { value: new THREE.Color(color1) },
        color2: { value: new THREE.Color(color2) },
        color3: { value: new THREE.Color(color3) },
      },
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    material.uniforms.time.value = elapsed;

    renderer.render(scene, camera);
  }

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  $: if (material && song) {
    const key = `${song.title} - ${song.artist}`;
    bpm = hardcodedBPM[key] ?? 120;

    const glow1 = isNearBlack(color1);
    const glow2 = isNearBlack(color2);
    const glow3 = isNearBlack(color3);

    material.uniforms.bpm.value = bpm;
    material.uniforms.color1.value = new THREE.Color(color1);
    material.uniforms.color2.value = new THREE.Color(color2);
    material.uniforms.color3.value = new THREE.Color(color3);
    material.uniforms.glow1.value = glow1;
    material.uniforms.glow2.value = glow2;
    material.uniforms.glow3.value = glow3;

    const vol = Math.max(0, Math.min(song.volume ?? 50, 100)) / 100;
    material.uniforms.volume.value = vol;
  }
</script>

<canvas bind:this={canvas} class="visualizer-canvas"></canvas>

<style>
  .visualizer-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: block;
    z-index: 0;
    background: black;
  }
</style>