/* runs before first paint: picks the language (Arabic by default) and the matching Bootstrap build */
(function () {
  var d = document.documentElement, l = "ar";
  try {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "en" || q === "ar") localStorage.setItem("ms_lang", q);
    l = localStorage.getItem("ms_lang") || "ar";
  } catch (e) {}
  if (l !== "en") l = "ar";
  d.classList.add("js"); d.lang = l; d.dir = l === "ar" ? "rtl" : "ltr";
  var r = document.getElementById("bs-rtl"), t = document.getElementById("bs-ltr");
  if (r && t) { r.media = l === "ar" ? "all" : "not all"; t.media = l === "ar" ? "not all" : "all"; }
})();
