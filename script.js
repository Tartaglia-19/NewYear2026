// script.js
// Vanilla JS: background canvas (particles, fireworks), surprise effects, year animation, and composed WebAudio background music (no external files).
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
  const FLOATERS = smallScreen ? 18 : 36;

  resize();

  // Background gradient animation (soft)
  let gradOffset = 0;
  function drawBackground() {
    gradOffset = (gradOffset + 0.002) % 1;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1026');
    g.addColorStop(Math.abs(Math.sin(gradOffset)) * 0.8, '#24103b');
    g.addColorStop(1, '#2b1055');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const vignette = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)/4, w/2, h/2, Math.max(w,h));
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  // Stars / floating particles
  const particles = [];
  class Particle {
    constructor() { this.reset(); }
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
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin * this.age * 0.06);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/1.6, -this.size/1.6, this.size*1.6, this.size);
      } else if (this.type === 'heart') {
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

    ctx.clearRect(0,0,w,h);
    drawBackground();

    for (let p of particles) {
      p.step(dt);
      p.draw(ctx);
    }

    if (!reduceMotion && Math.random() < 0.006) spawnFirework();

    for (let i = effects.length - 1; i >= 0; i--) {
      const s = effects[i];
      s.step(dt);
      s.draw(ctx);
      if (s.age > s.life) effects.splice(i,1);
    }

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

  // Year animation (previous -> next)
  const prevEl = document.getElementById('prev-year');
  const nextEl = document.getElementById('next-year');
  function setYears() {
    const cur = (new Date()).getFullYear();
    prevEl.textContent = cur;
    nextEl.textContent = cur + 1;
    prevEl.style.opacity = '1';
    nextEl.style.opacity = '1';
  }
  setYears();

  // Surprise button logic
  const surpriseBtn = document.getElementById('surprise-btn');
  surpriseBtn.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width/2;
    const cy = rect.height/2.6;
    for (let i = 0; i < (smallScreen ? 2 : 4); i++) spawnFirework(cx + (Math.random()-0.5) * 260, cy + (Math.random()-0.5) * 140);
    spawnConfetti(e.clientX, e.clientY);
    spawnHearts(e.clientX, e.clientY);
    for (let i=0;i<3;i++){ const s = new Spark(e.clientX, e.clientY, '#fff', 40 + i*6); s.size = 4 + i*2; effects.push(s); }

    if (typeof window._audioPlayOnAction === 'function') window._audioPlayOnAction();
  });

  if (!reduceMotion) {
    setTimeout(()=>{ spawnFirework(w*0.25, h*0.18); }, 900);
    setTimeout(()=>{ spawnFirework(w*0.75, h*0.14); }, 1700);
  }

  // --- Composed WebAudio background music (no external files) ---
  let audioCtx = null;
  let masterGain = null;
  let musicRunning = false;
  let musicInterval = null;
  let padNodes = [];
  let melodyNodes = [];

  function initMusic() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.0001; // start near-silent
    masterGain.connect(audioCtx.destination);

    // Create a warm pad by layering detuned saws filtered by lowpass
    const padF = audioCtx.createBiquadFilter();
    padF.type = 'lowpass'; padF.frequency.value = 800;

    const detuneCents = [0, -10, 10];
    padNodes = detuneCents.map((dt) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 110; // A2 base
      osc.detune.value = dt;
      const g = audioCtx.createGain(); g.gain.value = 0.02; // quiet
      osc.connect(g); g.connect(padF);
      osc.start();
      return {osc,g};
    });

    padF.connect(masterGain);

    // gentle slow filter movement
    const padLfo = audioCtx.createOscillator();
    const padLfoGain = audioCtx.createGain();
    padLfo.frequency.value = 0.03;
    padLfoGain.gain.value = 200;
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padF.frequency);
    padLfo.start();

    // Melody: simple plucked sine with envelope
    // We'll schedule short notes via setInterval for compatibility
  }

  const melodyPattern = [440, 523.25, 659.25, 523.25, 440, 392, 330, 392]; // A4, C5, E5 ... simple happy line
  let melodyIndex = 0;
  function startMelody() {
    if (!audioCtx) return;
    stopMelody();
    melodyIndex = 0;
    // play a note every 700ms
    musicInterval = setInterval(() => {
      const now = audioCtx.currentTime;
      const freq = melodyPattern[melodyIndex % melodyPattern.length];
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      const pan = (Math.random() - 0.5) * 0.6;
      let panner = null;
      try {
        panner = audioCtx.createStereoPanner();
        panner.pan.value = pan;
        osc.connect(gain); gain.connect(panner); panner.connect(masterGain);
      } catch (e) {
        osc.connect(gain); gain.connect(masterGain);
      }
      osc.start(now);
      osc.stop(now + 0.9);
      melodyNodes.push(osc);
      melodyIndex++;
      // keep melodyNodes small
      if (melodyNodes.length > 30) melodyNodes.shift();
    }, 700);
  }
  function stopMelody() { if (musicInterval) { clearInterval(musicInterval); musicInterval = null; } }

  function startMusic() {
    if (!audioCtx) initMusic();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // fade in master
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 1.0);
    startMelody();
    musicRunning = true;
  }
  function stopMusic() {
    if (!audioCtx || !masterGain) return;
    // fade out
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
    stopMelody();
    musicRunning = false;
  }

  // Expose helper for user gesture
  window._audioPlayOnAction = () => { startMusic(); };

  // Mute toggle control
  const audioToggle = document.getElementById('audio-toggle');
  let muted = true;
  audioToggle.addEventListener('click', () => {
    if (muted) {
      startMusic();
      audioToggle.textContent = '🔊 Unmute';
      audioToggle.setAttribute('aria-pressed', 'false');
      audioToggle.classList.remove('ghost');
      muted = false;
    } else {
      stopMusic();
      audioToggle.textContent = '🔈 Mute';
      audioToggle.setAttribute('aria-pressed', 'true');
      audioToggle.classList.add('ghost');
      muted = true;
    }
  });

  // Surprise button keyboard accessibility
  surpriseBtn.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      surpriseBtn.click();
    }
  });

  // Clean up on hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (musicRunning) stopMusic();
    }
  });

  window.addEventListener('load', () => { resize(); });

  // keyboard shortcut S triggers surprise
  window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 's') surpriseBtn.click(); });

})();

