// assets/js/main.js

function closeAllDropdowns(nav) {
  nav.querySelectorAll(".nav-dropbtn[aria-expanded='true']").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
}

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  // Ensure initial closed state on load (mobile)
  toggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");

  // Toggle mobile menu
  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);

    // If closing the menu, also close any dropdowns
    if (isOpen) closeAllDropdowns(nav);
  });

  // Close menu when tapping a normal nav link (mobile-friendly)
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    // If you clicked inside the dropdown list, that's still a normal link -> close
    const menuIsOpen = toggle.getAttribute("aria-expanded") === "true";
    if (menuIsOpen) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      closeAllDropdowns(nav);
    }
  });

  // Close when tapping outside the nav (mobile + desktop)
  document.addEventListener("click", (e) => {
    const menuIsOpen = toggle.getAttribute("aria-expanded") === "true";
    if (!menuIsOpen) return;

    const clickedInside = nav.contains(e.target) || toggle.contains(e.target);
    if (!clickedInside) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      closeAllDropdowns(nav);
    }
  });

  // Dropdown toggle (More ▾)
  nav.querySelectorAll(".nav-dropbtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // don’t trigger the nav close
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
    });
  });

  // If you rotate phone / resize to desktop, reset menu state neatly
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 861px)").matches) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      closeAllDropdowns(nav);
    }
  });
}

function setupYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupYear();
});
