/* Digital Marketing Pro — main script (vanilla JS, no dependencies besides Bootstrap's bundle) */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var LANG = root.lang === "en" ? "en" : "ar";
  var CFG = window.MAXSYS_CONFIG || {};
  var T = (window.MS_T || {})[LANG] || {};
  var BRANDS = window.MS_BRANDS || {};
  var C = CFG.contact || {}, S = CFG.social || {}, A = CFG.analytics || {}, F = CFG.form || {}, K = CFG.content || {};
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  var tr = function (v) { return v && typeof v === "object" ? (v[LANG] || "") : (v || ""); };
  var safe = function (fn) { try { return fn(); } catch (e) { return null; } };
  var store = {
    get: function (k) { return safe(function () { return localStorage.getItem(k); }); },
    set: function (k, v) { safe(function () { localStorage.setItem(k, v); }); }
  };
  var SITE_ROOT = (function () {
    var s = doc.currentScript && doc.currentScript.src;
    try { return new URL("../../", s).href; } catch (e) { return ""; }
  })();

  /* dev helper flag: shows "missing details" hints only on localhost / file */
  var isDev = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname);
  if (isDev) root.classList.add("dev");

  /* ───────── helpers ───────── */
  function icon(name, cls) {
    var p = (window.MS_ICONS || {})[name] || "";
    return '<svg class="ico ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>";
  }
  function brand(key) {
    var b = BRANDS[key]; if (!b) return "";
    return '<svg class="ico ico-brand" viewBox="' + b.viewBox + '" aria-hidden="true"><path d="' + b.path + '"/></svg>';
  }
  var digits = function (v) { return String(v || "").replace(/[^\d]/g, ""); };
  function waUrl(msg) {
    var n = digits(C.whatsapp); if (!n) return null;
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(msg || tr(C.whatsappMessage));
  }
  function telUrl() { var r = String(C.phone || "").replace(/[^\d+]/g, ""); return r ? "tel:" + r : null; }
  function mailUrl() { var e = String(C.email || "").trim(); return e ? "mailto:" + e : null; }
  function socials() {
    return Object.keys(S).filter(function (k) { return String(S[k] || "").trim(); }).map(function (k) { return { key: k, url: String(S[k]).trim() }; });
  }

  /* ───────── 1. Preloader ───────── */
  var plDone = false, plCbs = [];
  function plReady(fn) { plDone ? fn() : plCbs.push(fn); }
  function finishPre() {
    if (plDone) return; plDone = true;
    var el = $("#preloader");
    if (el) { el.setAttribute("data-state", "done"); setTimeout(function () { el.style.display = "none"; }, 700); }
    plCbs.splice(0).forEach(function (f) { f(); });
  }
  (function initPre() {
    var el = $("#preloader");
    if (!el) { plDone = true; return; }
    var arc = $(".pl-arc-fg", el), pct = $(".pl-pct-n", el);
    el.style.setProperty("--diag", Math.ceil(Math.hypot(innerWidth, innerHeight)) + "px");
    if (reduce) { if (arc) arc.style.strokeDashoffset = "0"; if (pct) pct.textContent = "100"; setTimeout(finishPre, 400); return; }
    var dur = 1600, t0 = null;                                  /* progress ring + counter */
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      if (arc) arc.style.strokeDashoffset = String(603 * (1 - e));
      if (pct) pct.textContent = String(Math.round(e * 100));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    setTimeout(function () { el.setAttribute("data-state", "zoom"); }, 1750);   /* portal opens on the site */
    setTimeout(finishPre, 2100);
    setTimeout(finishPre, 5000);                                /* failsafe: never stuck */
    window.addEventListener("pageshow", function (e) { if (e.persisted) finishPre(); });
  })();

  /* ───────── 2. Header: scroll state, mega menu ───────── */
  (function header() {
    var h = $(".site-header"); if (!h) return;
    var onScroll = function () { h.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    var btn = $("[data-mega-btn]"), panel = $("#mega");
    if (!btn || !panel) return;
    var wrap = btn.closest(".has-mega"), timer;
    function open(v) {
      btn.setAttribute("aria-expanded", v ? "true" : "false");
      panel.setAttribute("data-open", v ? "true" : "false");
    }
    btn.addEventListener("click", function () { open(btn.getAttribute("aria-expanded") !== "true"); });
    wrap.addEventListener("mouseenter", function () { clearTimeout(timer); if (matchMedia("(hover:hover)").matches) open(true); });
    wrap.addEventListener("mouseleave", function () { timer = setTimeout(function () { open(false); }, 160); });
    panel.addEventListener("mouseenter", function () { clearTimeout(timer); });
    panel.addEventListener("mouseleave", function () { timer = setTimeout(function () { open(false); }, 160); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.getAttribute("data-open") === "true") { open(false); btn.focus(); } });
    doc.addEventListener("click", function (e) { if (!wrap.contains(e.target) && !panel.contains(e.target)) open(false); });
    panel.addEventListener("focusout", function (e) { if (!panel.contains(e.relatedTarget) && e.relatedTarget !== btn) open(false); });
  })();

  /* ───────── 3. Reveal on scroll (after preloader) ───────── */
  (function reveal() {
    /* auto-assign directions: columns enter from the sides, blocks from below */
    $$("main .container-x, main .container").forEach(function (box) {
      if (box.closest(".hero, .hero-video, .tslider, .motion-sec, [data-reveal]")) return;
      Array.prototype.forEach.call(box.children, function (c, i) {
        if (!c.hasAttribute("data-reveal") && !c.classList.contains("tslider") && !c.classList.contains("row") && !c.querySelector(":scope > .row > [data-reveal]") && !c.hasAttribute("hidden")) c.setAttribute("data-reveal", "up");
      });
    });
    $$("main .row").forEach(function (row) {
      if (row.closest(".hero, .tslider, .motion-sec")) return;
      var kids = Array.prototype.filter.call(row.children, function (c) { return !c.hasAttribute("hidden"); });
      kids.forEach(function (c, i) {
        if (c.hasAttribute("data-reveal") && c.getAttribute("data-reveal") !== "up") return;
        var dir = (i % 3 === 0) ? "start" : (i % 3 === 2 ? "end" : "up");
        if (kids.length === 1) dir = "up";
        c.setAttribute("data-reveal", dir); c.style.setProperty("--d", ((i % 3) * 0.08).toFixed(2) + "s");
      });
    });
    /* every remaining element enters from the left, the right or from below */
    function mark(sel, dirFn) {
      $$(sel).forEach(function (el, i) {
        if (el.hasAttribute("data-reveal") || el.hasAttribute("hidden") || el.closest(".hero, .hero-video, .tslider, .offcanvas, .consent, .mega")) return;
        el.setAttribute("data-reveal", dirFn(i)); el.style.setProperty("--d", ((i % 4) * 0.07).toFixed(2) + "s");
      });
    }
    mark(".site-footer .row > [class*='col']", function (i) { return ["start", "up", "up", "end"][i % 4]; });
    mark(".footer-bottom", function () { return "up"; });
    mark(".accordion-item", function (i) { return i % 2 ? "end" : "start"; });
    mark(".check-list li", function (i) { return i % 2 ? "end" : "start"; });
    mark(".svc-card li", function (i) { return i % 2 ? "end" : "start"; });
    mark(".pill", function (i) { return i % 2 ? "end" : "start"; });
    mark(".filters", function () { return "up"; });
    mark(".page-head .container-x > *", function (i) { return i % 2 ? "end" : "start"; });
    mark(".card-ms .step-num", function () { return "start"; });
    mark(".tctl", function () { return "up"; });
    mark(".crumbs, .proj-body .tag", function (i) { return i % 2 ? "end" : "start"; });
    var els = $$("[data-reveal]").filter(function (e) { return !e.closest(".hero, .tslider") || e.closest(".since-band"); }); if (!els.length) return;
    $$("[data-stagger]").forEach(function (box) {
      var gap = parseFloat(box.getAttribute("data-stagger")) || 0.08;
      $$(":scope > [data-reveal]", box).forEach(function (c, i) { c.style.setProperty("--d", (i * gap).toFixed(2) + "s"); });
    });
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    plReady(function () {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -3% 0px" });
      els.forEach(function (e) { io.observe(e); });
    });
    setTimeout(function () { els.forEach(function (e) { e.classList.add("is-in"); }); }, 9000); /* safety net */
  })();

  /* ───────── 3b. Back to top ───────── */
  (function toTop() {
    var b = $("#toTop"); if (!b) return;
    var on = function () { b.classList.toggle("show", (window.pageYOffset || doc.documentElement.scrollTop) > 500); };
    window.addEventListener("scroll", on, { passive: true }); on();
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  })();

  /* ───────── 4. Parallax + counters ───────── */
  (function fx() {
    var par = $$("[data-parallax]");
    if (par.length && !reduce) {
      var tick = false;
      window.addEventListener("scroll", function () {
        if (tick) return; tick = true;
        requestAnimationFrame(function () {
          par.forEach(function (el) {
            var s = parseFloat(el.getAttribute("data-parallax")) || 0.1, r = el.getBoundingClientRect();
            el.style.transform = "translate3d(0," + ((r.top + r.height / 2 - innerHeight / 2) * -s).toFixed(1) + "px,0)";
          });
          tick = false;
        });
      }, { passive: true });
    }
    var mount = $("[data-stats]");
    var stats = (K.stats || []).filter(function (s) { return s && typeof s.value === "number"; });
    if (mount && stats.length) {
      var runCount = function (el) {
        var to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "", t0 = null;
        if (reduce) { el.textContent = to + suf; return; }
        (function f(ts) { if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / 1600); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(f); })(performance.now());
      };
      var ioS = "IntersectionObserver" in window ? new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          var card = x.target.closest("[data-reveal]"); if (card) card.classList.add("is-in");
          var n = x.target.querySelector("[data-count]"); if (n && !n._done) { n._done = true; runCount(n); }
          ioS.unobserve(x.target);
        });
      }, { threshold: 0.25 }) : null;
      var colCls = "col-12 col-sm-6 " + ({ 4: "col-lg-3", 6: "col-lg-2" }[stats.length] || "col-lg-4");
      var renderStats = function (instant) {
        mount.innerHTML = stats.map(function (s, i) {
          return '<div class="' + colCls + '" data-reveal="' + (i % 2 ? "end" : "start") + '"><div class="stat' + (s.live ? " stat-live" : "") + '" data-stat><b data-count="' + s.value + '" data-suffix="' + (s.suffix || "") + '">' + (instant ? s.value + (s.suffix || "") : "0" + (s.suffix || "")) + "</b><span>" + tr(s.label) + "</span></div></div>";
        }).join("");
        mount.closest("section").hidden = false;
        Array.prototype.forEach.call(mount.querySelectorAll("[data-stat]"), function (e) {
          if (instant || !ioS) { e.parentNode.classList.add("is-in"); var n = e.querySelector("[data-count]"); n.textContent = n.getAttribute("data-count") + (n.getAttribute("data-suffix") || ""); } else ioS.observe(e);
        });
      };
      renderStats(false);
      window.addEventListener("mslang", function () { setTimeout(function () { renderStats(true); }, 0); });
    }
  })();

  /* ───────── 5. Contact details & social icons (always visible; unset ones show a friendly note) ───────── */
  var SOCIAL_KEYS = ["whatsapp", "phone", "facebook", "instagram", "youtube", "linkedin", "tiktok", "snapchat"];
  function hrefFor(k) {
    if (k === "whatsapp") return waUrl();
    if (k === "phone") return telUrl();
    var v = String(S[k] || "").trim(); return v || null;
  }
  function iconFor(k) { return k === "phone" ? icon("phone") : brand(k); }
  function socialHtml() {
    var labels = T.social || {};
    return SOCIAL_KEYS.map(function (k) {
      var h = hrefFor(k), lab = labels[k] || k;
      return h
        ? '<a href="' + encodeURI(h) + '"' + (k === "phone" ? "" : ' target="_blank" rel="noopener noreferrer"') + ' aria-label="' + lab + '" title="' + lab + '">' + iconFor(k) + "</a>"
        : '<a href="#" data-unset aria-label="' + lab + '" title="' + lab + '">' + iconFor(k) + "</a>";
    }).join("");
  }
  var toastT;
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-unset]"); if (!a) return;
    e.preventDefault();
    var old = $(".ms-toast"); if (old) old.remove();
    var t = doc.createElement("div"); t.className = "ms-toast"; t.setAttribute("role", "status"); t.textContent = T.unset || "";
    doc.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(function () { t.remove(); }, 2800);
  });
  function renderContact() {
    var tel = telUrl(), wa = waUrl(), mail = mailUrl();
    function setLink(sel, href) {
      $$(sel).forEach(function (a) {
        if (!href) return;
        a.setAttribute("href", href);
        var t = a.getAttribute("data-text-from");
        var tn = a.querySelector("[data-val]");
        if (sel.indexOf("tel") > -1 && tn) tn.textContent = C.phone;
        if (sel.indexOf("mail") > -1 && tn) tn.textContent = C.email;
        a.hidden = false;
        var row = a.closest("[data-row]"); if (row) row.hidden = false;
      });
    }
    setLink('[data-c="tel"]', tel); setLink('[data-c="mail"]', mail); setLink('[data-c="wa"]', wa);
    /* buttons that carry their own pre-filled WhatsApp message (packages, consultation, FAQ…) */
    $$('[data-c="wa"][data-wa-' + LANG + ']').forEach(function (a) { var u = waUrl(a.getAttribute("data-wa-" + LANG)); if (u) a.setAttribute("href", u); });
    var addr = tr(C.address), hrs = tr(C.hours);
    $$('[data-c="address"]').forEach(function (n) { if (addr) { n.textContent = addr; var r = n.closest("[data-row]"); if (r) r.hidden = false; } });
    $$('[data-c="hours"]').forEach(function (n) { if (hrs) { n.textContent = hrs; var r = n.closest("[data-row]"); if (r) r.hidden = false; } });
    $$("[data-contact-group]").forEach(function (g) {
      var any = $$("[data-row]", g).some(function (r) { return !r.hidden; });
      g.querySelectorAll("[data-empty-note]").forEach(function (n) { n.hidden = any; });
    });
    $$("[data-social-list]").forEach(function (box) { box.innerHTML = socialHtml(); });
  }
  renderContact();

  /* ───────── 6. Floating widget (WhatsApp, phone, social — always visible) ───────── */
  function renderFab() {
    var host = $("#fab"); if (!host) return;
    var W = T.widget || {}, wa = waUrl(), tel = telUrl(), out = "";
    var open = host.querySelector(".fab-social") && host.querySelector(".fab-social").getAttribute("data-open") === "true";
    var soc = SOCIAL_KEYS.filter(function (k) { return k !== "whatsapp" && k !== "phone"; });
    out += '<div class="fab-social" id="fab-social" role="group" data-open="' + (open ? "true" : "false") + '" aria-label="' + W.social + '">' + soc.map(function (k) {
      var h = hrefFor(k), lab = (T.social || {})[k] || k;
      return h ? '<a href="' + encodeURI(h) + '" target="_blank" rel="noopener noreferrer" aria-label="' + lab + '" title="' + lab + '">' + brand(k) + "</a>"
               : '<a href="#" data-unset aria-label="' + lab + '" title="' + lab + '">' + brand(k) + "</a>";
    }).join("") + "</div>";
    out += '<button type="button" class="f-soc" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="fab-social" aria-label="' + (open ? W.closeSocial : W.social) + '">' + icon(open ? "x" : "share") + "</button>";
    out += tel ? '<a class="f-call" href="' + tel + '" aria-label="' + W.call + '">' + icon("phone") + "</a>"
               : '<a class="f-call" href="#" data-unset aria-label="' + W.call + '">' + icon("phone") + "</a>";
    out += wa ? '<a class="f-wa" href="' + wa + '" target="_blank" rel="noopener noreferrer" aria-label="' + W.whatsapp + '">' + brand("whatsapp") + "</a>"
              : '<a class="f-wa" href="#" data-unset aria-label="' + W.whatsapp + '">' + brand("whatsapp") + "</a>";
    host.innerHTML = out; host.setAttribute("aria-label", W.label || "");
    var b = $(".f-soc", host), p = $("#fab-social", host);
    var set = function (v) { b.setAttribute("aria-expanded", v ? "true" : "false"); p.setAttribute("data-open", v ? "true" : "false"); b.setAttribute("aria-label", v ? W.closeSocial : W.social); b.innerHTML = icon(v ? "x" : "share"); };
    b.addEventListener("click", function (e) { e.stopPropagation(); set(b.getAttribute("aria-expanded") !== "true"); });
  }
  renderFab();
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") { var p = $("#fab-social"), b = $(".f-soc"); if (p && b) { p.setAttribute("data-open", "false"); b.setAttribute("aria-expanded", "false"); b.innerHTML = icon("share"); } } });
  doc.addEventListener("click", function (e) { var h = $("#fab"); if (h && !h.contains(e.target)) { var p = $("#fab-social"), b = $(".f-soc"); if (p && b && p.getAttribute("data-open") === "true") { p.setAttribute("data-open", "false"); b.setAttribute("aria-expanded", "false"); b.innerHTML = icon("share"); } } });

  /* ───────── 6b. Hero video (pause button + reduced motion) ───────── */
  (function video() {
    var v = $(".hv-video"), btn = $("[data-video-toggle]"); if (!v) return;
    var paused = false, cur = "";
    function load(l) {   /* a mirrored version for Arabic so the scene sits opposite the text; the logo is never flipped */
      var suffix = l === "ar" ? "-rtl" : "";
      if (cur === suffix) return; cur = suffix;
      v.poster = "assets/img/hero-poster" + suffix + ".webp";
      var srcs = v.querySelectorAll("source");
      srcs[0].src = "assets/video/hero" + suffix + ".webm"; srcs[1].src = "assets/video/hero" + suffix + ".mp4";
      v.load(); if (!paused && !reduce) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    }
    function label() { if (btn) { btn.setAttribute("data-paused", paused ? "true" : "false"); btn.setAttribute("aria-label", LANG === "ar" ? (paused ? "تشغيل الفيديو" : "إيقاف الفيديو") : (paused ? "Play video" : "Pause video")); } }
    function set(p) { paused = p; if (p) v.pause(); else { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } label(); }
    cur = "-rtl"; load(LANG);
    if (reduce) { v.removeAttribute("autoplay"); v.pause(); paused = true; label(); }
    if (btn) btn.addEventListener("click", function () { set(!paused); });
    window.addEventListener("mslang", function (e) { load(e.detail); label(); });
    doc.addEventListener("visibilitychange", function () { if (!paused && !reduce) { if (doc.hidden) v.pause(); else { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } } });
  })();

  /* ───────── 6c. Testimonials slider: auto-moves every 2 s, right then left ───────── */
  (function slider() {
    var box = $("[data-tslider]"); if (!box) return;
    var track = $(".ttrack", box), slides = $$(".tslide", box), prev = $("[data-tprev]", box), next = $("[data-tnext]", box);
    var idx = 0, dirn = 1, per = 1, timer = null, hold = false;
    function calc() { var w = innerWidth; per = w >= 1100 ? 3 : w >= 768 ? 2 : 1; return Math.max(0, slides.length - per); }
    function go(i) {
      var max = calc(); idx = Math.max(0, Math.min(max, i));
      var rtl = root.dir === "rtl", step = slides[0].getBoundingClientRect().width;
      track.style.transform = "translateX(" + ((rtl ? 1 : -1) * idx * step) + "px)";
    }
    function tick() {
      if (hold || doc.hidden) return;
      var max = calc();
      if (idx >= max) dirn = -1; else if (idx <= 0) dirn = 1;
      go(idx + dirn);
    }
    function start() { stop(); if (!reduce) timer = setInterval(tick, 2000); }
    function stop() { clearInterval(timer); timer = null; }
    if (prev) prev.addEventListener("click", function () { go(idx - 1); dirn = -1; });
    if (next) next.addEventListener("click", function () { go(idx + 1); dirn = 1; });
    box.addEventListener("mouseenter", function () { hold = true; });
    box.addEventListener("mouseleave", function () { hold = false; });
    box.addEventListener("focusin", function () { hold = true; });
    box.addEventListener("focusout", function () { hold = false; });
    box.addEventListener("touchstart", function () { hold = true; }, { passive: true });
    box.addEventListener("touchend", function () { setTimeout(function () { hold = false; }, 4000); }, { passive: true });
    window.addEventListener("resize", function () { go(idx); });
    window.addEventListener("mslang", function () { go(idx); });
    go(0); start();
  })();

  /* ───────── language change: refresh every JS-built piece ───────── */
  window.addEventListener("mslang", function (e) {
    LANG = e.detail; T = (window.MS_T || {})[LANG] || {};
    renderContact(); renderFab();
    var c = $("[data-count-out]"); if (c) { var n = $$("[data-cat]:not([hidden])", $("#posts") || doc).length; c.textContent = n + " " + (T.results || ""); }
  });

  /* ───────── 6d. Scroll effects, motion showcase, timeline, sectors carousel ───────── */
  var clamp01 = function (x) { return Math.min(1, Math.max(0, x)); };
  var onScrollFrame = (function () {      /* one shared, rAF-throttled scroll/resize loop for all scroll-driven effects below */
    var fns = [], tick = false;
    function run() { tick = false; fns.forEach(function (f) { f(); }); }
    function kick() { if (!tick) { tick = true; requestAnimationFrame(run); } }
    window.addEventListener("scroll", kick, { passive: true }); window.addEventListener("resize", kick);
    return function (f) { fns.push(f); f(); };
  })();

  /* page scroll-progress bar (on every page) */
  (function progress() {
    var bar = doc.createElement("div"), fill = doc.createElement("i");
    bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true"); bar.appendChild(fill); doc.body.appendChild(bar);
    onScrollFrame(function () {
      var max = doc.documentElement.scrollHeight - innerHeight;
      fill.style.transform = "scaleX(" + (max > 0 ? clamp01((window.pageYOffset || 0) / max) : 0).toFixed(4) + ")";
    });
  })();

  /* statement: words light up one by one while the section scrolls into view */
  (function statement() {
    var el = $("[data-statement]"); if (!el) return;
    var words = [];
    function update() {
      if (!words.length) return;
      if (reduce) { words.forEach(function (w) { w.classList.add("on"); }); return; }
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var n = Math.round(clamp01((vh * 0.85 - r.top) / (r.height + vh * 0.4)) * words.length);
      words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
    }
    function split(l) {
      var text = el.getAttribute("data-st-" + l) || el.textContent;
      el.textContent = "";
      words = text.split(/\s+/).filter(Boolean).map(function (w, i, arr) {
        var s = doc.createElement("span"); s.className = "w"; s.textContent = w; el.appendChild(s);
        if (i < arr.length - 1) el.appendChild(doc.createTextNode(" "));
        return s;
      });
      el.setAttribute("aria-label", text); update();
    }
    split(LANG); onScrollFrame(update);
    window.addEventListener("mslang", function (e) { split(e.detail); });
  })();

  /* motion-graphics showcase: 3 slides, each paired with its video; moves on when the video ends */
  (function motion() {
    var box = $("[data-motion]"); if (!box) return;
    var slides = $$(".m-slide", box), vids = $$("[data-m-arch] video", box), dots = $$("[data-m-dots] button", box);
    var arch = $("[data-m-arch]", box), num = $("[data-m-num]", box), pbtn = $("[data-m-pause]", box);
    var cur = -1, timer = null, inView = false, userStop = reduce, FALLBACK = 8600;
    var canMp4 = !!(vids[0] && vids[0].canPlayType && vids[0].canPlayType('video/mp4; codecs="avc1.42E01E"'));
    function stopped() { return userStop || !inView || doc.hidden; }
    function ensure(v) { if (v && !v.getAttribute("src") && v.dataset.src) { v.src = canMp4 ? v.dataset.src : v.dataset.src.replace(/\.mp4$/, ".webm"); v.load(); } }
    function arm(ms) { clearTimeout(timer); if (stopped()) return; timer = setTimeout(function () { go(cur + 1); }, ms); }
    function setDur(v) { var d = v && isFinite(v.duration) && v.duration ? v.duration : FALLBACK / 1000; dots.forEach(function (b) { b.style.setProperty("--dur", d + "s"); }); }
    function play(v) { if (!v) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function label() {
      if (!pbtn) return; var M = T.motion || {};
      pbtn.setAttribute("aria-label", (userStop ? M.play : M.pause) || ""); pbtn.setAttribute("aria-pressed", userStop ? "true" : "false");
      pbtn.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-' + (userStop ? "play" : "pause") + '"/></svg>';
      dots.forEach(function (b, k) { b.setAttribute("aria-label", (M.slide || "") + " " + (k + 1)); });
    }
    function go(n) {
      n = (n + slides.length) % slides.length;
      var v = vids[n]; clearTimeout(timer);
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === n); s.setAttribute("aria-hidden", k === n ? "false" : "true"); });
      vids.forEach(function (x, k) { x.classList.toggle("is-active", k === n); if (k !== n) x.pause(); });
      dots.forEach(function (b, k) { b.classList.remove("is-active"); b.classList.toggle("is-done", k < n); b.setAttribute("aria-current", k === n ? "true" : "false"); });
      void dots[n].offsetWidth; dots[n].classList.add("is-active");
      setDur(v); if (num) num.textContent = ("0" + (n + 1)).slice(-2);
      cur = n; ensure(v); ensure(vids[(n + 1) % vids.length]);
      try { v.currentTime = 0; } catch (e) {}
      if (!stopped()) play(v);
      arm(FALLBACK);
    }
    function apply() {
      box.classList.toggle("is-paused", stopped()); label();
      if (cur < 0) return;
      var v = vids[cur];
      if (stopped()) { clearTimeout(timer); if (v) v.pause(); }
      else { play(v); arm(isFinite(v.duration) ? (v.duration - v.currentTime) * 1000 + 700 : FALLBACK); }
    }
    vids.forEach(function (v) {
      v.muted = true; v.setAttribute("playsinline", "");
      v.addEventListener("ended", function () { if (vids[cur] === v && !stopped()) go(cur + 1); });
      v.addEventListener("loadedmetadata", function () { if (vids[cur] === v) setDur(v); });
    });
    var nx = $("[data-m-next]", box), pv = $("[data-m-prev]", box);
    if (nx) nx.addEventListener("click", function () { go(cur + 1); });
    if (pv) pv.addEventListener("click", function () { go(cur - 1); });
    dots.forEach(function (b, k) { b.addEventListener("click", function () { go(k); }); });
    if (pbtn) pbtn.addEventListener("click", function () { userStop = !userStop; apply(); });
    var sx = null;   /* swipe */
    [arch, $("[data-m-slides]", box)].forEach(function (el) {
      if (!el) return;
      el.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
      el.addEventListener("touchend", function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dx) < 45) return;
        go(cur + ((dx < 0) === (root.dir === "ltr") ? 1 : -1));
      }, { passive: true });
    });
    /* plays as soon as the site opens (after the preloader); pauses when scrolled out of view */
    plReady(function () {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView && cur < 0) { go(0); apply(); } else apply(); }, { threshold: 0.2 }).observe(box);
      } else { inView = true; go(0); }
    });
    doc.addEventListener("visibilitychange", apply);
    window.addEventListener("mslang", label);
    label();
  })();

  /* process timeline: the line fills and each step lights up as you scroll */
  (function timeline() {
    var tl = $("[data-timeline]"); if (!tl) return;
    var items = $$("li", tl);
    onScrollFrame(function () {
      var line = innerHeight * 0.62, r = tl.getBoundingClientRect();
      tl.style.setProperty("--p", clamp01((line - (r.top + 34)) / Math.max(1, r.height - 68)).toFixed(3));
      items.forEach(function (li) { var b = li.getBoundingClientRect(); li.classList.toggle("reached", b.top + b.height / 2 < line); });
    });
  })();

  /* sectors carousel: arrows, mouse drag, touch swipe */
  (function sectors() {
    var sc = $("[data-sec-scroller]"); if (!sc) return;
    var step = function () { var c = sc.querySelector(".sec-card"); return (c ? c.offsetWidth : 280) + 20; };
    var dir = function () { return root.dir === "rtl" ? -1 : 1; };
    var by = function (k) { sc.scrollBy({ left: step() * dir() * k, behavior: reduce ? "auto" : "smooth" }); };
    var nx = $("[data-sec-next]"), pv = $("[data-sec-prev]");
    if (nx) nx.addEventListener("click", function () { by(1); });
    if (pv) pv.addEventListener("click", function () { by(-1); });
    var down = false, moved = false, x0 = 0, l0 = 0;
    sc.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; l0 = sc.scrollLeft; });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      if (!moved && Math.abs(e.clientX - x0) > 6) { moved = true; sc.classList.add("drag"); }   /* a plain click still opens the card link */
      if (moved) sc.scrollLeft = l0 - (e.clientX - x0);
    });
    window.addEventListener("pointerup", function () { if (down) { down = false; sc.classList.remove("drag"); } });
    sc.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  })();

  /* ───────── 7. Consent + analytics ───────── */
  (function consent() {
    var KEY = "ms_consent_v1";
    var hasAnalytics = !!(A.ga4 || A.gtm || A.metaPixel);
    var box = $("#consent");
    function load() {
      if (window.__msAnalytics) return; window.__msAnalytics = true;
      function s(src) { var e = doc.createElement("script"); e.async = true; e.src = src; doc.head.appendChild(e); }
      window.dataLayer = window.dataLayer || [];
      if (A.gtm) {
        window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
        s("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(A.gtm));
      }
      if (A.ga4) {
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date()); window.gtag("config", A.ga4);
        s("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(A.ga4));
      }
      if (A.metaPixel) {
        !function (f, b, e, v, n, t, s2) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s2 = b.getElementsByTagName(e)[0]; s2.parentNode.insertBefore(t, s2); }(window, doc, "script", "https://connect.facebook.net/en_US/fbevents.js");
        window.fbq("init", A.metaPixel); window.fbq("track", "PageView");
      }
    }
    function show(v) { if (!box) return; box.setAttribute("data-open", v ? "true" : "false"); root.setAttribute("data-consent-open", v ? "true" : "false"); }
    $$("[data-cookie-settings]").forEach(function (b) { b.hidden = !hasAnalytics; b.addEventListener("click", function () { show(true); }); });
    if (!hasAnalytics) return;
    var cur = store.get(KEY);
    if (cur === "granted") load(); else if (!cur) show(true);
    $$("[data-consent]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var ok = b.getAttribute("data-consent") === "yes";
        store.set(KEY, ok ? "granted" : "denied"); show(false); if (ok) load();
      });
    });
  })();

  /* ───────── 8. Filters (projects + blog) ───────── */
  (function filters() {
    var demoOff = K.showDemoProjects === false;
    var testiOff = K.showTestimonialPlaceholders === false;
    $$("[data-demo-only]").forEach(function (e) { if (demoOff) e.hidden = true; });
    $$("[data-testi-section]").forEach(function (e) { if (testiOff) e.hidden = true; });

    $$("[data-filter-group]").forEach(function (g) {
      var grid = $(g.getAttribute("data-filter-group")); if (!grid) return;
      var btns = $$("[data-filter]", g), items = $$("[data-cat]", grid);
      var empty = grid.parentNode.querySelector("[data-empty]");
      var search = $("[data-search]", grid.parentNode) || $("[data-search]");
      var count = $("[data-count-out]");
      var cat = "all", q = "";
      function apply() {
        var n = 0;
        items.forEach(function (it) {
          if (demoOff && it.hasAttribute("data-demo-item")) { it.hidden = true; return; }
          var ok = (cat === "all" || it.getAttribute("data-cat") === cat) && (!q || (it.getAttribute("data-text") || "").indexOf(q) > -1);
          it.hidden = !ok; if (ok) n++;
        });
        if (empty) empty.hidden = n > 0;
        if (count) count.textContent = n + " " + (T.results || "");
      }
      btns.forEach(function (b) {
        b.addEventListener("click", function () {
          cat = b.getAttribute("data-filter");
          btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); apply();
        });
      });
      if (search) search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); apply(); });
      apply();
    });
  })();

  /* ───────── 9. Share / copy link ───────── */
  $$("[data-copy-link]").forEach(function (b) {
    b.addEventListener("click", function () {
      var done = function () { var o = b.innerHTML; b.textContent = T.copied || "OK"; setTimeout(function () { b.innerHTML = o; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, function () { });
      else { var t = doc.createElement("textarea"); t.value = location.href; doc.body.appendChild(t); t.select(); safe(function () { doc.execCommand("copy"); }); t.remove(); done(); }
    });
  });
  $$("[data-share]").forEach(function (a) {
    var u = encodeURIComponent(location.href), ti = encodeURIComponent(doc.title), k = a.getAttribute("data-share");
    a.href = k === "x" ? "https://twitter.com/intent/tweet?url=" + u + "&text=" + ti
      : k === "facebook" ? "https://www.facebook.com/sharer/sharer.php?u=" + u
      : k === "linkedin" ? "https://www.linkedin.com/sharing/share-offsite/?url=" + u
      : "https://wa.me/?text=" + ti + "%20" + u;
  });

  /* ───────── 10. Contact form ───────── */
  (function form() {
    var f = $("#contact-form"); if (!f) return;
    var M = T.form || {}, started = Date.now();
    window.addEventListener("mslang", function () { M = T.form || {}; });
    var status = $("#form-status"), btn = $("[type=submit]", f);
    var sp = new URLSearchParams(location.search).get("service");
    var sel = f.elements.service;
    if (sp && sel && $$("option", sel).some(function (o) { return o.value === sp; })) sel.value = sp;
    if (F.turnstileSiteKey) {
      var tw = $("#turnstile-wrap"); if (tw) {
        tw.hidden = false;
        var s = doc.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; s.async = true; s.defer = true; doc.head.appendChild(s);
        tw.innerHTML = '<div class="cf-turnstile" data-sitekey="' + F.turnstileSiteKey + '"></div>';
      }
    }
    var norm = function (v) { return String(v).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x0660; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x06f0; }); };
    function validate(d) {
      var e = {};
      if (d.name.trim().length < 2) e.name = 1;
      var ph = norm(d.phone.trim()), dg = ph.replace(/\D/g, "");
      if (!/^\+?[0-9\s\-()]{7,24}$/.test(ph) || dg.length < 7 || dg.length > 15) e.phone = 1;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 1;
      if (d.country.trim().length < 2) e.country = 1;
      if (d.city.trim().length < 2) e.city = 1;
      if (!d.service) e.service = 1;
      if (d.details.trim().length < 10) e.details = 1;
      if (!d.consent) e.consent = 1;
      return e;
    }
    function data() {
      var g = function (n) { return f.elements[n] ? f.elements[n].value : ""; };
      var cm = $("input[name=contactMethod]:checked", f);
      return { name: g("name"), company: g("company"), phone: norm(g("phone").trim()), email: g("email"), country: g("country"), city: g("city"), service: g("service"), budget: g("budget"), details: g("details"), contactMethod: cm ? cm.value : "whatsapp", consent: f.elements.consent.checked, website: g("website"), startedAt: started, locale: LANG };
    }
    function waFallback() {
      var u = waUrl(); if (!u) return "";
      return '<p class="wa-fallback mb-0">' + (M.waFallback || "") + ' <a href="' + encodeURI(u) + '" target="_blank" rel="noopener noreferrer"><b>WhatsApp</b></a></p>';
    }
    function box(type, title, html) {
      status.innerHTML = '<div class="alert-ms ' + (type === "ok" ? "alert-ok" : "alert-err") + '" role="' + (type === "ok" ? "status" : "alert") + '" tabindex="-1"><b>' + title + "</b>" + (html || "") + "</div>";
      var n = status.firstChild; n.focus && n.focus(); n.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); status.innerHTML = "";
      var d = data(), errs = validate(d), keys = Object.keys(errs);
      $$(".is-invalid", f).forEach(function (x) { x.classList.remove("is-invalid"); x.removeAttribute("aria-invalid"); });
      if (keys.length) {
        keys.forEach(function (k) { var el = f.elements[k]; if (el) { el.classList.add("is-invalid"); el.setAttribute("aria-invalid", "true"); } });
        box("err", M.errors.summary, "<ul>" + keys.map(function (k) { return '<li><a href="#f-' + k + '">' + M.errors[k] + "</a></li>"; }).join("") + "</ul>");
        var first = f.elements[keys[0]]; if (first) setTimeout(function () { first.focus(); }, 50);
        return;
      }
      var tok = $("[name=cf-turnstile-response]", f); if (tok) d.turnstileToken = tok.value;
      if (F.turnstileSiteKey && !(tok && tok.value)) { box("err", M.errors.captcha); return; }
      btn.disabled = true; var old = btn.innerHTML; btn.textContent = M.sending;
      var url = F.endpoint || f.getAttribute("data-endpoint");
      var ctl = "AbortController" in window ? new AbortController() : null, to = setTimeout(function () { ctl && ctl.abort(); }, 20000);
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d), signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (r) {
          if (r.s >= 200 && r.s < 300 && r.j && r.j.ok) {
            f.hidden = true;
            status.innerHTML = '<div class="alert-ms alert-ok" role="status" tabindex="-1"><b>' + M.successTitle + "</b><p class='mb-3 mt-1'>" + M.successText + '</p><button type="button" class="btn-ms btn-line btn-sm-ms" id="again">' + M.newRequest + "</button></div>";
            status.firstChild.focus(); $("#again").addEventListener("click", function () { f.reset(); f.hidden = false; status.innerHTML = ""; started = Date.now(); });
            if (window.gtag) safe(function () { window.gtag("event", "generate_lead"); });
            if (window.fbq) safe(function () { window.fbq("track", "Lead"); });
          } else if (r.s === 503 || (r.j && r.j.error === "not_configured")) box("err", M.failTitle, "<p class='mb-0 mt-1'>" + M.notConfigured + "</p>" + waFallback());
          else if (r.s === 429) box("err", M.failTitle, "<p class='mb-0 mt-1'>" + M.rateLimited + "</p>" + waFallback());
          else box("err", M.failTitle, "<p class='mb-0 mt-1'>" + M.failText + "</p>" + waFallback());
        })
        .catch(function () { box("err", M.failTitle, "<p class='mb-0 mt-1'>" + M.failText + "</p>" + waFallback()); })
        .then(function () { clearTimeout(to); btn.disabled = false; btn.innerHTML = old; });
    });
    $$("input,select,textarea", f).forEach(function (el) {
      el.addEventListener("input", function () { el.classList.remove("is-invalid"); el.removeAttribute("aria-invalid"); });
    });
    /* "Send via WhatsApp": same fields, opens a ready message (works even when the PHP form isn't set up) */
    var wb = $("[data-wa-form]", f);
    function syncWa() { if (wb) wb.hidden = !waUrl(); }
    syncWa(); window.addEventListener("mslang", function () { setTimeout(syncWa, 0); });
    if (wb) wb.addEventListener("click", function () {
      status.innerHTML = "";
      var d = data(), errs = validate(d), keys = ["name", "phone"].filter(function (k) { return errs[k]; });
      $$(".is-invalid", f).forEach(function (x) { x.classList.remove("is-invalid"); x.removeAttribute("aria-invalid"); });
      if (keys.length) {
        keys.forEach(function (k) { var el = f.elements[k]; if (el) { el.classList.add("is-invalid"); el.setAttribute("aria-invalid", "true"); } });
        box("err", M.errors.summary, "<ul>" + keys.map(function (k) { return '<li><a href="#f-' + k + '">' + M.errors[k] + "</a></li>"; }).join("") + "</ul>");
        var fe = f.elements[keys[0]]; if (fe) setTimeout(function () { fe.focus(); }, 50);
        return;
      }
      var so = f.elements.service, svc = so && so.value ? so.options[so.selectedIndex].text : "", bo = f.elements.budget, bud = bo && bo.value ? bo.options[bo.selectedIndex].text : "";
      var lines = [M.waHi + d.name.trim(), M.waPhone + d.phone];
      if (d.email.trim()) lines.push(M.waEmail + d.email.trim());
      if (d.company.trim()) lines.push(M.waCompany + d.company.trim());
      var loc = [d.city.trim(), d.country.trim()].filter(Boolean).join("، ");
      if (loc) lines.push(M.waLoc + loc);
      if (svc) lines.push(M.waService + svc);
      if (bud) lines.push(M.waBudget + bud);
      if (d.details.trim()) lines.push("", d.details.trim());
      var u = waUrl(lines.join("\n"));
      if (!u) { box("err", M.failTitle, "<p class='mb-0 mt-1'>" + M.waNotSet + "</p>"); return; }
      window.open(u, "_blank", "noopener");
      box("ok", M.waOpened);
    });
  })();

  /* close mobile offcanvas when a link is chosen */
  $$("#mobileMenu a").forEach(function (a) {
    a.addEventListener("click", function () {
      var oc = window.bootstrap && bootstrap.Offcanvas.getInstance($("#mobileMenu")); if (oc) oc.hide();
    });
  });
})();
