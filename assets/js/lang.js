/* Language switcher: one page, two languages. Elements marked data-t carry their English text in data-en / data-en-<attribute>. */
(function () {
  var d = document.documentElement;
  function save(el) {
    if (el._ar) return;
    var s = { text: null, attrs: {} };
    if (el.hasAttribute("data-en")) s.text = el.textContent;
    for (var i = 0; i < el.attributes.length; i++) {
      var n = el.attributes[i].name;
      if (n.indexOf("data-en-") === 0) { var a = n.slice(8); s.attrs[a] = el.getAttribute(a); }
    }
    el._ar = s;
  }
  function apply(l, persist) {
    l = l === "en" ? "en" : "ar";
    var els = document.querySelectorAll("[data-t]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; save(el);
      if (el._ar.text !== null) el.textContent = l === "en" ? el.getAttribute("data-en") : el._ar.text;
      for (var a in el._ar.attrs) {
        var v = l === "en" ? el.getAttribute("data-en-" + a) : el._ar.attrs[a];
        if (v === null) el.removeAttribute(a); else el.setAttribute(a, v);
      }
    }
    d.lang = l; d.dir = l === "ar" ? "rtl" : "ltr";
    var r = document.getElementById("bs-rtl"), t = document.getElementById("bs-ltr");
    if (r && t) { r.media = l === "ar" ? "all" : "not all"; t.media = l === "ar" ? "not all" : "all"; }
    if (persist) { try { localStorage.setItem("ms_lang", l); } catch (e) {} }
    window.dispatchEvent(new CustomEvent("mslang", { detail: l }));
  }
  window.MSLang = { get: function () { return d.lang; }, set: apply };
  if (d.lang === "en") apply("en", false);
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-lang-toggle]");
    if (b) apply(d.lang === "ar" ? "en" : "ar", true);
  });
})();
