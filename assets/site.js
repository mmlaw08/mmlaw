// Mobile menu + consultation form (static site: sends via the visitor's email app or WhatsApp)
(function () {
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("mnav");
  if (btn && panel) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
  }

  function compose(form) {
    var get = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ""; };
    var lines = [];
    var labels = form.querySelectorAll("label");
    ["name", "phone", "area", "message"].forEach(function (n, i) {
      var v = get(n);
      if (!v) return;
      var label = labels[i] ? labels[i].childNodes[0].textContent.trim() : n;
      lines.push(label + ": " + v);
    });
    lines.push("", location.href);
    return lines.join("\n");
  }

  document.querySelectorAll("form[data-consult]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var href = "mailto:" + form.dataset.email +
        "?subject=" + encodeURIComponent(form.dataset.subject) +
        "&body=" + encodeURIComponent(compose(form));
      window.location.href = href;
      var status = form.querySelector(".cf-status");
      if (status) status.hidden = false;
    });
    var wa = form.querySelector("[data-wa-link]");
    if (wa) {
      wa.addEventListener("click", function () {
        var text = compose(form);
        wa.href = form.dataset.wa + "?text=" + encodeURIComponent(text);
      });
    }
  });
})();
