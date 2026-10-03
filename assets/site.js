// Theme toggle, mobile menu, call popup and form sending.
(function () {
  var root = document.documentElement;

  // ---------- theme: follows the system until the visitor picks one (saved in localStorage)
  var darkMq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function currentTheme() {
    return root.getAttribute("data-theme") || (darkMq && darkMq.matches ? "dark" : "light");
  }
  function paintMeta() {
    var color = currentTheme() === "dark" ? "#09090b" : "#ffffff";
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      if (root.getAttribute("data-theme")) m.setAttribute("content", color);
    });
  }
  paintMeta();
  document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paintMeta();
    });
  });

  // ---------- mobile menu
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("mnav");
  function setMenu(open) {
    var hdr = document.querySelector(".hdr");
    if (open && hdr) panel.style.top = Math.max(0, hdr.getBoundingClientRect().bottom) + "px";
    btn.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    root.classList.toggle("menu-open", open);
  }
  if (btn && panel) {
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    panel.addEventListener("click", function (ev) { if (ev.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !panel.hidden) { setMenu(false); btn.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 900 && !panel.hidden) setMenu(false); });
  }

  // Bottom bar "Consultation" jumps to the form when the page has one
  if (document.getElementById("consult")) {
    document.querySelectorAll("[data-consult-link]").forEach(function (a) { a.setAttribute("href", "#consult"); });
  }

  // ---------- call popup: every phone link opens a choice of call / WhatsApp / call-back request
  var sheet = document.getElementById("call-sheet");
  if (sheet && typeof sheet.showModal === "function") {
    var opts = sheet.querySelector("[data-sheet-opts]");
    var cb = sheet.querySelector("[data-callback]");
    var showForm = function (on) {
      opts.hidden = on;
      cb.hidden = !on;
      if (on) { var f = cb.querySelector("input[name=name]"); if (f) f.focus(); }
    };
    var openSheet = function () {
      if (panel && !panel.hidden) setMenu(false);
      showForm(false);
      sheet.showModal();
      root.classList.add("sheet-open");
    };
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest('a[href^="tel:"]');
      if (!a || a.hasAttribute("data-direct")) return;
      ev.preventDefault();
      openSheet();
    });
    sheet.addEventListener("close", function () { root.classList.remove("sheet-open"); });
    sheet.addEventListener("click", function (ev) {
      if (ev.target === sheet || ev.target.closest("[data-sheet-close]")) sheet.close();
      else if (ev.target.closest("[data-sheet-req]")) showForm(true);
      else if (ev.target.closest("[data-sheet-back]")) showForm(false);
    });
  }

  // ---------- forms: send to the firm's inbox (FormSubmit); fall back to email app / WhatsApp
  function fields(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name && el.type !== "submit") data[el.name] = el.value.trim();
    });
    return data;
  }
  function summary(form) {
    var lines = [];
    form.querySelectorAll("label").forEach(function (label) {
      var el = label.querySelector("input, select, textarea");
      if (el && el.value.trim()) lines.push(label.childNodes[0].textContent.trim() + ": " + el.value.trim());
    });
    lines.push("", location.href);
    return lines.join("\n");
  }
  function status(form, text, kind) {
    var el = form.querySelector(".cf-status");
    if (!el) return;
    el.textContent = text;
    el.className = "cf-status" + (kind ? " is-" + kind : "");
    el.hidden = false;
  }

  document.querySelectorAll("form[data-consult], form[data-callback]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var data = fields(form);
      if (data._honey) return; // bot
      var submit = form.querySelector('button[type="submit"]');
      data._subject = form.dataset.subject;
      data._template = "table";
      data._captcha = "false";
      data.page = location.href;
      data.language = root.lang;
      submit.disabled = true;
      status(form, form.dataset.sending, "");
      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (String(res.success) !== "true") throw new Error(res.message || "failed");
        status(form, form.dataset.ok, "ok");
        form.reset();
      }).catch(function () {
        status(form, form.dataset.err, "err");
        // last resort: open the visitor's email app with the message ready
        window.location.href = "mailto:" + form.dataset.email + "?subject=" +
          encodeURIComponent(form.dataset.subject) + "&body=" + encodeURIComponent(summary(form));
      }).then(function () { submit.disabled = false; });
    });
    var wa = form.querySelector("[data-wa-link]");
    if (wa) wa.addEventListener("click", function () {
      wa.href = form.dataset.wa + "?text=" + encodeURIComponent(summary(form));
    });
  });
})();
