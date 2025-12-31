// script.js
// Vanilla JS: background canvas (particles, fireworks), surprise effects, year animation, and simple WebAudio ambient music.
// No external libraries. Optimized for modern browsers, falls back gracefully.

(() => {
  // Helpers and settings
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let w = 0, h = 0;
  function resize() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    w = Math.max(300, window.innerWidth);
    h = Math.max(300, window.innerHeight);
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });

  // Respect reduced motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Performance: scale particles by screen size
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 600;
  const PARTICLE_COUNT = smallScreen ? 40 : 90;
  const FLOATERS = smallScreen ? 18 : 36;

  resize();

  // Background gradient animation (soft)
  let gradOffset = 0;
  function drawBackground() {
    gradOffset = (gradOffset + 0.002) % 1;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    // moving stops for subtle shift
    g.addColorStop(0, '#0b1026');
    g.addColorStop(Math.abs(Math.sin(gradOffset)) * 0.8, '#24103b');
    g.addColorStop(1, '#2b1055');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // slight vignette
    const vignette = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)/4, w/2, h/2, Math.max(w,h));
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  // Stars / floating particles
  const particles = [];
  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.05;
      this.vy = (Math.random() - 0.5) * 0.25 - 0.05;
      this.size = Math.random() * 2.2 + 0.4;
      this.alpha = 0.2 + Math.random() * 0.9;
      this.twinkle = Math.random() * 100;
    }
    step(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.twinkle += 0.05 * dt;
      this.alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(this.twinkle / 12));
      if (this.x < -10 || this.x > w + 10 || this.y < -10 || this.y > h + 10) this.reset();
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${this.alpha * 0.9})`;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < FLOATERS; i++) particles.push(new Particle());

  // Fireworks and confetti systems
  const effects = [];
  class Spark {
    constructor(x, y, color, life=120, type='spark') {
      this.x = x; this.y = y;
      const speed = (Math.random() * 4) + 1.2;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = life;
      this.age = 0;
      this.color = color;
      this.size = (type === 'confetti') ? (2 + Math.random()*4) : (1 + Math.random()*2.2);
      this.type = type;
      this.spin = Math.random() * 0.2;
    }
    step(dt) {
      this.vy += 0.04 * dt; // gravity
      this.x += this.vx * dt * 0.6;
      this.y += this.vy * dt * 0.6;
      this.age += dt;
    }
    draw(ctx) {
      const t = 1 - Math.min(1, this.age / this.life);
      ctx.save();
      ctx.globalAlpha = Math.max(0, t);
      if (this.type === 'confetti') {
        // draw rotated rectangle
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin * this.age * 0.06);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/1.6, -this.size/1.6, this.size*1.6, this.size);
      } else if (this.type === 'heart') {
        // tiny heart path
        ctx.translate(this.x, this.y);
        ctx.scale(0.6, 0.6);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-3,-6,-12,-6,-12,0);
        ctx.bezierCurveTo(-12,8,-2,14,0,20);
        ctx.bezierCurveTo(2,14,12,8,12,0);
        ctx.bezierCurveTo(12,-6,3,-6,0,0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function spawnFirework(x=null, y=null) {
    const cx = x === null ? Math.random() * (w*0.6) + w*0.2 : x;
    const cy = y === null ? Math.random() * (h*0.45) + h*0.1 : y;
    const colors = ['#f5c16c','#ff5ea8','#ffffff','#ffb3d6','#ffd98a'];
    const color = colors[Math.floor(Math.random()*colors.length)];
    const count = smallScreen ? 20 : 40;
    for (let i = 0; i < count; i++) {
      effects.push(new Spark(cx, cy, color, 90 + Math.random()*60));
    }
  }

  function spawnConfetti(x, y) {
    const palette = ['#f5c16c','#ff5ea8','#ffffff','#ffd98a','#ffd1ff'];
    const count = smallScreen ? 30 : 80;
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random()*palette.length)];
      const s = new Spark(x + (Math.random()-0.5)*20, y + (Math.random()-0.5)*20, color, 120 + Math.random()*60, 'confetti');
      s.vx *= (Math.random()*2.4)+0.6;
      s.vy *= (Math.random()*2.4)-2;
      effects.push(s);
    }
  }

  function spawnHearts(x, y) {
    const palette = ['#ff5ea8','#ffd1ff','#ff9abf','#ff6fba'];
    const count = smallScreen ? 8 : 20;
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random()*palette.length)];
      const s = new Spark(x + (Math.random()-0.5)*10, y + (Math.random()-0.5)*10, color, 120 + Math.random()*40, 'heart');
      s.vx *= (Math.random()*1.3)+0.3;
      s.vy *= (Math.random()*1.3)-1.5;
      effects.push(s);
    }
  }

  // Cursor light trail
  const cursorTrail = [];
  window.addEventListener('pointermove', (e) => {
    cursorTrail.push({x: e.clientX, y: e.clientY, life: 40});
    if (cursorTrail.length > 20) cursorTrail.shift();
  }, {passive:true});

  // Animation loop
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(60, now - last) / 16.666; // normalized
    last = now;

    // clear
    ctx.clearRect(0,0,w,h);
    drawBackground();

    // particles
    for (let p of particles) {
      p.step(dt);
      p.draw(ctx);
    }

    // soft periodic fireworks (background, subtle)
    if (!reduceMotion && Math.random() < 0.006) {
      spawnFirework();
    }

    // effects
    for (let i = effects.length - 1; i >= 0; i--) {
      const s = effects[i];
      s.step(dt);
      s.draw(ctx);
      if (s.age > s.life) effects.splice(i,1);
    }

    // cursor trail
    for (let i = cursorTrail.length - 1; i >= 0; i--) {
      const t = cursorTrail[i];
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${(t.life/40)*0.12})`;
      ctx.arc(t.x, t.y, (t.life/40) * 10, 0, Math.PI*2);
      ctx.fill();
      t.life -= dt * 1.3;
      if (t.life <= 0) cursorTrail.splice(i,1);
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Entrance animations are handled by CSS on load (fade-in + slide-up)

  // Year animation (previous -> next)
  const prevEl = document.getElementById('prev-year');
  const nextEl = document.getElementById('next-year');
  function setYears() {
    const cur = (new Date()).getFullYear();
    prevEl.textContent = cur;
    nextEl.textContent = cur + 1;
    // subtle animated transition: count digits fade
    prevEl.style.opacity = '1';
    nextEl.style.opacity = '1';
  }
  setYears();

  // Surprise button: confetti + fireworks + hearts, and a gentle camera-like pulse by creating more fireworks around center
  const surpriseBtn = document.getElementById('surprise-btn');
  surpriseBtn.addEventListener('click', (e) => {
    // spawn several bursts
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width/2;
    const cy = rect.height/2.6;
    for (let i = 0; i < (smallScreen ? 2 : 4); i++) {
      spawnFirework(cx + (Math.random()-0.5) * 260, cy + (Math.random()-0.5) * 140);
    }
    // confetti near center and hearts rising from button
    spawnConfetti(e.clientX, e.clientY);
    spawnHearts(e.clientX, e.clientY);
    // brief "pop" visual: draw a couple of large fading circles
    for (let i=0;i<3;i++){
      const s = new Spark(e.clientX, e.clientY, '#fff', 40 + i*6);
      s.size = 4 + i*2;
      effects.push(s);
    }

    // trigger ambient chords if audio resumed function provided
    if (typeof window._audioPlayOnAction === 'function') window._audioPlayOnAction();
  });

  // subtle initial soft fireworks on load (but only if not reduced motion)
  if (!reduceMotion) {
    setTimeout(()=>{ spawnFirework(w*0.25, h*0.18); }, 900);
    setTimeout(()=>{ spawnFirework(w*0.75, h*0.14); }, 1700);
  }

  // WebAudio: light ambient music synthesized by code (no external resources)
  // Created as gentle pad + occasional chime. Starts only after an explicit user gesture (button or toggle).
  let audioCtx = null;
  let masterGain = null;
  let running = false;

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(audioCtx.destination);

    // gentle pad
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const padGain = audioCtx.createGain();
    padGain.gain.value = 0.06;
    osc1.type = 'sine'; osc2.type = 'sine';
    osc1.frequency.value = 220; // A3
    osc2.frequency.value = 440; // A4 (octave doubling for richness)
    const padFilter = audioCtx.createBiquadFilter();
    padFilter.type = 'lowpass'; padFilter.frequency.value = 900;
    osc1.connect(padGain); osc2.connect(padGain);
    padGain.connect(padFilter); padFilter.connect(masterGain);
    osc1.start(); osc2.start();

    // occasional chime function
    function chime() {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880 + Math.random()*220;
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
      const flt = audioCtx.createBiquadFilter();
      flt.type = 'highshelf'; flt.frequency.value = 1200; flt.gain.value = 8;
      osc.connect(gain);
      gain.connect(flt);
      flt.connect(masterGain);
      osc.start();
      osc.stop(now + 2.8);
    }

    // gentle LFO for master gain movement
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start();

    // schedule occasional chimes
    let chimeInterval = setInterval(() => {
      if (!running) return;
      if (Math.random() > 0.6) chime();
    }, 2500);

    // expose to shutdown if needed
    window._audioCleanup = () => {
      clearInterval(chimeInterval);
      try { osc1.stop(); osc2.stop(); lfo.stop(); } catch(e){}
      audioCtx.close();
      audioCtx = null;
      running = false;
    };
  }

  // play or start audio (called on user gesture)
  function resumeAudio() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // fade-in
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 1.2);
    running = true;
  }
  function muteAudio() {
    if (!audioCtx || !masterGain) return;
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
    running = false;
  }

  // Expose helper for surprise button to ensure audio plays on user gesture
  window._audioPlayOnAction = () => {
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    resumeAudio();
  };

  // Mute toggle control
  const audioToggle = document.getElementById('audio-toggle');
  let muted = true;
  audioToggle.addEventListener('click', () => {
    // First interaction: start audio context and fade in if currently muted
    if (!audioCtx) {
      initAudio();
      resumeAudio();
      muted = false;
      audioToggle.textContent = '🔊 Unmute';
      audioToggle.setAttribute('aria-pressed', 'false');
      audioToggle.classList.remove('ghost');
      return;
    }

    if (muted) {
      // unmute
      resumeAudio();
      audioToggle.textContent = '🔊 Unmute';
      audioToggle.setAttribute('aria-pressed', 'false');
      muted = false;
      audioToggle.classList.remove('ghost');
    } else {
      // mute
      muteAudio();
      audioToggle.textContent = '🔈 Mute';
      audioToggle.setAttribute('aria-pressed', 'true');
      muted = true;
      audioToggle.classList.add('ghost');
    }
  });

  // Accessibility: allow Enter/Space to trigger button
  surpriseBtn.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      surpriseBtn.click();
    }
  });

  // On load, small UI polish: ensure certain elements reveal (CSS handles most)
  window.addEventListener('load', () => {
    // fade-in handled with CSS; ensure canvas size correct
    resize();
  });

  // Clean up when page hidden to save battery on mobile
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // quiet audio
      if (running) muteAudio();
    } else {
      // resume gentle audio only on user gesture / if previously running
    }
  });

  // Offer a small keyboard shortcut: "S" triggers surprise
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 's') {
      surpriseBtn.click();
    }
  });

})();
