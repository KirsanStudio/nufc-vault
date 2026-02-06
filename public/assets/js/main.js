// public/assets/js/main.js
document.addEventListener("DOMContentLoaded", () => {
  // Mobile hamburger nav
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  if (toggle && nav) {
    // force closed on load
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("is-open", !isOpen);
    });

    // Close menu when clicking a link (mobile)
    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });

    // Close menu when tapping outside (mobile)
    document.addEventListener("click", (e) => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      const clickedInside = nav.contains(e.target) || toggle.contains(e.target);
      if (!clickedInside) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });

    // ESC closes menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});
