// =========================================================
// JUNIOR'S EDGE — site interactions
// =========================================================
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Navbar: shrink on scroll ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 60);
  window.addEventListener("scroll", onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });
  navLinks.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", () => {
      burger.classList.remove("open");
      navLinks.classList.remove("open");
    })
  );

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
      const duration = 1800;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + (p === 1 && target >= 1000 ? "+" : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-count]").forEach(el => countObserver.observe(el));

  /* ---------- Grinding-wheel sparks in hero ---------- */
  const canvas = document.getElementById("sparks");
  const ctx = canvas.getContext("2d");
  let sparks = [];
  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener("resize", resize);

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
  canvas.parentElement.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  canvas.parentElement.addEventListener("mouseleave", () => (mouse = null));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateSparks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!reduceMotion) {
      // ambient sparks
      if (Math.random() < 0.5) spawnSpark(canvas.width * 0.68, canvas.height * 0.72);
      if (mouse && Math.random() < 0.8) spawnSpark(mouse.x, mouse.y);
    }
    sparks = sparks.filter(s => s.life > 0);
    for (const s of sparks) {
      const px = s.x, py = s.y;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.18;      // gravity
      s.vx *= 0.99;
      s.life -= s.decay;
      ctx.strokeStyle = `rgba(255, ${150 + Math.random() * 80}, 60, ${s.life})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    requestAnimationFrame(animateSparks);
  }
  animateSparks();

  /* ---------- Gallery filter ---------- */
  const filterBtns = document.querySelectorAll(".filter");
  const items = [...document.querySelectorAll(".g-item")];
  filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    items.forEach(item => {
      const show = f === "all" || item.dataset.cat.split(" ").includes(f);
      item.classList.toggle("hide", !show);
    });
  }));

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  let current = 0;

  const visibleItems = () => items.filter(i => !i.classList.contains("hide"));
  function openLB(index) {
    const list = visibleItems();
    current = (index + list.length) % list.length;
    const img = list[current].querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = list[current].querySelector("figcaption").textContent;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLB() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  items.forEach(item => item.addEventListener("click", () =>
    openLB(visibleItems().indexOf(item))
  ));
  document.getElementById("lbClose").addEventListener("click", closeLB);
  document.getElementById("lbPrev").addEventListener("click", () => openLB(current - 1));
  document.getElementById("lbNext").addEventListener("click", () => openLB(current + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowLeft") openLB(current - 1);
    if (e.key === "ArrowRight") openLB(current + 1);
  });

  /* ---------- Price estimate + pricing "Book" buttons ---------- */
  const prices = { "Kitchen Knife": 8, "Whetstone Premium": 20, "Swords & Axes": 35 };
  const service = document.getElementById("service");
  const qty = document.getElementById("qty");
  const estimate = document.getElementById("estimate");

  function updateEstimate() {
    const price = prices[service.value];
    const n = Math.max(1, parseInt(qty.value, 10) || 1);
    estimate.innerHTML = price
      ? `Estimated: <strong>$${price * n}${service.value === "Swords & Axes" ? "+" : ""}</strong>`
      : `Estimated: <strong>Quote on inspection</strong>`;
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
    let ok = true;
    ["name", "email"].forEach(id => {
      const input = document.getElementById(id);
      const empty = !input.value.trim();
      input.parentElement.classList.toggle("error", empty);
      if (empty) ok = false;
    });
    if (!ok) {
      status.textContent = "Fill in your name and contact info so Junior can reach you.";
      status.className = "form-status full bad";
      return;
    }
    // NOTE: this form has no backend yet. Hook it up to a service like
    // Formspree, Netlify Forms or EmailJS to actually receive messages.
    status.textContent = `Thanks, ${document.getElementById("name").value.trim()}! Junior will be in touch soon. 🔥`;
    status.className = "form-status full ok";
    form.reset();
    updateEstimate();
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
