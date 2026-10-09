/* Atherstam Properties — motion + UI.
   Built on the real-estate cinematic template; wired by data-attributes. */
(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  $$("img").forEach(img => img.addEventListener("error", () => img.classList.add("is-missing"), { once: true }));

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = el => (lenis ? lenis.scrollTo(el, { offset: 0, duration: 1.6 }) : el.scrollIntoView());
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    if (a.hasAttribute("data-book")) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault(); closeMenu(); scrollToEl(el);
  }));

  /* ---------------- Header: solid after hero, hides on scroll down ---------------- */
  const header = $("[data-header]");
  if (header) {
    let lastY = 0;
    const onScroll = () => {
      const y = scrollY, past = y > innerHeight * 0.85;
      header.classList.toggle("is-solid", past);
      document.body.classList.toggle("past-hero", past);
      if (!document.body.classList.contains("menu-open")) header.classList.toggle("is-hidden", past && y > lastY + 2);
      if (Math.abs(y - lastY) > 2) lastY = y;
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Menu overlay ---------------- */
  const menu = $(".menu");
  function openMenu() {
    if (!menu) return;
    menu.hidden = false; lenis?.stop();
    document.body.classList.add("menu-open");
    if (!reduce) {
      gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power4.inOut" });
      gsap.from($$(".menu__link", menu), { yPercent: 110, stagger: 0.06, delay: 0.35, duration: 0.9 });
      gsap.from($$(".menu__pillars > div", menu), { autoAlpha: 0, y: 20, stagger: 0.08, delay: 0.6 });
    }
    $(".menu__link", menu)?.focus();
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    const done = () => { menu.hidden = true; lenis?.start(); document.body.classList.remove("menu-open"); };
    reduce ? done() : gsap.to(menu, { clipPath: "inset(100% 0 0 0)", duration: 0.8, ease: "power4.inOut", onComplete: done });
  }
  $$("[data-menu-open]").forEach(b => b.addEventListener("click", openMenu));
  $$("[data-menu-close]").forEach(b => b.addEventListener("click", closeMenu));
  addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  /* ---------------- Evening / night hero ---------------- */
  const hero = $("[data-daynight]");
  if (hero) {
    const night = $(".hero__night", hero);
    $$("[data-time]", hero).forEach(btn => btn.addEventListener("click", () => {
      const toNight = btn.dataset.time === "night";
      $$("[data-time]", hero).forEach(b => b.setAttribute("aria-pressed", b === btn));
      if (reduce) { night.style.opacity = toNight ? 1 : 0; night.style.clipPath = "none"; return; }
      gsap.to(night, { clipPath: toNight ? "circle(150% at 82% 22%)" : "circle(0% at 82% 22%)", duration: 1.5, ease: "power3.inOut" });
      gsap.fromTo($("img", night), { scale: toNight ? 1.15 : 1 }, { scale: 1, duration: 1.8, ease: "power3.out" });
    }));
  }

  /* ---------------- Tabs with image wipe ---------------- */
  $$("[data-tabs]").forEach(group => {
    const tabs = $$("[data-tab]", group);
    const panes = $$("[data-pane]", group);
    const hover = group.dataset.tabs === "hover";
    const show = key => {
      tabs.forEach(t => t.setAttribute("aria-selected", t.dataset.tab === key));
      panes.forEach(p => {
        const on = p.dataset.pane === key;
        p.classList.toggle("is-active", on);
        p.setAttribute("aria-hidden", !on);
      });
    };
    tabs.forEach(t => {
      t.addEventListener("click", () => show(t.dataset.tab));
      t.addEventListener("focus", () => hover && show(t.dataset.tab));
      if (hover && finePointer) t.addEventListener("mouseenter", () => show(t.dataset.tab));
    });
    if (tabs[0]) show(tabs[0].dataset.tab);
  });

  /* ---------------- Draggable property rail (with inertia) ---------------- */
  $$("[data-rail]").forEach(rail => {
    const inner = rail.firstElementChild;
    const bounds = () => {
      const padL = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      return { minX: Math.min(0, rail.clientWidth - padL - inner.offsetWidth), maxX: 0 };
    };
    const d = Draggable.create(inner, {
      type: "x", bounds: bounds(), inertia: !reduce, edgeResistance: 0.85, dragClickables: true,
      allowEventDefault: true, zIndexBoost: false, minimumMovement: 6,
      onPress() { gsap.to(".cursor", { scale: 0.8, duration: 0.3 }); },
      onRelease() { gsap.to(".cursor", { scale: 1, duration: 0.3 }); },
      onDrag() { gsap.to($$(".prop", inner), { skewX: gsap.utils.clamp(-6, 6, this.deltaX * -0.4), duration: 0.4, overwrite: "auto" }); },
      onThrowUpdate() { gsap.to($$(".prop", inner), { skewX: 0, duration: 0.6, overwrite: "auto" }); },
      onDragEnd() { gsap.to($$(".prop", inner), { skewX: 0, duration: 0.6, overwrite: "auto" }); }
    })[0];
    const reb = () => d.applyBounds(bounds());
    addEventListener("resize", reb);
    $$("img", inner).forEach(i => i.addEventListener("load", reb));
    rail.addEventListener("keydown", e => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const b = bounds(), x = gsap.getProperty(inner, "x");
      gsap.to(inner, { x: gsap.utils.clamp(b.minX, 0, x + (e.key === "ArrowLeft" ? 360 : -360)), duration: 0.6, onComplete: () => d.update() });
    });
  });

  /* ---------------- Custom "Drag" cursor (fine pointers only) ---------------- */
  const cursor = $(".cursor");
  if (cursor && finePointer && !reduce) {
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3" });
    addEventListener("pointermove", e => { xTo(e.clientX); yTo(e.clientY); });
    $$("[data-cursor]").forEach(el => {
      el.addEventListener("pointerenter", () => { $("span", cursor).textContent = el.dataset.cursor; gsap.to(cursor, { scale: 1, duration: 0.4, ease: "back.out(1.7)" }); });
      el.addEventListener("pointerleave", () => gsap.to(cursor, { scale: 0, duration: 0.3 }));
    });
  }

  /* ---------------- Book-a-visit modal + form ---------------- */
  const dlg = $("#book");
  let lastTrigger = null;
  $$("[data-book]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault(); closeMenu(); lastTrigger = b;
    dlg.showModal(); lenis?.stop();
  }));
  dlg?.addEventListener("close", () => { lenis?.start(); lastTrigger?.focus(); });
  dlg?.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  $$("[data-dialog-close]", dlg || document).forEach(b => b.addEventListener("click", () => dlg.close()));

  const form = $("#book-form");
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    const err = $(".form__error", form);
    err.textContent = "";
    if (!form.name.value.trim()) { err.textContent = "Add your name so we know who to ask for."; form.name.focus(); return; }
    if (form.phone.value.replace(/\D/g, "").length < 10) { err.textContent = "Enter a 10-digit mobile number so we can call you back."; form.phone.focus(); return; }
    if (form.email.value && !form.email.validity.valid) { err.textContent = "Enter an email like name@example.com, or leave it blank."; form.email.focus(); return; }
    const endpoint = form.dataset.endpoint;
    const btn = $("[type=submit]", form); btn.disabled = true;
    try {
      if (endpoint) {
        const res = await fetch(endpoint, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
        if (!res.ok) throw new Error(res.status);
      }
      form.closest(".dialog__body").classList.add("is-sent");
    } catch (x) {
      err.textContent = form.dataset.fail;
    } finally { btn.disabled = false; }
  });

  /* ---------------- Motion (all gated) ---------------- */
  function buildMotion() {
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 900px)", mobile: "(max-width: 899px)", reduce: "(prefers-reduced-motion: reduce)" }, ctx => {
      const { desktop, reduce } = ctx.conditions;

      // Line reveals
      $$("[data-lines]").forEach(el => {
        if (reduce) { gsap.set(el, { visibility: "visible" }); return; }
        const s = SplitText.create(el, { type: "lines", mask: "lines" });
        gsap.set(el, { visibility: "visible" });
        gsap.from(s.lines, { yPercent: 105, stagger: 0.1, duration: 1.1, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });

      if (reduce) return;

      // Marquee: endless loop that speeds up and flips with scroll velocity
      $$("[data-marquee]").forEach(m => {
        const track = $(".marquee__track", m);
        const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 28, repeat: -1 });
        ScrollTrigger.create({
          trigger: m, start: "top bottom", end: "bottom top",
          onUpdate: st => {
            const v = st.getVelocity() / 300;
            gsap.to(loop, { timeScale: (st.direction === 1 ? 1 : -1) * gsap.utils.clamp(1, 6, Math.abs(v) + 1), duration: 0.2, overwrite: true });
            gsap.to(loop, { timeScale: st.direction === 1 ? 1 : -1, duration: 1.2, delay: 0.25, overwrite: false });
          }
        });
      });

      // Ghost emblem rotates as you scroll past
      $$("[data-spin]").forEach(el => gsap.fromTo(el, { rotation: -25, scale: 0.85 }, { rotation: 25, scale: 1.05, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 1 } }));

      // Image parallax
      $$("[data-parallax]").forEach(img => {
        const amt = parseFloat(img.dataset.parallax || 12);
        gsap.fromTo(img, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: 1 } });
      });

      // Clip reveal: inset rounded rect → full bleed
      $$("[data-clip]").forEach(el => {
        gsap.fromTo(el, { clipPath: "inset(14% 10% 14% 10% round 36px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 15%", scrub: 1 } });
      });

      // Image unveil: wipe up from the bottom, inner image settles
      $$("[data-reveal]").forEach(el => {
        const img = $("img", el);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } });
        tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0% round 26px)" }, { clipPath: "inset(0% 0% 0% 0% round 26px)", duration: 1.3, ease: "power4.inOut" });
        if (img && !img.hasAttribute("data-parallax")) tl.from(img, { scale: 1.3, duration: 1.8, ease: "power3.out" }, 0);
      });

      // Mist layers over the aerial
      $$("[data-cloud]").forEach(c => {
        const d = parseFloat(c.dataset.cloud || 0.3);
        gsap.to(c, { yPercent: -160 * d, ease: "none", scrollTrigger: { trigger: c.closest("section"), start: "top bottom", end: "bottom top", scrub: 1 } });
        gsap.to(c, { xPercent: 8 + d * 12, duration: 14 + Math.random() * 8, yoyo: true, repeat: -1, ease: "sine.inOut" });
      });

      // Route draw + pins
      $$("[data-draw]").forEach(p => {
        const L = p.getTotalLength();
        gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
        gsap.to(p, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: p.closest("svg"), start: "top 80%", end: "center 45%", scrub: 1 } });
      });
      $$("[data-pins]").forEach(g => gsap.from($$(".pin", g), { scale: 0, transformOrigin: "50% 50%", stagger: 0.15, duration: 0.7, ease: "back.out(1.7)", scrollTrigger: { trigger: g.closest("svg"), start: "top 70%" } }));

      // Property cards rise in
      $$(".rail__inner").forEach(r => gsap.from($$(".prop", r), { x: 120, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: r, start: "top 85%" } }));

      // Testimonial + step cards
      $$(".voice, .step").forEach(c => gsap.from(c, { y: 50, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: c, start: "top 90%" } }));

      // Pinned stacking cards (desktop only)
      $$("[data-stack]").forEach(sec => {
        const cards = $$(".stack__card", sec), counter = $(".stack__count", sec);
        if (!desktop || cards.length < 2) {
          cards.forEach(c => gsap.from(c, { autoAlpha: 0, y: 60, scrollTrigger: { trigger: c, start: "top 88%" } }));
          return;
        }
        gsap.set(cards.slice(1), { yPercent: 112, rotation: 2 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: `+=${cards.length * 90}%`, pin: true, scrub: 1,
          onUpdate: st => counter && (counter.textContent = Math.min(cards.length, Math.floor(st.progress * cards.length) + 1)) } });
        cards.forEach((c, i) => {
          if (i === 0) return;
          tl.to(cards[i - 1], { scale: 0.9, filter: "brightness(.55)", ease: "none" }, i - 1)
            .to(c, { yPercent: 0, rotation: 0, ease: "none" }, i - 1);
        });
      });

      // Horizontal interiors gallery (desktop pin)
      $$("[data-hscroll]").forEach(sec => {
        const track = $(".hscroll__track", sec);
        if (!desktop || !track) return;
        const dist = () => track.scrollWidth - sec.clientWidth;
        const tween = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
        $$(".hscroll__item img", sec).forEach(img => gsap.fromTo(img, { scale: 1.25, xPercent: 8 }, { scale: 1, xPercent: -8, ease: "none", scrollTrigger: { trigger: img.closest(".hscroll__item"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } }));
      });

      // Sky title scales in
      $$(".sky__title").forEach(t => gsap.fromTo(t, { scale: 0.86 }, { scale: 1.04, ease: "none", scrollTrigger: { trigger: t.closest("section"), start: "top bottom", end: "bottom top", scrub: 1 } }));

      // Hero: slow settle on scroll
      $$("[data-hero-media]").forEach(m => gsap.to(m, { yPercent: 14, scale: 1.05, ease: "none", scrollTrigger: { trigger: m.closest("section"), start: "top top", end: "bottom top", scrub: 1 } }));
      $$(".hero__copy").forEach(c => gsap.to(c, { yPercent: -30, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: c.closest("section"), start: "40% top", end: "bottom top", scrub: 1 } }));

      // Giant footer wordmark slides in
      $$(".footer__word").forEach(w => gsap.from(w, { yPercent: 40, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: w, start: "top bottom", end: "bottom bottom", scrub: 1 } }));
    });
  }

  function heroIn() {
    const h1 = $("[data-hero-title]");
    if (!h1) return;
    if (reduce) { h1.style.visibility = "visible"; return; }
    const s = SplitText.create(h1, { type: "words,chars", mask: "words" });
    gsap.set(h1, { visibility: "visible" });
    gsap.timeline()
      .from(s.chars, { yPercent: 115, rotate: 6, stagger: 0.045, duration: 1.2, ease: "power4.out" })
      .from("[data-hero-fade]", { autoAlpha: 0, y: 24, stagger: 0.08, duration: 0.9 }, "-=.8")
      .from("[data-hero-media] img", { scale: 1.18, duration: 2.6, ease: "power2.out" }, 0)
      .from(".header__row", { y: -30, autoAlpha: 0, duration: 1 }, 0.3);
  }

  /* ---------------- Boot: fonts → preloader → hero ---------------- */
  document.fonts.ready.then(() => {
    buildMotion();
    const loader = $(".preloader");
    if (!loader || reduce) { loader?.remove(); heroIn(); ScrollTrigger.refresh(); return; }
    lenis?.stop();
    const count = $(".preloader__count", loader), o = { v: 0 };
    gsap.timeline({ onComplete: () => { loader.remove(); lenis?.start(); ScrollTrigger.refresh(); } })
      .from(".preloader__logo", { scale: 0.6, rotation: -90, autoAlpha: 0, duration: 1.2, ease: "back.out(1.4)" }, 0)
      .from(".preloader__name span", { yPercent: 110, duration: 1, ease: "power4.out" }, 0.25)
      .from(".preloader__sub", { autoAlpha: 0, letterSpacing: "0.6em", duration: 1.2 }, 0.4)
      .to(o, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => (count.textContent = Math.round(o.v)) }, 0)
      .to(".preloader__bar span", { scaleX: 1, duration: 1.6, ease: "power2.inOut" }, 0)
      .to(".preloader__mark", { yPercent: -30, autoAlpha: 0, duration: 0.6, ease: "power2.in" }, "+=.1")
      .to(loader, { yPercent: -100, duration: 1.1, ease: "power4.inOut" }, "-=.2")
      .add(heroIn, "-=.6");
  });
  addEventListener("load", () => ScrollTrigger.refresh());
})();
