// =========================================================
// JUNIOR'S EDGE — site interactions
// Performance rules followed here: one rAF-throttled scroll loop,
// passive listeners, only transform/opacity are animated, and
// nothing runs while it is off-screen or the tab is hidden.
// =========================================================
document.addEventListener("DOMContentLoaded", () => {

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;
  motionQuery.addEventListener?.("change", (e) => {
    reduceMotion = e.matches;
    if (reduceMotion) parallaxEls.forEach(p => (p.el.style.transform = ""));
    startSparks();
  });

  /* ---------- Images: fade in when loaded (blur-up placeholder sits behind) ---------- */
  document.querySelectorAll(".media img").forEach(img => {
    const done = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    }
  });

  /* ---------- Split section headings into words for the stagger reveal ---------- */
  document.querySelectorAll(".split").forEach(heading => {
    const label = heading.textContent.replace(/\s+/g, " ").trim();
    const frag = document.createDocumentFragment();
    let i = 0;
    const addWords = (text, accent) => {
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
        const outer = document.createElement("span");
        outer.className = "w";
        const inner = document.createElement("span");
        inner.className = accent ? "wi accent" : "wi";
        inner.style.setProperty("--i", i++);
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
    };
    heading.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) addWords(node.textContent, false);
      else addWords(node.textContent, node.classList?.contains("accent"));
    });
    // Screen readers get the whole heading as one phrase, not word fragments
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    visual.appendChild(frag);
    const spoken = document.createElement("span");
    spoken.className = "sr-only";
    spoken.textContent = label;
    heading.replaceChildren(spoken, visual);
  });

  /* ---------- Navbar: backdrop after hero, hide on scroll down, show on scroll up ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");
  let lastY = window.scrollY;
  let menuOpen = false;

  function updateNav(y) {
    nav.classList.toggle("scrolled", y > 60);
    const delta = y - lastY;
    const navHasFocus = nav.contains(document.activeElement);
    if (y < 200 || menuOpen || navHasFocus) nav.classList.remove("nav-hidden");
    else if (delta > 6) nav.classList.add("nav-hidden");
    else if (delta < -6) nav.classList.remove("nav-hidden");
    if (Math.abs(delta) > 6 || y < 200) lastY = y;
  }
  // Keyboard users tabbing into the header always get it back
  nav.addEventListener("focusin", () => nav.classList.remove("nav-hidden"));

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    menuOpen = open;
    burger.classList.toggle("open", open);
    navLinks.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) nav.classList.remove("nav-hidden");
  }
  burger.addEventListener("click", () => {
    setMenu(!menuOpen);
    if (menuOpen) navLinks.querySelector("a")?.focus();
  });
  navLinks.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", () => setMenu(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) { setMenu(false); burger.focus(); }
  });

  /* ---------- Parallax: subtle depth on the hero and process backgrounds ---------- */
  const parallaxEls = [...document.querySelectorAll("[data-parallax]")].map(el => ({
    el,
    section: el.parentElement,
    speed: parseFloat(el.dataset.parallax) || 0,
    visible: false,
  }));
  const parallaxObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const p = parallaxEls.find(x => x.section === entry.target);
      if (p) p.visible = entry.isIntersecting;
    });
    requestTick();
  }, { rootMargin: "100px 0px" });
  parallaxEls.forEach(p => parallaxObserver.observe(p.section));

  function updateParallax() {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    parallaxEls.forEach(p => {
      if (!p.visible) return;
      const r = p.section.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - vh / 2) * p.speed;
      p.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  }

  /* ---------- One scroll loop for everything scroll-driven ---------- */
  let ticking = false;
  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateNav(window.scrollY);
      updateParallax();
    });
  }
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });
  requestTick();

  /* ---------- Scroll reveal ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${(i % 4) * 0.1}s`;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

  /* ---------- Animated stat counters ---------- */
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const suffix = target >= 1000 ? "+" : "";
      countObserver.unobserve(el);
      if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
      const duration = 1800;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-count]").forEach(el => {
    if (!reduceMotion) el.textContent = "0"; // HTML holds the real number for no-JS visitors
    countObserver.observe(el);
  });

  /* ---------- Grinding-wheel sparks in hero ---------- */
  const canvas = document.getElementById("sparks");
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  let sparks = [];
  let sparksRunning = false;
  let heroVisible = true;
  let dpr = 1;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.offsetWidth * dpr);
    canvas.height = Math.round(canvas.offsetHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  new ResizeObserver(resizeCanvas).observe(canvas);

  function spawnSpark(x, y) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const speed = 3 + Math.random() * 7;
    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.02,
    });
  }

  // Sparks fly from the whetstone area (right side) + follow mouse
  let mouse = null;
  hero.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  }, { passive: true });
  hero.addEventListener("mouseleave", () => (mouse = null));

  function animateSparks() {
    if (!sparksRunning) return;
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    if (Math.random() < 0.5) spawnSpark(w * 0.68, h * 0.72);
    if (mouse && Math.random() < 0.8) spawnSpark(mouse.x, mouse.y);
    sparks = sparks.filter(s => s.life > 0);
    ctx.lineWidth = 1.6;
    for (const s of sparks) {
      const px = s.x, py = s.y;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.18;      // gravity
      s.vx *= 0.99;
      s.life -= s.decay;
      ctx.strokeStyle = `rgba(255, ${150 + Math.random() * 80}, 60, ${Math.max(s.life, 0)})`;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    requestAnimationFrame(animateSparks);
  }
  function startSparks() {
    const shouldRun = heroVisible && !document.hidden && !reduceMotion;
    if (shouldRun && !sparksRunning) {
      sparksRunning = true;
      requestAnimationFrame(animateSparks);
    } else if (!shouldRun) {
      sparksRunning = false;
      sparks = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    startSparks();
  }).observe(hero);
  document.addEventListener("visibilitychange", startSparks);

  /* ---------- Gallery filter ---------- */
  const filterBtns = document.querySelectorAll(".filter");
  const items = [...document.querySelectorAll(".g-item")];
  const galleryStatus = document.getElementById("galleryStatus");
  filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filterBtns.forEach(b => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    const f = btn.dataset.filter;
    let shown = 0;
    items.forEach(item => {
      const show = f === "all" || item.dataset.cat.split(" ").includes(f);
      item.classList.toggle("hide", !show);
      item.classList.remove("is-entering");
      if (show) {
        void item.offsetWidth; // restart the entrance animation
        item.style.setProperty("--i", shown);
        item.classList.add("is-entering");
        shown++;
      }
    });
    galleryStatus.textContent = `Showing ${shown} ${shown === 1 ? "blade" : "blades"}`;
  }));

  /* ---------- Lightbox (accessible dialog) ---------- */
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  const lbClose = document.getElementById("lbClose");
  const pageRegions = [document.querySelector(".skip-link"), nav, document.getElementById("main"), document.querySelector(".footer")];
  let current = 0;
  let returnFocus = null;

  const visibleItems = () => items.filter(i => !i.classList.contains("hide"));

  function fullSizeSrc(img) {
    // Use the same format the browser already chose for the thumbnail
    const chosen = img.currentSrc || img.src;
    const ext = (chosen.match(/\.(avif|webp)(\?|$)/) || [])[1];
    return ext ? `${img.dataset.full}.${ext}` : img.src;
  }

  function showItem(index) {
    const list = visibleItems();
    current = (index + list.length) % list.length;
    const img = list[current].querySelector("img");
    lbImg.src = fullSizeSrc(img);
    lbImg.alt = img.alt;
    lbCap.textContent = list[current].querySelector("figcaption").textContent;
  }
  function openLB(index, trigger) {
    returnFocus = trigger || document.activeElement;
    showItem(index);
    lb.inert = false;
    lb.classList.add("open");
    pageRegions.forEach(el => el && (el.inert = true));
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }
  function closeLB() {
    lb.classList.remove("open");
    lb.inert = true;
    pageRegions.forEach(el => el && (el.inert = false));
    document.body.style.overflow = "";
    returnFocus?.focus();
  }
  items.forEach(item => {
    const btn = item.querySelector(".g-open");
    btn.addEventListener("click", () => openLB(visibleItems().indexOf(item), btn));
  });
  lbClose.addEventListener("click", closeLB);
  document.getElementById("lbPrev").addEventListener("click", () => showItem(current - 1));
  document.getElementById("lbNext").addEventListener("click", () => showItem(current + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowLeft") showItem(current - 1);
    if (e.key === "ArrowRight") showItem(current + 1);
  });

  /* ---------- Price estimate + pricing "Book" buttons ---------- */
  const prices = { "Kitchen Knife": 8, "Whetstone Premium": 20, "Swords & Axes": 35 };
  const service = document.getElementById("service");
  const qty = document.getElementById("qty");
  const estimate = document.getElementById("estimate");
  let lastEstimate = "";

  function updateEstimate() {
    const price = prices[service.value];
    const n = Math.max(1, parseInt(qty.value, 10) || 1);
    const text = price
      ? `$${price * n}${service.value === "Swords & Axes" ? "+" : ""}`
      : "Quote on inspection";
    if (text === lastEstimate) return;
    const firstRun = lastEstimate === "";
    lastEstimate = text;
    estimate.innerHTML = `Estimated: <strong>${text}</strong>`;
    if (!firstRun) estimate.querySelector("strong").classList.add("bump");
  }
  service.addEventListener("change", updateEstimate);
  qty.addEventListener("input", updateEstimate);
  updateEstimate();

  document.querySelectorAll("[data-service]").forEach(btn =>
    btn.addEventListener("click", () => {
      service.value = btn.dataset.service;
      updateEstimate();
    })
  );

  /* ---------- Contact form ---------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let firstBad = null;
    ["name", "email"].forEach(id => {
      const input = document.getElementById(id);
      const empty = !input.value.trim();
      const field = input.parentElement;
      field.classList.remove("error");
      if (empty) {
        void field.offsetWidth; // replay the shake on repeat submits
        field.classList.add("error");
        firstBad = firstBad || input;
      }
      input.setAttribute("aria-invalid", String(empty));
    });
    if (firstBad) {
      status.textContent = "Fill in your name and contact info so Junior can reach you.";
      status.className = "form-status full bad";
      firstBad.focus();
      return;
    }
    // NOTE: this form has no backend yet. Hook it up to a service like
    // Formspree, Netlify Forms or EmailJS to actually receive messages.
    status.textContent = `Thanks, ${document.getElementById("name").value.trim()}! Junior will be in touch soon. 🔥`;
    status.className = "form-status full ok";
    form.reset();
    lastEstimate = "";
    updateEstimate();
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
