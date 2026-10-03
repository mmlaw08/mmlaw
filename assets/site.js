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

  // Services mega menu: Esc closes it for keyboard users
  document.addEventListener("keydown", function (ev) {
    var dd = document.activeElement && document.activeElement.closest(".nav-dd");
    if (ev.key === "Escape" && dd) { var t = dd.querySelector("a"); t.focus(); t.blur(); }
  });

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

  // ---------- validation
  var LOADED = Date.now();
  var NAME_RE = /^[\p{L}][\p{L}\p{M}' .\-]*$/u;

  // Returns the phone as +<digits>, or null if it isn't a plausible number.
  function normalizePhone(raw) {
    var v = raw.replace(/[\s\-().\/]/g, "");
    if (/^\+\d{8,15}$/.test(v)) return v;
    if (/^00\d{8,15}$/.test(v)) return "+" + v.slice(2);
    if (/^995\d{9}$/.test(v)) return "+" + v;
    if (/^0?[345]\d{8}$/.test(v)) return "+995" + v.replace(/^0/, "");
    if (/^\d{10,15}$/.test(v)) return "+" + v; // international number typed without "+"
    return null;
  }

  function fieldError(form, el, msg) {
    var label = el.closest("label") || el.parentNode;
    var box = label.querySelector(".f-err");
    if (!box) {
      box = document.createElement("span");
      box.className = "f-err";
      box.id = "err-" + Math.random().toString(36).slice(2, 9);
      box.setAttribute("aria-live", "polite");
      label.appendChild(box);
    }
    if (msg) {
      box.textContent = msg;
      box.hidden = false;
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", box.id);
    } else {
      box.textContent = "";
      box.hidden = true;
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
    }
    return !msg;
  }

  function checkField(form, el) {
    var v = el.value.trim();
    var ds = form.dataset;
    if (el.name === "name") {
      if (!v) return fieldError(form, el, ds.vName);
      var letters = (v.match(/\p{L}/gu) || []).length;
      if (letters < 2 || v.length > 80 || !NAME_RE.test(v)) return fieldError(form, el, ds.vNameBad);
      return fieldError(form, el, "");
    }
    if (el.name === "phone") {
      return fieldError(form, el, normalizePhone(v) ? "" : ds.vPhone);
    }
    if (el.name === "message") {
      return fieldError(form, el, v.length > 2000 ? ds.vMsg : "");
    }
    return true;
  }

  function validate(form) {
    var first = null;
    form.querySelectorAll("input[name=name], input[name=phone], textarea[name=message]").forEach(function (el) {
      if (!checkField(form, el) && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }

  document.querySelectorAll("form[data-consult], form[data-callback]").forEach(function (form) {
    var tried = false;
    form.querySelectorAll("input[name=name], input[name=phone], textarea[name=message]").forEach(function (el) {
      el.addEventListener("blur", function () { if (tried || el.value.trim()) checkField(form, el); });
      el.addEventListener("input", function () { if (tried || el.hasAttribute("aria-invalid")) checkField(form, el); });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      tried = true;
      if (!validate(form)) return;
      var data = fields(form);
      if (data._honey || Date.now() - LOADED < 3000) { status(form, form.dataset.ok, "ok"); return; } // bot
      var last = Number(form.dataset.sentAt || 0);
      if (Date.now() - last < 30000) { status(form, form.dataset.vWait, "err"); return; }
      var submit = form.querySelector('button[type="submit"]');
      data.phone = normalizePhone(data.phone);
      data.name = data.name.replace(/\s+/g, " ");
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
        form.dataset.sentAt = String(Date.now());
        status(form, form.dataset.ok, "ok");
        form.reset();
        tried = false;
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
