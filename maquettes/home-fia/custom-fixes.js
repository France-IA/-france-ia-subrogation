(function () {
  "use strict";

  /* ---------- Apparition au scroll ----------
     IntersectionObserver retardé : pas de callback auto avant stabilisation
     police/layout (setTimeout 2500ms), puis plus aucun travail pendant le
     scroll lui-même (contrairement à un polling scroll+rAF, root-causé
     comme source de jank). */
  var blocks = [].slice.call(document.querySelectorAll(".fia-fade"));

  function reveal() {
    var vh = window.innerHeight;
    blocks.forEach(function (b) {
      if (b.__fiaShown) return;
      var r = b.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) { b.__fiaShown = true; b.classList.add("fia-in"); }
    });
  }
  function observeRemaining() {
    var remaining = blocks.filter(function (b) { return !b.__fiaShown; });
    if (!remaining.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var b = entry.target;
        if (b.__fiaShown) return;
        b.__fiaShown = true;
        b.classList.add("fia-in");
        io.unobserve(b);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    remaining.forEach(function (b) { io.observe(b); });
  }
  function runFade() { reveal(); }
  window.addEventListener("load", reveal);
  setTimeout(reveal, 700);
  setTimeout(function () { reveal(); observeRemaining(); }, 2500);

  /* ---------- Carrousel formateurs : boutons prev/next ---------- */
  function carousel() {
    var track = document.querySelector(".fia-trainers");
    if (!track) return;
    var prev = document.querySelector(".fia-carousel__btn--prev");
    var next = document.querySelector(".fia-carousel__btn--next");
    function step(dir) {
      var item = track.children[0];
      var gap = parseFloat(getComputedStyle(track).columnGap || "20") || 20;
      var w = item ? item.getBoundingClientRect().width + gap : 280;
      track.scrollBy({ left: dir * w, behavior: "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
  }

  function run() {
    try { carousel(); } catch (e) {}
  }
  if (document.readyState !== "loading") { runFade(); setTimeout(run, 500); }
  document.addEventListener("DOMContentLoaded", function () { runFade(); setTimeout(run, 500); });
  window.addEventListener("load", function () { setTimeout(run, 900); });

  /* ---------- Filet : au premier scroll, la mise en page est prête ----------
     Déféré via requestIdleCallback (repli setTimeout(0)) plutôt que synchrone
     dans le handler de scroll — root-causé comme source de jank au moment
     précis où l'utilisateur enclenche le geste. */
  var onScroll = function () {
    window.removeEventListener("scroll", onScroll);
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 500 });
    else setTimeout(run, 0);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
})();
