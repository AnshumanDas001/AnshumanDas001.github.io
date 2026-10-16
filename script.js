(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const EMAIL = "dasanshuneel001@gmail.com";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Sky: parallax stars, milky way, planets, shooting stars ---------- */
  const sky = document.getElementById("sky");
  if (sky) {
    const ctx = sky.getContext("2d");
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    let w = 0, h = 0, dpr = 1, maxScroll = 1;
    let stars = [], planets = [], horizon = null, band = null, glint = null;
    let meteors = [], nextMeteor = 1800, frame = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    // Offscreen canvas in CSS pixels, so sprites render once and are blitted each frame
    const offscreen = (cw, ch) => {
      const c = document.createElement("canvas");
      c.width = Math.ceil(cw * dpr);
      c.height = Math.ceil(ch * dpr);
      const g = c.getContext("2d");
      g.scale(dpr, dpr);
      return [c, g];
    };

    const makeGlint = () => {
      const s = 32, m = s / 2;
      const [c, g] = offscreen(s, s);
      const core = g.createRadialGradient(m, m, 0, m, m, m);
      core.addColorStop(0, "rgba(255,255,255,1)");
      core.addColorStop(0.12, "rgba(255,236,210,0.45)");
      core.addColorStop(1, "rgba(255,236,210,0)");
      g.fillStyle = core;
      g.fillRect(0, 0, s, s);
      const ray = (x1, y1, x2, y2) => {
        const lg = g.createLinearGradient(x1, y1, x2, y2);
        lg.addColorStop(0, "rgba(255,240,220,0)");
        lg.addColorStop(0.5, "rgba(255,240,220,0.7)");
        lg.addColorStop(1, "rgba(255,240,220,0)");
        g.strokeStyle = lg;
        g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      };
      ray(m, 0, m, s);
      ray(0, m, s, m);
      return c;
    };

    const makeBand = () => {
      // A faint diagonal milky way: soft glow plus a dense sprinkle of dust stars
      const bh = h * 1.4;
      const [c, g] = offscreen(w, bh);
      g.translate(w / 2, bh / 2);
      g.rotate(-0.42);
      const span = Math.hypot(w, bh);
      g.save();
      g.scale(1, 0.16);
      const glow = g.createRadialGradient(0, 0, 0, 0, 0, span / 2);
      glow.addColorStop(0, "rgba(190,170,255,0.07)");
      glow.addColorStop(0.45, "rgba(255,202,131,0.035)");
      glow.addColorStop(1, "rgba(255,202,131,0)");
      g.fillStyle = glow;
      g.beginPath(); g.arc(0, 0, span / 2, 0, Math.PI * 2); g.fill();
      g.restore();
      const dust = Math.round((w * bh) / 2200);
      for (let i = 0; i < dust; i++) {
        const gauss = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        g.globalAlpha = rand(0.08, 0.35);
        g.fillStyle = Math.random() < 0.2 ? "#ffd9a8" : "#e8e4ff";
        g.fillRect(rand(-span / 2, span / 2), gauss * span * 0.09, rand(0.4, 1.1), rand(0.4, 1.1));
      }
      return { c, bh };
    };

    const ringedPlanet = (R) => {
      const pad = R * 1.25, size = R * 2 + pad * 2, m = size / 2, tilt = -0.38;
      const [c, g] = offscreen(size, size);
      const ring = (front) => {
        g.save();
        g.translate(m, m);
        g.rotate(tilt);
        g.beginPath();
        if (front) g.rect(-size, 0, size * 2, size); else g.rect(-size, -size, size * 2, size);
        g.clip();
        for (const [rf, wf, a] of [[1.34, 0.08, 0.16], [1.46, 0.05, 0.34], [1.58, 0.11, 0.26], [1.74, 0.03, 0.14], [1.88, 0.07, 0.1]]) {
          g.beginPath();
          g.ellipse(0, 0, R * rf, R * rf * 0.24, 0, 0, Math.PI * 2);
          g.lineWidth = R * wf;
          g.strokeStyle = `rgba(255, 214, 160, ${a})`;
          g.stroke();
        }
        g.restore();
      };
      ring(false);
      const halo = g.createRadialGradient(m, m, R * 0.9, m, m, R * 1.5);
      halo.addColorStop(0, "rgba(255,202,131,0.2)");
      halo.addColorStop(1, "rgba(255,202,131,0)");
      g.fillStyle = halo;
      g.beginPath(); g.arc(m, m, R * 1.5, 0, Math.PI * 2); g.fill();

      g.save();
      g.beginPath(); g.arc(m, m, R, 0, Math.PI * 2); g.clip();
      const body = g.createRadialGradient(m - R * 0.45, m - R * 0.5, R * 0.1, m, m, R * 1.1);
      body.addColorStop(0, "#ffe4bd");
      body.addColorStop(0.35, "#e2a457");
      body.addColorStop(0.75, "#7f4c20");
      body.addColorStop(1, "#24140a");
      g.fillStyle = body;
      g.fillRect(m - R, m - R, R * 2, R * 2);
      g.translate(m, m);
      g.rotate(tilt);
      for (let i = 0; i < 10; i++) {
        g.fillStyle = i % 2 ? "rgba(80,42,16,0.2)" : "rgba(255,232,196,0.1)";
        g.fillRect(-R * 1.3, -R + i * (R / 5) + rand(-R * 0.03, R * 0.03), R * 2.6, rand(R * 0.05, R * 0.14));
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const shade = g.createRadialGradient(m - R * 0.6, m - R * 0.6, R * 0.55, m - R * 0.2, m - R * 0.2, R * 2);
      shade.addColorStop(0, "rgba(10,8,14,0)");
      shade.addColorStop(0.55, "rgba(10,8,14,0.55)");
      shade.addColorStop(1, "rgba(10,8,14,0.96)");
      g.fillStyle = shade;
      g.fillRect(m - R, m - R, R * 2, R * 2);
      g.restore();
      ring(true);
      return { c, size };
    };

    const roundPlanet = (R, [light, mid, dark], haloColor, { craters = 0, bands = 0 } = {}) => {
      const pad = R * 0.7, size = R * 2 + pad * 2, m = size / 2;
      const [c, g] = offscreen(size, size);
      const halo = g.createRadialGradient(m, m, R * 0.95, m, m, R + pad);
      halo.addColorStop(0, haloColor);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = halo;
      g.beginPath(); g.arc(m, m, R + pad, 0, Math.PI * 2); g.fill();
      g.save();
      g.beginPath(); g.arc(m, m, R, 0, Math.PI * 2); g.clip();
      const body = g.createRadialGradient(m - R * 0.4, m - R * 0.45, R * 0.05, m, m, R * 1.05);
      body.addColorStop(0, light);
      body.addColorStop(0.5, mid);
      body.addColorStop(1, dark);
      g.fillStyle = body;
      g.fillRect(m - R, m - R, R * 2, R * 2);
      for (let i = 0; i < bands; i++) {
        g.fillStyle = i % 2 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.035)";
        g.fillRect(m - R, m - R + (i * 2 * R) / bands + rand(-2, 2), R * 2, rand(R * 0.06, R * 0.16));
      }
      for (let i = 0; i < craters; i++) {
        const a = rand(0, Math.PI * 2), d = rand(0, R * 0.85), r = rand(R * 0.05, R * 0.17);
        const x = m + Math.cos(a) * d, y = m + Math.sin(a) * d;
        g.fillStyle = "rgba(0,0,0,0.18)";
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,255,255,0.06)";
        g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.75, 0, Math.PI * 2); g.fill();
      }
      const shade = g.createRadialGradient(m - R * 0.5, m - R * 0.5, R * 0.45, m - R * 0.1, m - R * 0.1, R * 1.9);
      shade.addColorStop(0, "rgba(8,8,12,0)");
      shade.addColorStop(0.6, "rgba(8,8,12,0.6)");
      shade.addColorStop(1, "rgba(8,8,12,0.97)");
      g.fillStyle = shade;
      g.fillRect(m - R, m - R, R * 2, R * 2);
      g.restore();
      return { c, size };
    };

    // A dark world whose sunlit rim rises at the bottom of the page, behind Contact
    const makeHorizon = () => {
      const R = Math.max(w * 0.75, 520);
      const pad = 90, rise = h * 0.3;
      const cw = Math.min(R * 2 + pad * 2, w + pad * 2), ch = pad + Math.max(R * 0.5, rise + 60);
      const m = cw / 2, cy = pad + R;
      const [c, g] = offscreen(cw, ch);
      const atm = g.createRadialGradient(m, cy, R * 0.97, m, cy, R + pad);
      atm.addColorStop(0, "rgba(255,202,131,0.3)");
      atm.addColorStop(0.3, "rgba(255,150,90,0.1)");
      atm.addColorStop(1, "rgba(255,150,90,0)");
      g.fillStyle = atm;
      g.fillRect(0, 0, cw, ch);
      const body = g.createLinearGradient(0, pad, 0, ch);
      body.addColorStop(0, "#1c1512");
      body.addColorStop(0.25, "#0e0c0f");
      body.addColorStop(1, "#0a0a0c");
      g.fillStyle = body;
      g.beginPath(); g.arc(m, cy, R, 0, Math.PI * 2); g.fill();
      g.save();
      g.beginPath(); g.arc(m, cy, R, 0, Math.PI * 2); g.clip();
      const rim = g.createRadialGradient(m, cy, R * 0.95, m, cy, R);
      rim.addColorStop(0, "rgba(255,202,131,0)");
      rim.addColorStop(1, "rgba(255,218,170,0.5)");
      g.fillStyle = rim;
      g.fillRect(0, 0, cw, ch);
      g.restore();
      return { c, cw, ch, pad, rise };
    };

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = sky.clientWidth;
      h = sky.clientHeight;
      sky.width = w * dpr;
      sky.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      maxScroll = Math.max(1, document.documentElement.scrollHeight - h);
      const mobile = w < 860, unit = Math.min(w, h);

      const layers = [
        { depth: 0.015, size: [0.25, 0.7], share: 0.55 },
        { depth: 0.04, size: [0.5, 1.0], share: 0.3 },
        { depth: 0.09, size: [0.8, 1.5], share: 0.15 },
      ];
      const total = Math.round((w * h) / 2600);
      stars = layers.flatMap((L) =>
        Array.from({ length: Math.round(total * L.share) }, () => {
          const tint = Math.random();
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            r: rand(...L.size),
            depth: L.depth,
            base: rand(0.2, 0.7),
            speed: rand(0.0006, 0.0025),
            phase: rand(0, Math.PI * 2),
            color: tint < 0.75 ? "242,239,234" : tint < 0.9 ? "255,214,160" : "185,205,255",
            bright: Math.random() < 0.035,
          };
        })
      );

      glint = makeGlint();
      band = makeBand();
      const ringR = clamp(unit * 0.1, 34, 96);
      planets = [
        // [sprite, x, baseY, depth] — baseY is the centre's viewport y at the top of the page
        { ...roundPlanet(clamp(unit * 0.016, 5, 12), ["#ffb59a", "#b5523a", "#2a0f0a"], "rgba(255,120,90,0.25)"), x: w * 0.93, y: h * 0.86, depth: 0.06 },
        { ...ringedPlanet(ringR), x: mobile ? w * 0.86 : w * 0.6, y: mobile ? h * 0.62 : h * 0.21, depth: 0.16, alpha: 0.88 },
        { ...roundPlanet(clamp(unit * 0.05, 18, 46), ["#e6e2ff", "#7d76b8", "#14122a"], "rgba(160,150,255,0.18)", { craters: 9 }), x: w * 0.045, y: h * 1.3, depth: 0.3 },
        { ...roundPlanet(clamp(unit * 0.09, 30, 84), ["#c9eef0", "#4b8794", "#0d1c22"], "rgba(120,200,220,0.16)", { bands: 7 }), x: w * 0.97, y: h * 1.95, depth: 0.36 },
      ];
      horizon = makeHorizon();
    };

    const spawnMeteor = (delay = 0) => {
      const fromLeft = Math.random() < 0.35;
      const angle = ((fromLeft ? rand(18, 38) : rand(142, 162)) * Math.PI) / 180;
      const speed = rand(0.7, 1.3);
      meteors.push({
        x: fromLeft ? rand(-0.1 * w, 0.5 * w) : rand(0.5 * w, 1.1 * w),
        y: rand(-0.05 * h, 0.45 * h),
        ux: Math.cos(angle), uy: Math.sin(angle), speed,
        len: rand(110, 260), width: rand(1, 1.8),
        life: -delay, ttl: rand(700, 1300),
      });
    };

    let last = performance.now();
    const draw = (now) => {
      const dt = Math.min(50, now - last);
      last = now;
      const scroll = window.scrollY;
      if (++frame % 30 === 0) maxScroll = Math.max(1, document.documentElement.scrollHeight - h);
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      ctx.clearRect(0, 0, w, h);

      // Milky way
      ctx.globalAlpha = 1;
      ctx.drawImage(band.c, mouse.x * -6, -(band.bh - h) / 2 - scroll * 0.02 + mouse.y * -6, w, band.bh);

      // Stars, wrapping vertically so the sky never runs out
      for (const s of stars) {
        const tw = reduceMotion ? 0 : Math.sin(now * s.speed + s.phase) * 0.3;
        const a = clamp(s.base + tw, 0.06, 1);
        const x = s.x - mouse.x * s.depth * 160;
        const y = ((((s.y - scroll * s.depth - mouse.y * s.depth * 160) % h) + h) % h);
        if (s.bright) {
          const size = 10 + 12 * a;
          ctx.globalAlpha = a;
          ctx.drawImage(glint, x - size / 2, y - size / 2, size, size);
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = `rgb(${s.color})`;
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Shooting stars
      if (!reduceMotion) {
        nextMeteor -= dt;
        if (nextMeteor <= 0) {
          spawnMeteor();
          if (Math.random() < 0.2) spawnMeteor(rand(150, 450));
          nextMeteor = rand(2200, 6500);
        }
        meteors = meteors.filter((m) => m.life < m.ttl);
        for (const m of meteors) {
          m.life += dt;
          if (m.life < 0) continue;
          m.x += m.ux * m.speed * dt;
          m.y += m.uy * m.speed * dt;
          const p = m.life / m.ttl;
          const a = Math.sin(Math.PI * p);
          const tail = m.len * (0.4 + 0.6 * Math.min(1, p * 3));
          const tx = m.x - m.ux * tail, ty = m.y - m.uy * tail;
          const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
          grad.addColorStop(0, `rgba(255,244,228,${0.95 * a})`);
          grad.addColorStop(0.25, `rgba(255,202,131,${0.45 * a})`);
          grad.addColorStop(1, "rgba(255,202,131,0)");
          ctx.globalAlpha = 1;
          ctx.strokeStyle = grad;
          ctx.lineWidth = m.width;
          ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.globalAlpha = a;
          ctx.drawImage(glint, m.x - 9, m.y - 9, 18, 18);
        }
      }

      // Planets, far to near
      ctx.globalAlpha = 1;
      for (const p of planets) {
        const cx = p.x - mouse.x * p.depth * 120;
        const cy = p.y - scroll * p.depth - mouse.y * p.depth * 120;
        if (cy + p.size / 2 < 0 || cy - p.size / 2 > h) continue;
        ctx.globalAlpha = p.alpha ?? 0.95;
        ctx.drawImage(p.c, cx - p.size / 2, cy - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      const t = clamp((scroll - (maxScroll - h * 1.1)) / (h * 1.1), 0, 1);
      if (t > 0) {
        const eased = 1 - Math.pow(1 - t, 3);
        const top = h + 30 - eased * horizon.rise;
        ctx.drawImage(horizon.c, (w - horizon.cw) / 2 - mouse.x * 8, top - horizon.pad, horizon.cw, horizon.ch);
      }

      ctx.globalAlpha = 1;
      if (!reduceMotion) requestAnimationFrame(draw);
    };

    build();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); if (reduceMotion) requestAnimationFrame(draw); }, 150);
    });
    if (finePointer && !reduceMotion) {
      window.addEventListener("pointermove", (e) => {
        mouse.tx = (e.clientX / w) * 2 - 1;
        mouse.ty = (e.clientY / h) * 2 - 1;
      }, { passive: true });
    }
    if (reduceMotion) {
      // Static sky: redraw only when scrolling moves the parallax layers
      let queued = false;
      window.addEventListener("scroll", () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame((t) => { queued = false; draw(t); });
      }, { passive: true });
    }
    requestAnimationFrame(draw);
    sky.classList.add("ready");
  }

  /* ---------- Card spotlight that follows the cursor ---------- */
  if (window.matchMedia("(pointer: fine)").matches) {
    $$(".project, .card, .contact-card, .stat, .terminal").forEach((el) => {
      el.classList.add("spot");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const siblings = $$(".reveal:not(.in)", e.target.parentElement);
      const delay = Math.max(0, siblings.indexOf(e.target)) * 70;
      e.target.style.transitionDelay = `${Math.min(delay, 350)}ms`;
      e.target.classList.add("in");
      setTimeout(() => { e.target.style.transitionDelay = ""; e.target.classList.add("settled"); }, 1100);
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => revealIO.observe(el));

  /* ---------- Scroll spy ---------- */
  const navLinks = $$("[data-section]");
  const spyIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.dataset.section === e.target.id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("[data-spy]").forEach((s) => spyIO.observe(s));

  /* ---------- Toolkit ↔ roles & projects: which skills I used where ---------- */
  // A hovered skill lights every role/project that used it; a hovered, focused or
  // opened entry lights the skills it used. Everything else dims.
  const pills = $$(".pill");
  const entries = $$("[data-skills]");
  const skillsOf = (el) => (el.dataset.skills || "").split(" ");
  const state = { skill: null, pinned: null, hover: null, focus: null, picked: null };

  const apply = () => {
    const skill = state.skill ?? state.pinned;
    const entry = skill ? null : state.hover ?? state.focus ?? state.picked;
    const used = entry ? skillsOf(entry) : null;
    // An opened role (no hover/focus) shouldn't fade the rest of the page while scrolling
    const fadeOthers = !!(skill || state.hover || state.focus);
    entries.forEach((el) => {
      const on = skill ? skillsOf(el).includes(skill) : el === entry;
      el.classList.toggle("lit", on);
      el.classList.toggle("dim", fadeOthers && !on);
    });
    pills.forEach((p) => {
      const on = skill ? p.dataset.skill === skill : !!used && used.includes(p.dataset.skill);
      p.classList.toggle("lit", on);
      p.classList.toggle("dim", !!(skill || entry) && !on);
    });
  };
  const isMouse = (e) => e.pointerType === "mouse";

  pills.forEach((pill) => {
    pill.addEventListener("pointerenter", (e) => { if (isMouse(e)) { state.skill = pill.dataset.skill; apply(); } });
    pill.addEventListener("pointerleave", (e) => { if (isMouse(e)) { state.skill = null; apply(); } });
    pill.addEventListener("click", () => {
      state.pinned = state.pinned === pill.dataset.skill ? null : pill.dataset.skill;
      apply();
    });
  });

  entries.forEach((el) => {
    el.addEventListener("pointerenter", (e) => { if (isMouse(e)) { state.hover = el; apply(); } });
    el.addEventListener("pointerleave", (e) => { if (isMouse(e)) { state.hover = null; apply(); } });
    el.addEventListener("focusin", (e) => { if (e.target.matches(":focus-visible")) { state.focus = el; apply(); } });
    el.addEventListener("focusout", () => { state.focus = null; apply(); });
  });

  // Clicking empty space clears a pinned skill
  document.addEventListener("click", (e) => {
    if (state.pinned && !e.target.closest(".pill")) { state.pinned = null; apply(); }
  });

  /* ---------- Experience accordion ---------- */
  $$(".role-head").forEach((btn) => {
    btn.addEventListener("click", () => {
      const role = btn.closest(".role");
      const open = role.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      // An opened role keeps its skills lit (what touch users get instead of hover)
      if (open) state.picked = role;
      else if (state.picked === role) state.picked = null;
      apply();
    });
  });

  /* ---------- Copy email ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  };
  const setLabel = (label, text) => {
    if (label.textContent === text) return;
    label.textContent = text;
    label.classList.remove("swap");
    void label.offsetWidth;
    label.classList.add("swap");
  };
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      showToast("Copied to clipboard!");
      return true;
    } catch {
      window.location.href = `mailto:${EMAIL}`;
      return false;
    }
  };
  $$(".copy-email").forEach((btn) => {
    const label = $(".label", btn);
    const { default: idle, hover } = label.dataset;
    if (hover) {
      btn.addEventListener("mouseenter", () => setLabel(label, hover));
      btn.addEventListener("focus", () => setLabel(label, hover));
      btn.addEventListener("mouseleave", () => setLabel(label, idle));
      btn.addEventListener("blur", () => setLabel(label, idle));
    }
    btn.addEventListener("click", async () => {
      if (await copyEmail()) {
        setLabel(label, "Copied to clipboard!");
        setTimeout(() => setLabel(label, btn.matches(":hover") && hover ? hover : idle), 1600);
      }
    });
  });

  /* ---------- Stat count-up ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      if (reduceMotion) return;
      const el = e.target;
      const end = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 1400);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- Hero terminal: route trace ---------- */
  const trace = document.getElementById("trace");
  const scripts = [
    [
      ["prompt", "route \"What does OSPF area 0 do?\""],
      ["dim", "› embedding prompt …"],
      ["line", "difficulty  <acc>easy</acc>   <dim>k-NN vote · 6.9 ms</dim>"],
      ["line", "route       <acc>cheap tier</acc>"],
      ["line", "gate        logprob conf 0.93 <ok>✓ pass</ok>"],
      ["line", "result      <ok>accepted</ok> <dim>· no escalation</dim>"],
    ],
    [
      ["prompt", "route \"Why is BGP flapping across 3 PoPs?\""],
      ["dim", "› embedding prompt …"],
      ["line", "difficulty  <acc>hard</acc>   <dim>k-NN vote · 7.2 ms</dim>"],
      ["line", "route       <acc>cheap tier</acc> <dim>(expected cost min)</dim>"],
      ["line", "gate        logprob conf 0.41 <bad>✗ low</bad>"],
      ["line", "judge       $0.00004 → <bad>reject</bad>"],
      ["line", "escalate    <acc>frontier tier</acc> <ok>✓ verified</ok>"],
    ],
    [
      ["prompt", "benchmark --queries 116"],
      ["dim", "› calibrating routing map …"],
      ["line", "graded      <ok>76/76 correct</ok>"],
      ["line", "vs frontier <acc>-82% cost</acc>"],
      ["line", "vs mid-tier <acc>-41% cost</acc>"],
      ["line", "floor       accuracy ≥ 0.80 per difficulty <ok>✓</ok>"],
    ],
  ];
  const fmt = (s) => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/&lt;(acc|ok|bad|dim)&gt;(.*?)&lt;\/\1&gt;/g, (_, c, t) => `<span class="t-${c}">${t}</span>`);

  if (trace) {
    if (reduceMotion) {
      trace.innerHTML = scripts[1].map(([k, t]) =>
        k === "prompt" ? `<span class="t-prompt">$</span> ${fmt(t)}` : k === "dim" ? `<span class="t-dim">${fmt(t)}</span>` : fmt(t)
      ).join("\n");
    } else {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const run = async () => {
        for (let i = 0; ; i = (i + 1) % scripts.length) {
          let done = "";
          const render = (current, caret) => {
            trace.innerHTML = done + current + (caret ? '<span class="caret"></span>' : "");
          };
          for (const [kind, text] of scripts[i]) {
            if (kind === "prompt") {
              const head = `<span class="t-prompt">$</span> `;
              for (let c = 1; c <= text.length; c++) {
                render(head + fmt(text.slice(0, c)), true);
                await wait(28 + Math.random() * 40);
              }
              done += head + fmt(text) + "\n";
              await wait(350);
            } else {
              const html = kind === "dim" ? `<span class="t-dim">${fmt(text)}</span>` : fmt(text);
              done += html + "\n";
              render("", true);
              await wait(kind === "dim" ? 650 : 420);
            }
          }
          render(`<span class="t-prompt">$</span> `, true);
          await wait(3200);
        }
      };
      run();
    }
  }

  /* ---------- ⌘K console ---------- */
  const consoleEl = document.getElementById("console");
  const input = document.getElementById("console-input");
  const list = document.getElementById("console-list");
  const go = (id) => () => document.getElementById(id).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  const open = (url) => () => window.open(url, "_blank", "noopener");
  const commands = [
    { label: "Go to Home", hint: "home", run: go("home") },
    { label: "Go to Experience", hint: "i work", run: go("experience") },
    { label: "Go to Projects", hint: "i build", run: go("projects") },
    { label: "Go to About", hint: "i explore", run: go("about") },
    { label: "Go to Contact", hint: "say hi", run: go("contact") },
    { label: "Copy email address", hint: "email", run: copyEmail },
    { label: "Open resume (PDF)", hint: "resume cv", run: open("resume.pdf") },
    { label: "Open ThriftLLM live demo", hint: "project", run: open("https://thriftllm-582468287136.asia-south1.run.app/") },
    { label: "Open GitHub", hint: "github", run: open("https://github.com/AnshumanDas001") },
    { label: "Open LinkedIn", hint: "linkedin", run: open("https://www.linkedin.com/in/anshuman-das-875a9a282") },
  ];
  let filtered = commands;
  let sel = 0;
  let lastFocus = null;

  const renderList = () => {
    if (!filtered.length) {
      list.innerHTML = `<li class="console-empty">command not found</li>`;
      return;
    }
    list.innerHTML = filtered
      .map((c, i) => `<li role="option" id="cmd-${i}" aria-selected="${i === sel}" data-i="${i}"><span>${c.label}</span><span>${c.hint}</span></li>`)
      .join("");
    input.setAttribute("aria-activedescendant", `cmd-${sel}`);
    $(`#cmd-${sel}`, list)?.scrollIntoView({ block: "nearest" });
  };
  const openConsole = () => {
    lastFocus = document.activeElement;
    consoleEl.hidden = false;
    input.value = "";
    filtered = commands;
    sel = 0;
    renderList();
    input.focus();
  };
  const closeConsole = () => {
    consoleEl.hidden = true;
    lastFocus?.focus?.();
  };
  const runSelected = (i = sel) => {
    const cmd = filtered[i];
    if (!cmd) return;
    closeConsole();
    cmd.run();
  };

  document.getElementById("open-console").addEventListener("click", openConsole);
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      consoleEl.hidden ? openConsole() : closeConsole();
    } else if (e.key === "Escape" && !consoleEl.hidden) {
      closeConsole();
    }
  });
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    filtered = commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q));
    sel = 0;
    renderList();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(filtered.length, 1); renderList(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(filtered.length, 1); renderList(); }
    else if (e.key === "Enter") { e.preventDefault(); runSelected(); }
    else if (e.key === "Tab") { e.preventDefault(); }
  });
  list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li) runSelected(Number(li.dataset.i));
  });
  list.addEventListener("mousemove", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li && Number(li.dataset.i) !== sel) { sel = Number(li.dataset.i); renderList(); }
  });
  $("[data-close]", consoleEl).addEventListener("click", closeConsole);
})();
