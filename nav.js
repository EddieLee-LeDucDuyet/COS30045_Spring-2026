// Handles navigation + "current page" highlighting.
(function () {
  const links = document.querySelectorAll("[data-nav]");

  function setActiveLink() {
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    links.forEach(a => {
      const target = (a.getAttribute("href") || "").toLowerCase();
      const isActive = target === path;

      a.classList.toggle("active", isActive);
      if (isActive) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  function navigateTo(href) {
    // JS-driven page swap
    window.location.href = href;
  }

  links.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(a.getAttribute("href"));
    });
  });

  setActiveLink();
})();
