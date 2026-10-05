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

  // Services mega menu: open on hover with a short grace period when the pointer leaves
  document.querySelectorAll(".nav-dd").forEach(function (dd) {
    var timer;
    dd.addEventListener("mouseenter", function () { clearTimeout(timer); dd.classList.add("open"); });
    dd.addEventListener("mouseleave", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { dd.classList.remove("open"); }, 280);
    });
    dd.addEventListener("click", function (ev) { if (ev.target.closest(".mega a")) dd.classList.remove("open"); });
  });

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

  // ---------- modern select (keeps the native <select> underneath for the form value)
  var CHEV = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>';
  var TICK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var selN = 0;
  function enhanceSelect(sel) {
    var id = "sel-" + (++selN);
    var wrap = document.createElement("div");
    wrap.className = "sel";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sel-trigger";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", id);
    btn.innerHTML = '<span class="sel-value"></span>' + CHEV;
    var list = document.createElement("ul");
    list.className = "sel-list";
    list.id = id;
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;
    list.hidden = true;
    Array.prototype.forEach.call(sel.options, function (o, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.id = id + "-" + i;
      li.dataset.index = i;
      li.innerHTML = '<span>' + o.text.replace(/</g, "&lt;") + '</span>' + TICK;
      list.appendChild(li);
    });
    wrap.appendChild(btn);
    wrap.appendChild(list);
    sel.parentNode.insertBefore(wrap, sel);   // button comes first, so the <label> targets it
    sel.classList.add("sel-native");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");
    var active = 0;

    function sync() {
      btn.querySelector(".sel-value").textContent = sel.options[sel.selectedIndex].text;
      list.querySelectorAll("[role=option]").forEach(function (li, i) {
        li.setAttribute("aria-selected", String(i === sel.selectedIndex));
      });
    }
    function highlight(i) {
      var items = list.querySelectorAll("[role=option]");
      active = (i + items.length) % items.length;
      items.forEach(function (li, j) { li.classList.toggle("is-active", j === active); });
      list.setAttribute("aria-activedescendant", items[active].id);
      items[active].scrollIntoView({ block: "nearest" });
    }
    function open() {
      if (!list.hidden) return;
      list.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      wrap.classList.add("open");
      highlight(sel.selectedIndex);
      list.focus();
    }
    function close(focusBtn) {
      if (list.hidden) return;
      list.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      wrap.classList.remove("open");
      if (focusBtn) btn.focus();
    }
    function choose(i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      sync();
      close(true);
    }
    var typed = "", typedAt = 0;
    btn.addEventListener("click", function () { list.hidden ? open() : close(true); });
    btn.addEventListener("keydown", function (ev) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].indexOf(ev.key) > -1) { ev.preventDefault(); open(); }
    });
    list.addEventListener("keydown", function (ev) {
      var n = sel.options.length;
      if (ev.key === "ArrowDown") { ev.preventDefault(); highlight(active + 1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); highlight(active - 1); }
      else if (ev.key === "Home") { ev.preventDefault(); highlight(0); }
      else if (ev.key === "End") { ev.preventDefault(); highlight(n - 1); }
      else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); choose(active); }
      else if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(true); }
      else if (ev.key === "Tab") { close(false); }
      else if (ev.key.length === 1) {               // type to jump
        var now = Date.now();
        typed = (now - typedAt > 700 ? "" : typed) + ev.key.toLowerCase();
        typedAt = now;
        for (var k = 0; k < n; k++) {
          if (sel.options[k].text.toLowerCase().indexOf(typed) === 0) { highlight(k); break; }
        }
      }
    });
    list.addEventListener("mousemove", function (ev) {
      var li = ev.target.closest("[role=option]");
      if (li) highlight(Number(li.dataset.index));
    });
    list.addEventListener("click", function (ev) {
      ev.preventDefault(); // the list sits inside a <label>: don't let the click re-activate the trigger
      var li = ev.target.closest("[role=option]");
      if (li) choose(Number(li.dataset.index));
    });
    document.addEventListener("click", function (ev) { if (!wrap.contains(ev.target)) close(false); });
    if (sel.form) sel.form.addEventListener("reset", function () { setTimeout(sync, 0); });
    sync();
  }
  document.querySelectorAll("form select").forEach(enhanceSelect);

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

  // Block characters that can't belong in the field (typing and pasting), keeping the cursor in place
  var CLEAN = {
    name: function (v) { return v.replace(/[^\p{L}\p{M}' .\-]/gu, ""); },
    phone: function (v) {
      v = v.replace(/[^\d+()\-\s]/g, "").replace(/^\s+/, "");
      return v.charAt(0) + v.slice(1).replace(/\+/g, ""); // a single "+" and only at the start
    }
  };
  function filterField(el) {
    var clean = CLEAN[el.name](el.value);
    if (clean === el.value) return;
    var pos = el.selectionStart - (el.value.length - clean.length);
    el.value = clean;
    try { el.setSelectionRange(Math.max(0, pos), Math.max(0, pos)); } catch (e) {}
  }

  document.querySelectorAll("form[data-consult], form[data-callback]").forEach(function (form) {
    var tried = false;
    form.querySelectorAll("input[name=name], input[name=phone]").forEach(function (el) {
      el.addEventListener("input", function () { filterField(el); });
    });
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

// ---------- cookie consent (Google Analytics loads only after "Accept")
(function () {
  var box = document.getElementById("ck");
  if (!box) return;
  function get() { try { return localStorage.getItem("consent"); } catch (e) { return null; } }
  function clearGa() {
    var host = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim();
      if (n === "_ga" || n.indexOf("_ga_") === 0 || n === "_gid") {
        ["", "; domain=" + host, "; domain=." + host].forEach(function (d) {
          document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
        });
      }
    });
  }
  function choose(v) {
    try { localStorage.setItem("consent", v); } catch (e) {}
    box.hidden = true;
    if (v === "granted") { if (window.mmGA) window.mmGA(); }
    else {
      if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
      clearGa();
      if (window.mmGAon) location.reload();
    }
  }
  box.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-ck]");
    if (b) choose(b.getAttribute("data-ck"));
  });
  document.querySelectorAll("[data-ck-open]").forEach(function (b) {
    b.addEventListener("click", function () { box.hidden = false; var f = box.querySelector("button"); if (f) f.focus(); });
  });
  if (!get()) box.hidden = false;
})();

