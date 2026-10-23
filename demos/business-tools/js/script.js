(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const cfg = window.SITE_CONFIG || {};

  /* ---------- Бегущая строка: дублируем содержимое ДО сбора переводимых элементов ---------- */
  const marquee = $("#marqueeTrack");
  if (marquee) [...marquee.children].forEach((node) => marquee.appendChild(node.cloneNode(true)));

  /* ---------- Контакты из config.js ---------- */
  const hrefs = { phone: () => `tel:${cfg.phoneLink}`, email: () => `mailto:${cfg.email}` };
  $$("[data-contact]").forEach((el) => {
    const value = cfg[el.dataset.contact];
    if (!value) return;
    if (el.dataset.i18n && value === el.textContent.trim()) return;
    el.removeAttribute("data-i18n");
    el.textContent = value;
  });
  $$("[data-contact-href]").forEach((el) => {
    const make = hrefs[el.dataset.contactHref];
    if (make) el.href = make();
  });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Языки ---------- */
  const dict = window.I18N || {};
  const textEls = $$("[data-i18n]");
  const attrEls = $$("[data-i18n-attr]");
  const parseAttrs = (el) => el.dataset.i18nAttr.split(";").map((pair) => pair.split(":"));

  const en = {};
  textEls.forEach((el) => {
    en[el.dataset.i18n] ??= el.innerHTML.trim();
  });
  attrEls.forEach((el) => {
    parseAttrs(el).forEach(([attr, key]) => {
      en[key] ??= el.getAttribute(attr);
    });
  });
  Object.assign(en, dict.en || {});
  dict.en = en;

  // Сайт всегда открывается на английском; выбор языка не запоминается.
  let lang = "en";
  const t = (key, ...args) => {
    let s = dict[lang]?.[key] ?? en[key] ?? key;
    args.forEach((a, i) => {
      s = s.split(`{${i}}`).join(a);
    });
    return s;
  };
  const decoder = document.createElement("textarea");
  const tx = (key, ...args) => {
    decoder.innerHTML = t(key, ...args);
    return decoder.value;
  };
  const onLangChange = [];

  const langBox = $("#lang");
  const langToggle = $("#langToggle");
  const langItems = $$("[data-lang]", langBox);

  const setLang = (next) => {
    lang = dict[next] ? next : "en";
    document.documentElement.lang = lang;
    textEls.forEach((el) => {
      el.innerHTML = t(el.dataset.i18n);
    });
    attrEls.forEach((el) => {
      parseAttrs(el).forEach(([attr, key]) => el.setAttribute(attr, tx(key)));
    });
    $("#langCurrent").textContent = lang.toUpperCase();
    langItems.forEach((item) => item.setAttribute("aria-checked", String(item.dataset.lang === lang)));
    syncBurgerLabel();
    onLangChange.forEach((fn) => fn());
  };

  const setLangMenu = (open) => {
    langBox.classList.toggle("is-open", open);
    langToggle.setAttribute("aria-expanded", String(open));
  };
  langToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setLangMenu(!langBox.classList.contains("is-open"));
  });
  langItems.forEach((item) =>
    item.addEventListener("click", () => {
      setLang(item.dataset.lang);
      setLangMenu(false);
      langToggle.focus();
    })
  );
  document.addEventListener("click", (e) => {
    if (!langBox.contains(e.target)) setLangMenu(false);
  });

  /* ---------- Шапка и мобильное меню ---------- */
  const header = $(".header");
  const nav = $("#nav");
  const burger = $("#burger");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function syncBurgerLabel() {
    burger.setAttribute("aria-label", tx(nav.classList.contains("is-open") ? "nav.close" : "nav.open"));
  }
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    syncBurgerLabel();
  };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    setLangMenu(false);
    setMenu(false);
  });

  if ("IntersectionObserver" in window) {
    const links = new Map($$("a[href^='#']", nav).map((a) => [a.getAttribute("href").slice(1), a]));
    const sectionObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const link = links.get(entry.target.id);
          if (link && entry.isIntersecting) {
            links.forEach((l) => l.classList.remove("is-active"));
            link.classList.add("is-active");
          }
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    links.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Появление при скролле ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Демо: заказы, статусы, письма ---------- */
  const STATUS_KEYS = ["st.new", "st.progress", "st.shipped"];
  const STATUS_CLASS = ["badge--new", "badge--progress", "badge--done"];
  const seed = () => [
    { id: 1042, name: "J. Kowalski", email: "j.kowalski@example.com", sum: 49, status: 2 },
    { id: 1041, name: "M. Nowak", email: "m.nowak@example.com", sum: 98, status: 1 },
    { id: 1040, name: "A. Schmidt", email: "a.schmidt@example.com", sum: 149, status: 0 },
    { id: 1039, name: "L. Dubois", email: "l.dubois@example.com", sum: 89, status: 2 },
  ];
  let orders = seed();
  let lastMail = null; // { id, name, email, status } — перерисовывается при смене языка
  let flashId = null;

  const rowsBox = $("#orderRows");
  const mailBox = $("#mailBox");
  const money = (n) => `€${n}`;

  const renderStats = () => {
    $("#statOrders").textContent = orders.length;
    $("#statNew").textContent = orders.filter((o) => o.status === 0).length;
    $("#statRevenue").textContent = money(orders.reduce((s, o) => s + o.sum, 0));
  };

  const renderRows = () => {
    rowsBox.textContent = "";
    orders.forEach((o) => {
      const row = document.createElement("div");
      row.className = "sheet__row";
      row.setAttribute("role", "row");
      if (o.id === flashId) row.classList.add("is-new");

      const id = document.createElement("span");
      id.textContent = `#${o.id}`;
      const cust = document.createElement("span");
      cust.className = "cust";
      cust.textContent = o.name;
      const mail = document.createElement("small");
      mail.textContent = o.email;
      cust.appendChild(mail);
      const sum = document.createElement("span");
      sum.textContent = money(o.sum);

      const cell = document.createElement("span");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `status-btn ${STATUS_CLASS[o.status]}`;
      btn.textContent = tx(STATUS_KEYS[o.status]);
      if (o.status < 2) {
        btn.addEventListener("click", () => advance(o.id));
      } else {
        btn.disabled = true;
      }
      cell.appendChild(btn);

      row.append(id, cust, sum, cell);
      rowsBox.appendChild(row);
    });
    flashId = null;
  };

  const renderMail = () => {
    if (!lastMail) {
      mailBox.hidden = true;
      return;
    }
    const first = lastMail.name.split(" ")[0];
    $("#mailTo").textContent = tx("mail.to", `${lastMail.name} <${lastMail.email}>`);
    $("#mailSubj").textContent = tx(`mail.subj.${lastMail.status}`, `#${lastMail.id}`);
    $("#mailBody").textContent = tx(`mail.body.${lastMail.status}`, first);
    mailBox.hidden = false;
    // перезапуск подсветки
    mailBox.style.animation = "none";
    void mailBox.offsetWidth;
    mailBox.style.animation = "";
  };

  const renderAll = () => {
    renderStats();
    renderRows();
    renderMail();
  };

  let toastTimer;
  const toast = (msg) => {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2800);
  };

  function advance(id) {
    const o = orders.find((x) => x.id === id);
    if (!o || o.status >= 2) return;
    o.status += 1;
    lastMail = { id: o.id, name: o.name, email: o.email, status: o.status };
    renderAll();
    toast(tx("toast.mail", o.email));
  }

  /* ---------- Форма заказа ---------- */
  const form = $("#orderForm");
  const fName = $("#fName");
  const fEmail = $("#fEmail");
  const fProduct = $("#fProduct");
  const fQty = $("#fQty");
  const fConsent = $("#fConsent");

  const qty = () => Math.min(20, Math.max(1, parseInt(fQty.value, 10) || 1));
  const price = () => Number(fProduct.selectedOptions[0].dataset.price);
  const updateTotal = () => {
    $("#orderTotal").textContent = money(price() * qty());
  };
  fProduct.addEventListener("change", updateTotal);
  fQty.addEventListener("input", updateTotal);
  fQty.addEventListener("blur", () => {
    fQty.value = qty();
    updateTotal();
  });
  $("#qtyMinus").addEventListener("click", () => {
    fQty.value = Math.max(1, qty() - 1);
    updateTotal();
  });
  $("#qtyPlus").addEventListener("click", () => {
    fQty.value = Math.min(20, qty() + 1);
    updateTotal();
  });

  const setError = (input, bad) => {
    const field = input.closest(".field");
    field.classList.toggle("is-error", bad);
    field.classList.toggle("field--ok", !bad && input.value.trim() !== "");
    input.setAttribute("aria-invalid", String(bad));
  };
  const validName = () => fName.value.trim().length >= 2;
  const validEmail = () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fEmail.value.trim());
  fName.addEventListener("blur", () => setError(fName, !validName()));
  fEmail.addEventListener("blur", () => setError(fEmail, !validEmail()));
  fName.addEventListener("input", () => fName.closest(".field").classList.contains("is-error") && setError(fName, !validName()));
  fEmail.addEventListener("input", () => fEmail.closest(".field").classList.contains("is-error") && setError(fEmail, !validEmail()));
  fConsent.addEventListener("change", () => ($("#consentErr").hidden = fConsent.checked));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const okName = validName();
    const okEmail = validEmail();
    const okConsent = fConsent.checked;
    setError(fName, !okName);
    setError(fEmail, !okEmail);
    $("#consentErr").hidden = okConsent;
    if (!okName) return fName.focus();
    if (!okEmail) return fEmail.focus();
    if (!okConsent) return fConsent.focus();

    const id = Math.max(...orders.map((o) => o.id)) + 1;
    const order = { id, name: fName.value.trim(), email: fEmail.value.trim(), sum: price() * qty(), status: 0 };
    orders.unshift(order);
    flashId = id;
    lastMail = { id, name: order.name, email: order.email, status: 0 };
    renderAll();
    toast(tx("toast.added", `#${id}`));

    form.reset();
    fQty.value = 1;
    [fName, fEmail].forEach((i) => {
      i.closest(".field").classList.remove("is-error", "field--ok");
      i.removeAttribute("aria-invalid");
    });
    updateTotal();
  });

  $("#resetDemo").addEventListener("click", () => {
    orders = seed();
    lastMail = null;
    renderAll();
  });

  onLangChange.push(() => {
    renderAll();
    updateTotal();
  });

  /* ---------- Старт ---------- */
  renderAll();
  updateTotal();
})();
