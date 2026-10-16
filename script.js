(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const EMAIL = "dasanshuneel001@gmail.com";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Backdrop: light beams travelling along the grid ---------- */
  const CELL = 64;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const root = document.documentElement;
  const gridLit = $(".grid-lit");
  const beamsCanvas = document.getElementById("beams");
  let gridOffset = 0;

  if (beamsCanvas) {
    const ctx = beamsCanvas.getContext("2d");
    const rand = (a, b) => a + Math.random() * (b - a);
    let w = 0, h = 0, beams = [], nextBeam = 600, last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = beamsCanvas.clientWidth;
      h = beamsCanvas.clientHeight;
      beamsCanvas.width = w * dpr;
      beamsCanvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Beams favour the top of the viewport, where the grid is most visible
    const spawn = () => {
      const vertical = Math.random() < 0.55;
      const warm = Math.random() < 0.8;
      if (vertical) {
        const col = Math.floor(rand(1, w / CELL));
        beams.push({ vertical, line: col * CELL, pos: -120, dir: 1, speed: rand(0.18, 0.4), len: rand(90, 180), end: h * rand(0.45, 0.8), warm });
      } else {
        const row = Math.floor(rand(1, (h * 0.55) / CELL));
        const dir = Math.random() < 0.5 ? 1 : -1;
        beams.push({ vertical, line: row * CELL, pos: dir > 0 ? -120 : w + 120, dir, speed: rand(0.22, 0.45), len: rand(110, 220), end: dir > 0 ? w + 120 : -120, warm });
      }
    };

    const draw = (now) => {
      const dt = Math.min(50, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);
      nextBeam -= dt;
      if (nextBeam <= 0 && beams.length < 6) {
        spawn();
        nextBeam = rand(700, 1800);
      }
      beams = beams.filter((b) => (b.dir > 0 ? b.pos - b.len < b.end : b.pos + b.len > b.end));
      for (const b of beams) {
        b.pos += b.speed * dt * b.dir;
        const head = b.pos, tail = b.pos - b.len * b.dir;
        // fade out as a vertical beam approaches where the grid mask fades
        const fade = b.vertical ? Math.max(0, Math.min(1, (b.end - head) / 160)) : 1;
        const rgb = b.warm ? "255,202,131" : "165,148,255";
        const [x1, y1, x2, y2] = b.vertical
          ? [b.line + 0.5, head, b.line + 0.5, tail]
          : [head, b.line + gridOffset + 0.5, tail, b.line + gridOffset + 0.5];
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `rgba(${rgb},${0.85 * fade})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.fillStyle = `rgba(${rgb},${0.9 * fade})`;
        ctx.shadowColor = `rgba(${rgb},0.9)`;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x1, y1, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  /* ---------- Scroll: progress bar, compact header, drifting grid ---------- */
  const progressBar = document.getElementById("progress-bar");
  const onScroll = () => {
    const max = root.scrollHeight - innerHeight;
    const y = window.scrollY;
    progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    root.classList.toggle("scrolled", y > 12);
    gridOffset = -((y * 0.25) % CELL);
    root.style.setProperty("--gy", `${gridOffset}px`);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Cursor: lights up the grid, cards and the terminal ---------- */
  if (finePointer) {
    window.addEventListener("pointermove", (e) => {
      gridLit.style.setProperty("--cx", `${e.clientX}px`);
      gridLit.style.setProperty("--cy", `${e.clientY}px`);
    }, { passive: true });

    $$(".project, .card, .contact-card, .stat").forEach((el) => {
      el.classList.add("spot", "edge");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });

    const tilt = $(".tilt");
    if (tilt && !reduceMotion) {
      tilt.addEventListener("pointermove", (e) => {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty("--ry", `${px * 7}deg`);
        tilt.style.setProperty("--rx", `${-py * 7}deg`);
      });
      tilt.addEventListener("pointerleave", () => {
        tilt.style.setProperty("--ry", "0deg");
        tilt.style.setProperty("--rx", "0deg");
      });
    }
  }

  /* ---------- Local time in Bengaluru ---------- */
  const clock = document.getElementById("local-time");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    const tick = () => { clock.textContent = `${fmt.format(new Date()).toUpperCase()} IST`; };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Cost chart grows in when it scrolls into view ---------- */
  const chartIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); chartIO.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  $$(".cost-chart").forEach((c) => chartIO.observe(c));

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