// ---------- search (⌘K): the index loads the first time the box opens
(function () {
  var dlg = document.getElementById("cmd");
  if (!dlg || typeof dlg.showModal !== "function") return;
  var input = dlg.querySelector("input"), list = dlg.querySelector(".cmd-list"), empty = dlg.querySelector(".cmd-empty");
  var data = null, loading = null, opts = [], active = 0;
  var WA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm5.8 14.08c-.24.68-1.42 1.31-1.96 1.36-.5.05-.98.23-3.3-.69-2.8-1.1-4.58-3.96-4.72-4.15-.13-.18-1.12-1.49-1.12-2.85 0-1.35.71-2.02.96-2.3.25-.27.55-.34.73-.34h.53c.17 0 .4-.07.62.47.24.56.8 1.93.87 2.07.07.14.12.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.28.14.44.11.6-.07.16-.18.69-.8.87-1.08.18-.27.37-.23.62-.14.25.09 1.6.75 1.87.89.28.14.46.2.53.32.07.12.07.68-.17 1.36Z"/></svg>';

  function norm(s) { return (s || "").toLowerCase().replace(/[«»„“"'.,:;!?()—–\-]+/g, " "); }
  function load() {
    if (loading) return loading;
    loading = fetch(dlg.getAttribute("data-src")).then(function (r) { return r.json(); }).then(function (j) {
      j.items.forEach(function (it) { it._t = norm(it.t); it._d = norm(it.d); it._k = norm(it.k); });
      data = j; render();
    }).catch(function () { loading = null; });
    return loading;
  }
  function ico(name) {
    if (name === "wa") return WA;
    var p = data.icons[name] || data.icons.help;
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function score(it, toks, q, loose) {
    var s = 0, found = 0;
    for (var i = 0; i < toks.length; i++) {
      var w = toks[i], hit = 0;
      // Georgian and Russian words change their endings: also try the word without its last letters
      var forms = [w];
      if (w.length >= 5) forms.push(w.slice(0, -1));
      if (w.length >= 7) forms.push(w.slice(0, -2));
      for (var f = 0; f < forms.length && !hit; f++) {
        var x = forms[f];
        if (it._t.indexOf(x) > -1) hit = it._t.indexOf(x) === 0 || it._t.indexOf(" " + x) > -1 ? 12 : 9;
        else if (it._d.indexOf(x) > -1) hit = 4;
        else if (it._k.indexOf(x) > -1) hit = 1;
        if (hit && f) hit -= 0.5;
      }
      if (!hit) { if (loose) continue; return 0; }
      s += hit; found++;
    }
    if (!found) return 0;
    if (loose) s = s * found / toks.length;
    if (it._t.indexOf(q) > -1) s += 15;
    if (it.g === "svc" || it.g === "for") s += 1;
    return s;
  }
  function render() {
    if (!data) { list.innerHTML = ""; return; }
    var q = norm(input.value).trim(), toks = q.split(/\s+/).filter(Boolean), rows;
    if (!toks.length) {
      rows = data.items.filter(function (it) { return it.f; }).sort(function (a, b) { return (a.g === "act" ? 0 : a.f) - (b.g === "act" ? 0 : b.f); });
    } else {
      var loose = toks.length > 1 && data.items.filter(function (it) { return score(it, toks, q) > 0; }).length < 3;
      rows = data.items.map(function (it) { return { it: it, s: score(it, toks, q, loose) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .map(function (r) { return r.it; });
      var per = {};
      rows = rows.filter(function (it) { per[it.g] = (per[it.g] || 0) + 1; return per[it.g] <= (it.g === "faq" ? 5 : 6); });
    }
    var order = toks.length ? [] : ["act", "page"];
    rows.forEach(function (it) { if (order.indexOf(it.g) < 0) order.push(it.g); });
    var html = "", n = 0;
    opts = [];
    order.forEach(function (g) {
      var grp = rows.filter(function (it) { return it.g === g; });
      if (!grp.length) return;
      html += '<div class="cmd-group" role="presentation"><p class="cmd-gh">' + esc(data.labels[g] || "") + "</p>";
      grp.forEach(function (it) {
        opts.push(it);
        html += '<a class="cmd-item" role="option" id="cmd-o' + n + '" data-i="' + n + '" href="' + esc(it.u) + '"' +
          (it.u.indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : "") + ">" +
          '<span class="cmd-ic">' + ico(it.i) + '</span><span class="cmd-tx"><span class="cmd-t">' + esc(it.t) + "</span>" +
          (it.d ? '<span class="cmd-d">' + esc(it.d) + "</span>" : "") + "</span></a>";
        n++;
      });
      html += "</div>";
    });
    list.innerHTML = html;
    empty.hidden = n > 0;
    setActive(0, false);
  }
  function setActive(i, scroll) {
    if (!opts.length) { input.removeAttribute("aria-activedescendant"); return; }
    active = (i + opts.length) % opts.length;
    list.querySelectorAll(".cmd-item").forEach(function (el, k) { el.setAttribute("aria-selected", String(k === active)); });
    input.setAttribute("aria-activedescendant", "cmd-o" + active);
    if (scroll !== false) { var el = document.getElementById("cmd-o" + active); if (el) el.scrollIntoView({ block: "nearest" }); }
  }
  function open() {
    if (dlg.open) return;
    var menu = document.querySelector('.menu-btn[aria-expanded="true"]');
    if (menu) menu.click();
    input.value = "";
    dlg.showModal();
    root.classList.add("sheet-open");
    input.focus();
    if (data) render(); else load();
  }
  var root = document.documentElement;
  dlg.addEventListener("close", function () { root.classList.remove("sheet-open"); });
  dlg.addEventListener("click", function (ev) {
    if (ev.target === dlg || ev.target.closest("[data-cmd-close]")) dlg.close();
    else if (ev.target.closest(".cmd-item")) setTimeout(function () { dlg.close(); }, 0);
  });
  list.addEventListener("mousemove", function (ev) {
    var a = ev.target.closest(".cmd-item");
    if (a && +a.getAttribute("data-i") !== active) setActive(+a.getAttribute("data-i"), false);
  });
  input.addEventListener("input", render);
  input.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowDown") { ev.preventDefault(); setActive(active + 1); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setActive(active - 1); }
    else if (ev.key === "Enter") {
      ev.preventDefault();
      var el = document.getElementById("cmd-o" + active);
      if (el) el.click();
    }
  });
  document.querySelectorAll("[data-cmd-open]").forEach(function (b) { b.addEventListener("click", open); });
  document.addEventListener("keydown", function (ev) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((ev.target && ev.target.tagName) || "") || (ev.target && ev.target.isContentEditable);
    if ((ev.key === "k" || ev.key === "K") && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); dlg.open ? dlg.close() : open(); }
    else if (ev.key === "/" && !typing && !dlg.open) { ev.preventDefault(); open(); }
  });
  // show Ctrl K instead of ⌘K on Windows/Linux
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    document.querySelectorAll(".cmd-trigger kbd").forEach(function (k) { k.textContent = "Ctrl K"; });
  }
})();
