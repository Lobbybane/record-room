// Weather through the window, drawn on two canvases each frame:
// - outside: rain at three depths (with splashes), soft snow, and lightning bolts in a storm
// - on the glass: beads of water and drops that run down, gathering beads and leaving trails
// The glass is 512 x 322 stage pixels; the canvases match the screen size for sharp lines.

const W = 512;
const H = 322;
const LIGHTNING_MS = 12000; // the .lightning CSS animation's length (thunder follows it too)

const rand = (a, b) => a + Math.random() * (b - a);

export function initWeather(stage) {
  const sky = document.getElementById('weather-sky');
  const glass = document.getElementById('weather-glass');
  const flash = stage.querySelector('.lightning');
  if (!sky || !glass) return;
  const skyCtx = sky.getContext('2d');
  const glassCtx = glass.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let scale = 1;
  let frame = 0;
  let last = performance.now();
  let rain = [];
  let snow = [];
  let splashes = [];
  let beads = [];
  let runners = [];
  let bolt = null;
  let lastPhase = 0;
  let nextRunner = 0;
  let mode = '';

  // Keep the canvases' pixel size matched to how big the window is on screen.
  function fit() {
    const rect = sky.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const next = Math.max(0.5, (rect.width / W) * dpr);
    if (Math.abs(next - scale) < 0.02 && sky.width) return;
    scale = next;
    for (const canvas of [sky, glass]) {
      canvas.width = Math.round(W * scale);
      canvas.height = Math.round(H * scale);
    }
  }

  function currentMode() {
    const weather = stage.dataset.weather;
    const winterHoliday = (stage.dataset.holiday || '').split(' ').includes('winter');
    if (weather === 'storm' || weather === 'rain' || weather === 'snow') return weather;
    return winterHoliday ? 'light-snow' : 'clear';
  }

  // ---------- particles ----------
  const LAYERS = [
    { depth: 0.35, length: 8, speed: 360, width: 0.7, alpha: 0.3 },
    { depth: 0.65, length: 14, speed: 600, width: 1, alpha: 0.42 },
    { depth: 1, length: 22, speed: 880, width: 1.4, alpha: 0.56 },
  ];
  function makeDrop(storm, anywhere) {
    const layer = LAYERS[Math.random() < 0.45 ? 0 : Math.random() < 0.65 ? 1 : 2];
    return { layer, x: rand(-60, W + 20), y: anywhere ? rand(-20, H) : rand(-60, -10), speed: layer.speed * (storm ? 1.35 : 1) * rand(0.85, 1.15) };
  }
  function makeFlake(anywhere, light) {
    const depth = rand(0.3, 1);
    return {
      x: rand(-10, W + 10), y: anywhere ? rand(-10, H) : rand(-30, -5),
      r: (light ? 0.6 : 0.8) + depth * 2, speed: 18 + depth * 38, depth,
      sway: rand(8, 22), phase: rand(0, Math.PI * 2), freq: rand(0.4, 1.1),
    };
  }

  function reset(next) {
    mode = next;
    const storm = mode === 'storm';
    rain = mode === 'rain' || storm ? Array.from({ length: storm ? 280 : 150 }, () => makeDrop(storm, true)) : [];
    snow = mode === 'snow' || mode === 'light-snow'
      ? Array.from({ length: mode === 'snow' ? 150 : 55 }, () => makeFlake(true, mode === 'light-snow')) : [];
    const wet = mode === 'rain' || storm;
    beads = wet ? Array.from({ length: storm ? 110 : 70 }, makeBead) : [];
    runners = [];
    splashes = [];
    bolt = null;
  }

  // ---------- glass ----------
  function makeBead() {
    return { x: rand(4, W - 4), y: rand(4, H - 30), r: Math.random() < 0.75 ? rand(0.8, 1.8) : rand(1.9, 2.8) };
  }
  function makeRunner() {
    return { x: rand(10, W - 10), y: rand(0, H * 0.45), r: rand(2.4, 3.6), speed: 0, pause: rand(0.2, 1), trail: [], wobble: rand(0, 10) };
  }
  function drawBead(ctx, x, y, r) {
    // A tiny lens: a soft body, a darker lower rim and a bright highlight.
    ctx.fillStyle = 'rgba(225, 235, 255, 0.24)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(16, 14, 40, 0.38)';
    ctx.lineWidth = Math.max(0.5, r * 0.35);
    ctx.beginPath(); ctx.arc(x, y, r * 0.9, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, Math.max(0.35, r * 0.28), 0, Math.PI * 2); ctx.fill();
  }

  // ---------- lightning ----------
  function makeBolt() {
    const points = [];
    let x = rand(60, W - 60);
    let y = 0;
    points.push([x, y]);
    const branches = [];
    while (y < rand(150, 220)) {
      x += rand(-14, 14);
      y += rand(8, 18);
      points.push([x, y]);
      if (Math.random() < 0.18) {
        const branch = [[x, y]];
        let bx = x; let by = y;
        for (let i = 0; i < 5; i++) { bx += rand(-16, 16); by += rand(6, 14); branch.push([bx, by]); }
        branches.push(branch);
      }
    }
    return { points, branches, life: 1 };
  }
  function strokePath(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }

  // ---------- one frame ----------
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (frame++ % 30 === 0) fit();
    const next = currentMode();
    if (next !== mode) reset(next);

    const storm = mode === 'storm';
    const slant = storm ? 0.42 : 0.2; // sideways movement per unit of fall

    // Outside
    skyCtx.setTransform(scale, 0, 0, scale, 0, 0);
    skyCtx.clearRect(0, 0, W, H);
    skyCtx.lineCap = 'round';
    for (const d of rain) {
      d.y += d.speed * dt;
      d.x += d.speed * slant * dt;
      if (d.y > H + 20) {
        if (d.layer.depth === 1 && Math.random() < 0.5) splashes.push({ x: d.x, y: rand(H - 26, H - 4), t: 0 });
        Object.assign(d, makeDrop(storm, false));
      }
      const len = d.layer.length * (storm ? 1.25 : 1);
      skyCtx.strokeStyle = `rgba(210, 225, 255, ${d.layer.alpha})`;
      skyCtx.lineWidth = d.layer.width;
      skyCtx.beginPath();
      skyCtx.moveTo(d.x, d.y);
      skyCtx.lineTo(d.x - len * slant, d.y - len);
      skyCtx.stroke();
    }
    splashes = splashes.filter((s) => (s.t += dt) < 0.3);
    for (const s of splashes) {
      const p = s.t / 0.3;
      skyCtx.strokeStyle = `rgba(220, 232, 255, ${0.45 * (1 - p)})`;
      skyCtx.lineWidth = 0.8;
      skyCtx.beginPath();
      skyCtx.ellipse(s.x, s.y, 1 + p * 5, 0.5 + p * 1.6, 0, Math.PI, 0);
      skyCtx.stroke();
    }
    for (const f of snow) {
      f.phase += f.freq * dt;
      f.y += f.speed * dt;
      const x = f.x + Math.sin(f.phase) * f.sway * f.depth;
      if (f.y > H + 8) Object.assign(f, makeFlake(false, mode === 'light-snow'));
      const g = skyCtx.createRadialGradient(x, f.y, 0, x, f.y, f.r * 1.6);
      g.addColorStop(0, `rgba(255, 255, 255, ${0.55 + f.depth * 0.4})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      skyCtx.fillStyle = g;
      skyCtx.beginPath(); skyCtx.arc(x, f.y, f.r * 1.6, 0, Math.PI * 2); skyCtx.fill();
    }
    if (storm && flash) {
      // Strike in time with the CSS flash (59% and 63% through its 12 s cycle).
      const anim = flash.getAnimations?.()[0];
      const phase = anim && anim.currentTime != null ? (anim.currentTime % LIGHTNING_MS) / LIGHTNING_MS : 0;
      if (lastPhase < 0.586 && phase >= 0.586) bolt = makeBolt();
      if (bolt && lastPhase < 0.626 && phase >= 0.626) bolt.life = 0.8;
      lastPhase = phase;
    }
    if (bolt) {
      bolt.life -= dt * 3.2;
      if (bolt.life <= 0) {
        bolt = bolt.life < -1 ? null : bolt; // kept a moment so the second flash can relight it
      } else {
        skyCtx.save();
        skyCtx.shadowColor = 'rgba(200, 210, 255, 0.9)';
        skyCtx.shadowBlur = 12;
        skyCtx.strokeStyle = `rgba(245, 247, 255, ${bolt.life})`;
        skyCtx.lineWidth = 2;
        strokePath(skyCtx, bolt.points);
        skyCtx.lineWidth = 1;
        bolt.branches.forEach((b) => strokePath(skyCtx, b));
        skyCtx.restore();
      }
    }

    // On the glass
    glassCtx.setTransform(scale, 0, 0, scale, 0, 0);
    glassCtx.clearRect(0, 0, W, H);
    if (beads.length || runners.length) {
      const maxBeads = storm ? 170 : 120;
      if (beads.length < maxBeads && Math.random() < (storm ? 0.6 : 0.3)) beads.push(makeBead());
      nextRunner -= dt;
      if (nextRunner <= 0 && runners.length < (storm ? 7 : 4)) {
        runners.push(makeRunner());
        nextRunner = storm ? rand(0.4, 1.2) : rand(1.2, 3);
      }
      for (const run of runners) {
        // Stick, then slide: drops hesitate and lurch like real ones.
        if (run.pause > 0) {
          run.pause -= dt;
        } else {
          run.speed = Math.min(140, run.speed + 240 * dt);
          run.y += run.speed * dt;
          run.x += Math.sin((run.y + run.wobble) * 0.08) * 0.25;
          if (Math.random() < 0.02) { run.pause = rand(0.1, 0.6); run.speed = 0; }
          if (run.trail.length === 0 || run.y - run.trail[run.trail.length - 1][1] > 3) run.trail.push([run.x, run.y, 1]);
          // Soak up beads in the way.
          beads = beads.filter((b) => {
            const hit = Math.hypot(b.x - run.x, b.y - run.y) < run.r + b.r;
            if (hit) run.r = Math.min(4.2, run.r + b.r * 0.08);
            return !hit;
          });
        }
        for (const t of run.trail) t[2] -= dt * 0.35;
        run.trail = run.trail.filter((t) => t[2] > 0);
      }
      runners = runners.filter((r) => r.y < H + 10 || r.trail.length);
      // Wet trails, then beads, then the running drops on top.
      glassCtx.lineCap = 'round';
      for (const run of runners) {
        for (let i = 1; i < run.trail.length; i++) {
          const [x0, y0] = run.trail[i - 1];
          const [x1, y1, a] = run.trail[i];
          glassCtx.strokeStyle = `rgba(220, 232, 255, ${0.12 * a})`;
          glassCtx.lineWidth = run.r * 0.9;
          glassCtx.beginPath(); glassCtx.moveTo(x0, y0); glassCtx.lineTo(x1, y1); glassCtx.stroke();
        }
      }
      for (const b of beads) drawBead(glassCtx, b.x, b.y, b.r);
      for (const run of runners) if (run.y < H + 6) drawBead(glassCtx, run.x, run.y, run.r);
    }
  }

  function loop(now) {
    if (!document.hidden) step(now);
    requestAnimationFrame(loop);
  }

  fit();
  if (reduceMotion) {
    // One still frame, redrawn when the weather changes.
    const still = () => { reset(currentMode()); last = performance.now() - 16; step(performance.now()); };
    new MutationObserver(still).observe(stage, { attributes: true, attributeFilter: ['data-weather', 'data-holiday'] });
    window.addEventListener('resize', () => { fit(); still(); });
    still();
  } else {
    requestAnimationFrame(loop);
  }
}
