// public/assets/js/history-anim.js
(function () {
  const shell = document.querySelector(".history-shell");
  if (!shell) return;

  // Opening animation
  window.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.add("history-opening");
    setTimeout(() => {
      document.documentElement.classList.remove("history-opening");
      document.documentElement.classList.add("history-open");
    }, 900);
  });

  // Closing animation for internal links
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    const href = a.getAttribute("href") || "";
    const isSameTab = !a.target || a.target === "_self";
    const isHash = href.startsWith("#");
    const isExternal = /^https?:\/\//i.test(href);

    if (!isSameTab || isHash || isExternal) return;

    e.preventDefault();
    document.documentElement.classList.add("history-closing");

    setTimeout(() => {
      window.location.href = href;
    }, 420);
  });
})();
