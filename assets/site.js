// Theme toggle, mobile menu, call popup and form sending.
(function () {
  var root = document.documentElement;

  // ---------- theme: follows the system until the visitor picks one (saved in localStorage)
  var darkMq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function currentTheme() {
    return root.getAttribute("data-theme") || (darkMq && darkMq.matches ? "dark" : "light");
  }
  function paintMeta() {
    var color = currentTheme() === "dark" ? "#1c1917" : "#ffffff";
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
      var a = ev.target.closest('a[href^="tel:"], [data-sheet]');
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
      // open upward when there isn't enough room below (like shadcn)
      var r = btn.getBoundingClientRect(), need = Math.min(list.scrollHeight, 288) + 12;
      wrap.classList.toggle("up", window.innerHeight - r.bottom < need && r.top > window.innerHeight - r.bottom);
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
    hide();
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
    b.addEventListener("click", function () { show(); var f = box.querySelector("button"); if (f) f.focus(); });
  });
  // slide in / slide out (the CSS animation restarts every time the box is shown)
  function show() { box.classList.remove("ck-out"); box.hidden = false; }
  function hide() {
    if (box.hidden) return;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { box.hidden = true; return; }
    box.classList.add("ck-out");
    setTimeout(function () { box.hidden = true; box.classList.remove("ck-out"); }, 260);
  }
  if (!get()) setTimeout(show, 600);
})();

