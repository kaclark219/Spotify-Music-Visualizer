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
  
    const vertexShader = `
      uniform float time;
      uniform float frequency;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      varying vec3 vColor;
  
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
          float displacement = (frequency / 10.0) * (noise / 5.0);
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
    });
  
    // function initAudio() {
    //   if (!song || !song.albumArt) return;
    //   audioElement = new Audio(song.albumArt);
    //   audioElement.loop = true;
    //   audioElement.play();
  
    //   audioContext = new (window.AudioContext || window.webkitAudioContext)();
    //   analyser = audioContext.createAnalyser();
    //   analyser.fftSize = 32;
    //   const sourceNode = audioContext.createMediaElementSource(audioElement);
    //   sourceNode.connect(analyser);
    //   analyser.connect(audioContext.destination);
    // }
  
    function initThreeJS() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(window.innerWidth, 800);
  
      clock = new THREE.Clock();
  
      const geometry = new THREE.IcosahedronGeometry(4, 30);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0.0 },
          frequency: { value: 0.0},
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
        // initAudio();
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
  
    function animateBlob() {
      const animate = () => {
        requestAnimationFrame(animate);
        if (!mesh || !clock || !song) return;

        const elapsedTime = clock.getElapsedTime();
        const material = mesh.material as THREE.ShaderMaterial;
        material.uniforms.time.value = elapsedTime;

        //////////////////////////////////////////////////////////////
        // Use hardcoded BPM for frequency animation
        //////////////////////////////////////////////////////////////
        const songKey = `${song.title} - ${song.artist}`;
        const bpm = hardcodedBPM[songKey] ?? 120; // fallback if not found
        const simulatedFreq = Math.sin(elapsedTime * (bpm / 60)) * 40;
        material.uniforms.frequency.value = simulatedFreq;

        renderer.render(scene, camera);
      };

      animate();
    }

  
    $: if (threeInitialized && song) {
      updateColorsForSong();
      // initAudio();
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