// --- GitHub Actions run card ---
(function(){
  const owner = 'Tartaglia-19';
  const repo = 'NewYear2026';
  const runId = 20624031976;
  const el = document.getElementById('gh-run-card');
  if (!el) return;

  function escapeHtml(str){
    if(!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function fetchRun(){
    el.textContent = 'Loading build info…';
    try{
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`);
      if(!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const status = data.status;
      const conclusion = data.conclusion || '';
      const actor = (data.triggering_actor && data.triggering_actor.login) || (data.actor && data.actor.login) || '';
      const commitMsg = data.head_commit ? data.head_commit.message : (data.head_branch || '');
      const created = data.created_at ? new Date(data.created_at).toLocaleString() : '';
      const statusText = status === 'in_progress' ? 'Running' : (status === 'completed' ? (conclusion || 'Completed') : status);
      const statusClass = conclusion === 'success' ? 'success' : (conclusion === 'failure' ? 'failure' : '');

      el.innerHTML = `
        <div class="run-line"><span class="status ${statusClass}">${statusText}</span> ${actor ? 'by '+escapeHtml(actor)+' • ' : ''}${escapeHtml(created)}</div>
        <div class="run-msg">${escapeHtml(commitMsg)}</div>
        <div style="margin-top:.5rem;"><a href="${data.html_url}" target="_blank" rel="noopener">View run & logs</a> <button id="gh-run-refresh" class="btn ghost" style="margin-left:.6rem">Refresh</button></div>
      `;

      const refresh = document.getElementById('gh-run-refresh');
      if(refresh) refresh.addEventListener('click', fetchRun);
    }catch(err){
      console.error('Failed to fetch run info', err);
      el.textContent = 'Build info unavailable';
    }
  }

  fetchRun();
})();
