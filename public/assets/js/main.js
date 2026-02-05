(() => {
  // Year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Mobile nav
  const btn = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  }
})();
// ===== Nav dropdown: "More" =====
window.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".nav-dropdown");
  if (!dropdown) return;

  const btn = dropdown.querySelector("button");
  const menu = dropdown.querySelector(".nav-menu");

  function close() {
    dropdown.classList.remove("is-open");
    btn?.setAttribute("aria-expanded", "false");
  }

  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  menu?.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
});
