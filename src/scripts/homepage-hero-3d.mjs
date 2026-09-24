import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function startHero(reduced, wide) {
  // Hero brand object: fiber-optic torus knot, dispersion shader, bloom.
  const knotCanvas = document.getElementById('hero-knot');
  if (knotCanvas && !reduced && wide) {
    const renderer = new THREE.WebGLRenderer({ canvas: knotCanvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080814');
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 8.6);

    const stops = ['#C7C9F5', '#818CF8', '#6366F1', '#4F46E5'].map((c) => new THREE.Color(c));
    const uniforms = {
      uTime: { value: 0 },
      uC0: { value: stops[0] }, uC1: { value: stops[1] },
      uC2: { value: stops[2] }, uC3: { value: stops[3] },
    };
    const vert = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
      void main() { vUv = uv; vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0); vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv; }`;
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: `uniform float uTime; uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
        vec3 ramp(float t) { t = fract(t);
          if (t < 0.3333) return mix(uC0, uC1, smoothstep(0.0, 1.0, t / 0.3333));
          if (t < 0.6666) return mix(uC1, uC2, smoothstep(0.0, 1.0, (t - 0.3333) / 0.3333));
          return mix(uC2, uC3, smoothstep(0.0, 1.0, (t - 0.6666) / 0.3334)); }
        void main() {
          vec3 base = ramp(vUv.x + uTime * 0.03);
          float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.2);
          float pulse = smoothstep(0.965, 1.0, sin((vUv.x - uTime * 0.06) * 40.0) * 0.5 + 0.5);
          vec3 color = base * (0.22 + 0.62 * fresnel) + base * pulse * 0.85;
          gl_FragColor = vec4(color, 1.0); }`,
    });
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.6, 0.12, 520, 48, 2, 3), material);
    knot.position.x = 1.7;
    scene.add(knot);
    const halo = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.6, 0.22, 260, 32, 2, 3),
      new THREE.ShaderMaterial({
        uniforms, vertexShader: vert,
        fragmentShader: `uniform vec3 uC1; varying vec3 vNormal; varying vec3 vView;
          void main() { float f = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
            gl_FragColor = vec4(uC1 * f * 0.28, 1.0); }`,
        blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      }),
    );
    halo.position.x = 1.7;
    scene.add(halo);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.42, 0.28));

    const fit = () => {
      const w = knotCanvas.clientWidth, h = knotCanvas.clientHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(fit).observe(knotCanvas);
    fit();

    let rx = 0.42, ry = -0.28, visible = true;
    addEventListener('pointermove', (e) => {
      ry = -0.28 + (e.clientX / innerWidth - 0.5) * 0.35;
      rx = 0.42 + (e.clientY / innerHeight - 0.5) * 0.25;
    });
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(knotCanvas);

    const clock = new THREE.Clock();
    const frame = () => {
      requestAnimationFrame(frame);
      if (!visible) return;
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      knot.rotation.z = t * 0.045;
      knot.rotation.x += (rx - knot.rotation.x) * 0.04;
      knot.rotation.y += (ry - knot.rotation.y) * 0.04;
      halo.rotation.copy(knot.rotation);
      composer.render();
    };
    frame();
    knotCanvas.classList.add('ready');
  } else {
    document.documentElement.classList.add('static-hero');
  }
}