// ---------- search (⌘K): searches all three languages; the indexes load the first time the box opens
(function () {
  var dlg = document.getElementById("cmd");
  if (!dlg || typeof dlg.showModal !== "function") return;
  var root = document.documentElement;
  var input = dlg.querySelector("input"), list = dlg.querySelector(".cmd-list"), empty = dlg.querySelector(".cmd-empty");
  var cur = dlg.getAttribute("data-lang"), LANGS = ["ka", "en", "ru"];
  var idx = {}, loading = {}, opts = [], active = 0;
  var WA = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';

  // Georgian and Russian written in Latin letters ("advokati", "vnzh") -> one simple Latin form for comparing
  var GEO = { "ა": "a", "ბ": "b", "გ": "g", "დ": "d", "ე": "e", "ვ": "v", "ზ": "z", "თ": "t", "ი": "i", "კ": "k", "ლ": "l", "მ": "m", "ნ": "n", "ო": "o", "პ": "p", "ჟ": "zh", "რ": "r", "ს": "s", "ტ": "t", "უ": "u", "ფ": "p", "ქ": "k", "ღ": "gh", "ყ": "k", "შ": "sh", "ჩ": "ch", "ც": "ts", "ძ": "dz", "წ": "ts", "ჭ": "ch", "ხ": "kh", "ჯ": "j", "ჰ": "h" };
  var CYR = { "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z", "и": "i", "й": "i", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "i", "ь": "", "э": "e", "ю": "iu", "я": "ia" };
  function fold(s) {
    return s.replace(/['’`ʼ]/g, "").replace(/x/g, "kh").replace(/q/g, "k").replace(/w/g, "v").replace(/y/g, "i").replace(/c(?!h)/g, "ts").replace(/ph/g, "p");
  }
  function latin(s) {
    return fold(s.replace(/[ა-ჰа-яё]/g, function (c) { return GEO[c] !== undefined ? GEO[c] : (CYR[c] !== undefined ? CYR[c] : c); }));
  }
  function norm(s) { return (s || "").toLowerCase().replace(/[«»„“"'.,:;!?()—–\-\/]+/g, " "); }

  function load(lang) {
    if (loading[lang]) return loading[lang];
    loading[lang] = fetch(dlg.getAttribute("data-src").replace("{lang}", lang)).then(function (r) { return r.json(); }).then(function (j) {
      j.items.forEach(function (it) {
        it._t = norm(it.t); it._d = norm(it.d); it._k = norm(it.k); it._w = norm(it.w);
        it._lt = latin(it._t); it._ld = latin(it._d); it._lk = latin(it._k);
        it._lang = lang;
      });
      idx[lang] = j;
      if (dlg.open) render();
    }).catch(function () { loading[lang] = null; });
    return loading[lang];
  }
  function ico(data, name) {
    if (name === "wa") return WA;
    var p = data.icons[name] || data.icons.help || "";
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function stems(w) {
    var f = [w];
    if (w.length >= 5) f.push(w.slice(0, -1));
    if (w.length >= 7) f.push(w.slice(0, -2));
    return f;
  }
  function find(it, x, a, b, c) {
    var p = it[a].indexOf(x);
    if (p > -1) return p === 0 || it[a].charAt(p - 1) === " " ? 12 : 9;
    if (a === "_t" && it._w && it._w.indexOf(x) > -1) return 8;
    if (it[b].indexOf(x) > -1) return 4;
    if (it[c].indexOf(x) > -1) return 1;
    return 0;
  }
  function score(data, it, toks, q, loose) {
    var s = 0, found = 0;
    for (var i = 0; i < toks.length; i++) {
      var w = toks[i], hit = 0, forms = stems(w), nOwn = forms.length;
      // synonyms: "ფასი" also finds "ღირს", "уволили" finds "увольнение", "scam" finds "fraud"
      Object.keys(data.syn || {}).forEach(function (key) {
        // only when the word is that word with an ending ("ბინა", "ბინის"), not a longer word ("ბინადრობა")
        if ((w.indexOf(key) === 0 && w.length <= key.length + 4) || (w.length >= 3 && key.indexOf(w) === 0)) forms = forms.concat(data.syn[key]);
      });
      for (var f = 0; f < forms.length && !hit; f++) {
        hit = find(it, forms[f], "_t", "_d", "_k");
        if (hit && f) hit -= f >= nOwn ? 1.5 : 0.5;
      }
      // typed in Latin letters: compare with the Latin form of Georgian / Russian text
      if (!hit && /^[a-z0-9'’]+$/.test(w) && w.length >= 3 && it._lang !== "en") {
        var lf = stems(fold(w));
        for (var g = 0; g < lf.length && !hit; g++) {
          hit = find(it, lf[g], "_lt", "_ld", "_lk");
          if (hit) hit -= 1 + g * 0.5;
        }
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
  function search(lang, toks, q) {
    var data = idx[lang];
    if (!data) return [];
    var strict = data.items.filter(function (it) { return it.g !== "act" && score(data, it, toks, q) > 0; }).length;
    var loose = toks.length > 1 && strict < 3, seen = {};
    return data.items.map(function (it) { return { it: it, s: it.g === "act" ? 0 : score(data, it, toks, q, loose) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (r) { return r.it; })
      .filter(function (it) { var k = it.g + "|" + it._t; if (seen[k]) return false; seen[k] = 1; return true; });
  }
  function item(it, n) {
    var data = idx[it._lang];
    var ext = it.u.indexOf("http") === 0;
    return '<a class="cmd-item" role="option" id="cmd-o' + n + '" data-i="' + n + '" href="' + esc(it.u) + '"' +
      (ext ? ' target="_blank" rel="noopener"' : "") + (it.s ? " data-sheet" : "") + (it._lang !== cur ? ' hreflang="' + it._lang + '"' : "") + ">" +
      '<span class="cmd-ic' + (it.c ? " cmd-ic-" + it.c : "") + '">' + ico(data, it.i) + '</span><span class="cmd-tx"><span class="cmd-t">' + esc(it.t) + "</span>" +
      (it.d ? '<span class="cmd-d">' + esc(it.d) + "</span>" : "") + "</span>" +
      (it._lang !== cur ? '<span class="cmd-lang">' + it._lang.toUpperCase() + "</span>" : "") + "</a>";
  }
  function render() {
    var main = idx[cur];
    if (!main) {   // index still loading: skeleton rows
      var sk = '<div class="cmd-skel" aria-hidden="true">';
      for (var i = 0; i < 6; i++) sk += '<div class="cmd-sk-row"><span class="sk sk-ic"></span><span class="sk-tx"><span class="sk sk-t" style="width:' + (55 + (i * 17) % 35) + '%"></span><span class="sk sk-d" style="width:' + (35 + (i * 23) % 40) + '%"></span></span></div>';
      list.innerHTML = sk + "</div>"; empty.hidden = true; return;
    }
    var q = norm(input.value).trim(), toks = q.split(/\s+/).filter(Boolean);
    var groups = [];   // [label, items]
    if (!toks.length) {
      var feat = main.items.filter(function (it) { return it.f; }).sort(function (a, b) { return (a.g === "act" ? 0 : a.f) - (b.g === "act" ? 0 : b.f); });
      ["act", "page"].forEach(function (g) { groups.push([main.labels[g], feat.filter(function (it) { return it.g === g; })]); });
    } else {
      // the alphabet typed decides which language comes first
      var first = /[Ⴀ-ჿ]/.test(q) ? "ka" : /[Ѐ-ӿ]/.test(q) ? "ru" : cur;
      var order = [first].concat(LANGS.filter(function (l) { return l !== first; }));
      if (order.indexOf(cur) > 0) { order.splice(order.indexOf(cur), 1); order.splice(1, 0, cur); }
      var shown = 0;
      order.forEach(function (lang, k) {
        var rows = search(lang, toks, q);
        if (!rows.length) return;
        if (lang === cur) {
          var per = {}, gorder = [];
          rows = rows.filter(function (it) { per[it.g] = (per[it.g] || 0) + 1; return per[it.g] <= (it.g === "faq" ? 5 : 6); });
          rows.forEach(function (it) { if (gorder.indexOf(it.g) < 0) gorder.push(it.g); });
          gorder.forEach(function (g) { groups.push([main.labels[g], rows.filter(function (it) { return it.g === g; })]); });
        } else {
          // other languages: a short list, longer when nothing matched in this language
          var take = k === 0 || !shown ? 6 : 3;
          groups.push([main.langs[lang], rows.slice(0, take)]);
        }
        shown += rows.length;
      });
    }
    var html = "", n = 0;
    opts = [];
    groups.forEach(function (gr) {
      if (!gr[1].length) return;
      html += '<div class="cmd-group" role="presentation"><p class="cmd-gh">' + esc(gr[0] || "") + "</p>";
      gr[1].forEach(function (it) { opts.push(it); html += item(it, n++); });
      html += "</div>";
    });
    list.innerHTML = html;
    empty.hidden = n > 0 || !toks.length;
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
    // this language first, the other two right after
    load(cur).then(function () { LANGS.forEach(function (l) { if (l !== cur) load(l); }); });
    render();
  }
  dlg.addEventListener("close", function () { root.classList.remove("sheet-open"); });
  dlg.addEventListener("click", function (ev) {
    if (ev.target === dlg || ev.target.closest("[data-cmd-close]")) dlg.close();
    else if (ev.target.closest(".cmd-item")) setTimeout(function () { if (dlg.open) dlg.close(); }, 0);
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

// ---------- phones: no hover, so each practice icon plays its animation once when its card scrolls into view
(function () {
  if (!window.IntersectionObserver || !window.matchMedia) return;
  if (!matchMedia("(hover: none)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var card = en.target;
      io.unobserve(card);
      card.classList.add("ai-play");
      setTimeout(function () { card.classList.remove("ai-play"); }, 1400);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".svc-card:not(.more-card), .post-card").forEach(function (c) {
    if (c.querySelector(".ai")) io.observe(c);
  });
})();

// language dropdown in the phone header: close when tapping elsewhere
document.addEventListener("click", function (ev) {
  document.querySelectorAll(".lang-dd[open]").forEach(function (d) { if (!d.contains(ev.target)) d.removeAttribute("open"); });
});
