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
  const LOCALES = { en: "en-GB", pl: "pl-PL", de: "de-DE", ru: "ru-RU" };
  const locale = () => LOCALES[lang] || "en-GB";
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
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
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

  /* ---------- Тосты ---------- */
  let toastTimer;
  const toast = (msg) => {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2600);
  };

  /* ---------- Данные: услуги, мастера, оттенки ---------- */
  // id, цена €, минуты
  const SERVICES = [
    { cat: "nails", id: "n1", price: 38, min: 75 },
    { cat: "nails", id: "n2", price: 24, min: 45 },
    { cat: "nails", id: "n3", price: 52, min: 120 },
    { cat: "nails", id: "n4", price: 46, min: 80 },
    { cat: "nails", id: "n5", price: 12, min: 20 },
    { cat: "hair", id: "h1", price: 45, min: 60 },
    { cat: "hair", id: "h2", price: 85, min: 150 },
    { cat: "hair", id: "h3", price: 140, min: 180 },
    { cat: "hair", id: "h4", price: 30, min: 45 },
    { cat: "brows", id: "b1", price: 22, min: 40 },
    { cat: "brows", id: "b2", price: 38, min: 60 },
    { cat: "brows", id: "b3", price: 42, min: 60 },
    { cat: "brows", id: "b4", price: 65, min: 120 },
    { cat: "face", id: "f1", price: 58, min: 60 },
    { cat: "face", id: "f2", price: 72, min: 75 },
    { cat: "face", id: "f3", price: 48, min: 45 },
    { cat: "body", id: "m1", price: 55, min: 60 },
    { cat: "body", id: "m2", price: 35, min: 30 },
  ];
  const CATS = ["nails", "hair", "brows", "face", "body"];
  const CAT_ICON = { nails: "i-hand", hair: "i-scissors", brows: "i-eye", face: "i-face", body: "i-leaf" };
  const MASTERS = [
    { id: "any", name: null },
    { id: "anna", name: "Anna", role: "tm.1r", cls: "master__av--1" },
    { id: "marta", name: "Marta", role: "tm.2r", cls: "master__av--2" },
    { id: "julia", name: "Julia", role: "tm.3r", cls: "master__av--3" },
    { id: "elena", name: "Elena", role: "tm.4r", cls: "master__av--4" },
  ];
  const SHADES = [
    ["Rose Quartz", "#f2b8c6"], ["Cherry Kiss", "#c8244f"], ["Nude Silk", "#e8c4b0"], ["Mocha", "#9a6b55"],
    ["Lilac Dream", "#c9b0ee"], ["Berry Wine", "#7a1f45"], ["Coral Sun", "#ff8a6b"], ["Pearl", "#f4ece8"],
    ["Sage", "#a9c4a3"], ["Midnight", "#2b2150"], ["Peach Fizz", "#ffc6a5"], ["Gold Dust", "#d9b25f"],
  ];
  const svcById = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
  const eur = (n) => `€${n}`;

  /* ---------- Состояние ---------- */
  const state = { services: new Set(), master: "any", date: null, time: null, shade: 0, step: 1 };

  const totals = () => {
    let price = 0;
    let min = 0;
    state.services.forEach((id) => {
      price += svcById[id].price;
      min += svcById[id].min;
    });
    return { price, min };
  };
  const fmtDur = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (!min) return "—";
    if (!h) return tx("dur.m", m);
    return m ? tx("dur.hm", h, m) : tx("dur.h", h);
  };
  const masterName = (id) => (id === "any" ? tx("mp.any") : MASTERS.find((m) => m.id === id).name);

  /* ---------- Услуги: вкладки и карточки ---------- */
  const tabsBox = $("#svcTabs");
  const grid = $("#svcGrid");
  let activeCat = "nails";

  const renderTabs = () => {
    tabsBox.textContent = "";
    CATS.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(c === activeCat));
      const ico = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      ico.setAttribute("class", "ico");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", `#${CAT_ICON[c]}`);
      ico.appendChild(use);
      const span = document.createElement("span");
      span.textContent = tx(`cat.${c}`);
      b.append(ico, span);
      b.addEventListener("click", () => {
        activeCat = c;
        renderTabs();
        renderCards();
      });
      tabsBox.appendChild(b);
    });
  };

  const renderCards = () => {
    grid.textContent = "";
    SERVICES.filter((s) => s.cat === activeCat).forEach((s) => {
      const card = document.createElement("article");
      card.className = "svc";
      const h = document.createElement("h3");
      h.textContent = tx(`s.${s.id}`);
      const p = document.createElement("p");
      p.textContent = tx(`sd.${s.id}`);
      const meta = document.createElement("div");
      meta.className = "svc__meta";
      const price = document.createElement("span");
      price.className = "svc__price";
      price.textContent = eur(s.price);
      const time = document.createElement("span");
      time.className = "svc__time";
      time.textContent = fmtDur(s.min);
      meta.append(price, time);
      const btn = document.createElement("button");
      btn.type = "button";
      const on = state.services.has(s.id);
      btn.className = `btn btn--soft${on ? " is-added" : ""}`;
      btn.textContent = on ? tx("sv.added") : tx("sv.add");
      btn.addEventListener("click", () => {
        toggleService(s.id);
        toast(tx(state.services.has(s.id) ? "toast.added" : "toast.removed", tx(`s.${s.id}`)));
      });
      card.append(h, p, meta, btn);
      grid.appendChild(card);
    });
  };

  /* ---------- Оттенки ногтей ---------- */
  const swatchBox = $("#swatches");
  const nailVar = (hex) => $("#handArt").style.setProperty("--nail", hex);
  const renderSwatches = () => {
    swatchBox.textContent = "";
    SHADES.forEach(([name, hex], i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.style.setProperty("--c", hex);
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(i === state.shade));
      b.setAttribute("aria-label", name);
      b.title = name;
      b.addEventListener("click", () => {
        state.shade = i;
        nailVar(hex);
        $("#shadeName").textContent = name;
        $$(".swatch", swatchBox).forEach((el, k) => el.setAttribute("aria-checked", String(k === i)));
        renderSummary();
      });
      swatchBox.appendChild(b);
    });
    nailVar(SHADES[state.shade][1]);
    $("#shadeName").textContent = SHADES[state.shade][0];
  };
  $("#shadeAdd").addEventListener("click", () => {
    state.services.add("n1");
    renderAll();
    toast(tx("toast.shade", SHADES[state.shade][0]));
  });

  /* ---------- Запись: шаги ---------- */
  const steps = $$(".step");
  const stepperItems = $$("#stepper li");
  const btnPrev = $("#btnPrev");
  const btnNext = $("#btnNext");
  const btnConfirm = $("#btnConfirm");
  const form = $("#bookingForm");

  const showStep = (n) => {
    state.step = n;
    steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    stepperItems.forEach((li, i) => {
      li.classList.toggle("is-current", i + 1 === n);
      li.classList.toggle("is-done", i + 1 < n);
    });
    btnPrev.hidden = n === 1;
    btnNext.hidden = n === 4;
    btnConfirm.hidden = n !== 4;
    if (n === 2) renderMasters();
    if (n === 3) renderDates();
  };

  const toggleService = (id) => {
    if (state.services.has(id)) state.services.delete(id);
    else state.services.add(id);
    state.time = null;
    renderAll();
  };

  const pickBox = $("#svcPick");
  const renderPick = () => {
    pickBox.textContent = "";
    CATS.forEach((c) => {
      const cat = document.createElement("p");
      cat.className = "pick__cat";
      cat.textContent = tx(`cat.${c}`);
      pickBox.appendChild(cat);
      SERVICES.filter((s) => s.cat === c).forEach((s) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pick__item";
        b.setAttribute("aria-pressed", String(state.services.has(s.id)));
        const box = document.createElement("span");
        box.className = "pick__box";
        box.innerHTML = '<svg class="ico"><use href="#i-check"></use></svg>';
        const name = document.createElement("span");
        name.className = "pick__name";
        name.textContent = tx(`s.${s.id}`);
        const small = document.createElement("small");
        small.textContent = fmtDur(s.min);
        name.appendChild(small);
        const price = document.createElement("span");
        price.className = "pick__price";
        price.textContent = eur(s.price);
        b.append(box, name, price);
        b.addEventListener("click", () => {
          toggleService(s.id);
          hide("#err-services");
        });
        pickBox.appendChild(b);
      });
    });
  };

  const masterBox = $("#masterPick");
  const renderMasters = () => {
    masterBox.textContent = "";
    MASTERS.forEach((m) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mp";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(state.master === m.id));
      const av = document.createElement("span");
      av.className = `mp__av ${m.cls || ""}`;
      if (!m.name) av.style.background = "linear-gradient(135deg, #ffb35e, #e04d84)";
      av.textContent = m.name ? m.name[0] : "★";
      const nm = document.createElement("b");
      nm.textContent = m.name || tx("mp.any");
      const sm = document.createElement("small");
      sm.textContent = m.name ? tx(m.role) : tx("mp.any.d");
      b.append(av, nm, sm);
      b.addEventListener("click", () => {
        state.master = m.id;
        state.time = null;
        renderMasters();
        renderSummary();
      });
      masterBox.appendChild(b);
    });
  };

  /* ---------- Даты и время ---------- */
  const HOURS = cfg.hours || { 1: [10, 20], 2: [10, 20], 3: [10, 20], 4: [10, 20], 5: [10, 20], 6: [10, 20] };
  const pad = (n) => String(n).padStart(2, "0");
  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmt = (opts) => new Intl.DateTimeFormat(locale(), opts);
  // Простой детерминированный «случайный» признак занятости времени
  const hash01 = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 1000) / 1000;
  };
  const busy = (iso, masterIdx, minutes) => hash01(`${iso}|${masterIdx}|${minutes}`) < 0.34;
  const slotFree = (iso, minutes) => {
    const ids = state.master === "any" ? [1, 2, 3, 4] : [MASTERS.findIndex((m) => m.id === state.master)];
    return ids.some((i) => !busy(iso, i, minutes));
  };

  const dateStrip = $("#dateStrip");
  const slotBox = $("#slots");
  const renderDates = () => {
    dateStrip.textContent = "";
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const iso = isoOf(d);
      const open = HOURS[d.getDay()];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "day";
      b.disabled = !open;
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", String(state.date === iso));
      const wd = document.createElement("small");
      wd.textContent = fmt({ weekday: "short" }).format(d);
      const dn = document.createElement("b");
      dn.textContent = d.getDate();
      const mo = document.createElement("span");
      mo.textContent = fmt({ month: "short" }).format(d);
      b.append(wd, dn, mo);
      b.addEventListener("click", () => {
        state.date = iso;
        state.time = null;
        renderDates();
        hide("#err-time");
        renderSummary();
      });
      dateStrip.appendChild(b);
    }
    renderSlots();
  };

  const renderSlots = () => {
    slotBox.textContent = "";
    const hint = $("#slotHint");
    if (!state.date) {
      hint.textContent = tx("bk.pickday");
      return;
    }
    const d = parseISO(state.date);
    const open = HOURS[d.getDay()];
    hint.textContent = tx("bk.freefor", capitalize(fmt({ weekday: "long", day: "numeric", month: "long" }).format(d)));
    if (!open) return;
    const need = Math.max(totals().min, 30);
    const now = new Date();
    const isToday = isoOf(now) === state.date;
    const nowMin = now.getHours() * 60 + now.getMinutes() + 60;
    let any = false;
    for (let m = open[0] * 60; m + need <= open[1] * 60; m += 30) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.textContent = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
      const ok = slotFree(state.date, m) && !(isToday && m < nowMin);
      b.disabled = !ok;
      if (ok) any = true;
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", String(state.time === m));
      b.addEventListener("click", () => {
        state.time = m;
        $$(".slot", slotBox).forEach((el) => el.setAttribute("aria-selected", String(el === b)));
        hide("#err-time");
        renderSummary();
      });
      slotBox.appendChild(b);
    }
    if (!any) hint.textContent = tx("bk.noslots");
  };

  const whenText = () => {
    if (!state.date) return "—";
    const d = parseISO(state.date);
    const day = capitalize(fmt({ weekday: "short", day: "numeric", month: "short" }).format(d));
    return state.time == null ? day : `${day}, ${pad(Math.floor(state.time / 60))}:${pad(state.time % 60)}`;
  };

  /* ---------- Сводка и «корзина» ---------- */
  const renderSummary = () => {
    const list = $("#sumList");
    list.textContent = "";
    state.services.forEach((id) => {
      const li = document.createElement("li");
      const a = document.createElement("span");
      a.textContent = tx(`s.${id}`);
      const b = document.createElement("b");
      b.textContent = eur(svcById[id].price);
      li.append(a, b);
      list.appendChild(li);
    });
    const { price, min } = totals();
    $("#sumEmpty").hidden = state.services.size > 0;
    $("#sumMaster").textContent = masterName(state.master);
    $("#sumWhen").textContent = whenText();
    $("#sumShade").textContent = state.services.has("n1") ? SHADES[state.shade][0] : "—";
    $("#sumDur").textContent = fmtDur(min);
    $("#sumTotal").textContent = eur(price);

    const cart = $("#cart");
    cart.hidden = state.services.size === 0 || cartHidden;
    $("#cartText").textContent = tx("cart.n", state.services.size);
    $("#cartTotal").textContent = eur(price);
  };

  let cartHidden = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        cartHidden = entries[0].isIntersecting;
        renderSummary();
      },
      { threshold: 0.05 }
    ).observe($("#booking"));
  }

  const renderAll = () => {
    renderCards();
    renderPick();
    renderSummary();
    if (state.step === 3) renderSlots();
  };

  /* ---------- Проверка и переходы ---------- */
  const hide = (sel) => {
    const el = $(sel);
    if (el) el.hidden = true;
  };
  const showErr = (sel, key) => {
    const el = $(sel);
    el.textContent = tx(key);
    el.hidden = false;
  };

  btnPrev.addEventListener("click", () => showStep(state.step - 1));
  btnNext.addEventListener("click", () => {
    if (state.step === 1 && state.services.size === 0) return showErr("#err-services", "err.services");
    if (state.step === 3) {
      if (!state.date || state.time == null) return showErr("#err-time", "err.time");
    }
    showStep(state.step + 1);
    $("#booking").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });

  const fName = $("#f-name");
  const fPhone = $("#f-phone");
  const fEmail = $("#f-email");
  const fConsent = $("#f-consent");
  const validName = () => /^\p{L}[\p{L}\p{M} '.\-]+$/u.test(fName.value.trim());
  const validPhone = () => {
    const digits = fPhone.value.replace(/\D/g, "");
    return /^[+\d][\d\s\-()]*$/.test(fPhone.value.trim()) && digits.length >= 7 && digits.length <= 15;
  };
  const validEmail = () => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(fEmail.value.trim());
  const mark = (input, bad, key) => {
    const f = input.closest(".field");
    if (f) f.classList.toggle("is-error", bad);
    const err = $(`#err-${input.id.replace("f-", "")}`);
    if (err) {
      err.hidden = !bad;
      if (bad) err.textContent = tx(key);
    }
  };
  fName.addEventListener("blur", () => fName.value && mark(fName, !validName(), "err.name"));
  fPhone.addEventListener("blur", () => fPhone.value && mark(fPhone, !validPhone(), "err.phone"));
  fEmail.addEventListener("blur", () => fEmail.value && mark(fEmail, !validEmail(), "err.email"));
  fPhone.addEventListener("input", () => {
    const cleaned = fPhone.value.replace(/[^\d+\s\-()]/g, "");
    if (cleaned !== fPhone.value) fPhone.value = cleaned;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const okName = validName();
    const okPhone = validPhone();
    const okEmail = validEmail();
    mark(fName, !okName, "err.name");
    mark(fPhone, !okPhone, "err.phone");
    mark(fEmail, !okEmail, "err.email");
    const okC = fConsent.checked;
    $("#err-consent").hidden = okC;
    if (!okC) $("#err-consent").textContent = tx("err.consent");
    if (!okName) return fName.focus();
    if (!okPhone) return fPhone.focus();
    if (!okEmail) return fEmail.focus();
    if (!okC) return fConsent.focus();
    confirmBooking();
  });

  /* ---------- Подтверждение ---------- */
  let lastBooking = null;
  const bookingLines = () =>
    [...state.services].map((id) => `• ${tx(`s.${id}`)} — ${eur(svcById[id].price)}`).join("\n");

  const confirmBooking = () => {
    const name = fName.value.trim();
    const first = name.split(" ")[0];
    const code = `BL-${String(Math.floor(10000 + Math.random() * 89999))}`;
    const { price, min } = totals();
    lastBooking = { name, email: fEmail.value.trim(), phone: fPhone.value.trim(), notes: fNotes().trim(), code, price, min, first,
      date: state.date, time: state.time, master: state.master, shade: state.services.has("n1") ? SHADES[state.shade][0] : "" };
    form.hidden = true;
    $("#stepper").hidden = true;
    $("#success").hidden = false;
    renderSuccess();
    $("#booking").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };
  const fNotes = () => $("#f-notes").value;

  const renderSuccess = () => {
    if (!lastBooking) return;
    const b = lastBooking;
    const d = parseISO(b.date);
    const when = `${capitalize(fmt({ weekday: "long", day: "numeric", month: "long" }).format(d))}, ${pad(Math.floor(b.time / 60))}:${pad(b.time % 60)}`;
    const mname = masterName(b.master);
    $("#okText").textContent = b.master === "any" ? tx("ok.text.any", b.first, when) : tx("ok.text", b.first, mname, when);
    $("#okCode").textContent = b.code;
    $("#mail1To").textContent = tx("mail.to", cfg.email || "info@your-domain.com");
    $("#mail1Subj").textContent = tx("mail1.subj", b.name, b.code);
    $("#mail1Body").textContent = tx("mail1.body", bookingLines(), mname, when, b.phone, b.email, b.shade || "—", eur(b.price), fmtDur(b.min), b.notes || "—");
    $("#mail2To").textContent = tx("mail.to", b.email);
    $("#mail2Subj").textContent = tx("mail2.subj", b.code);
    $("#mail2Body").textContent = tx("mail2.body", b.first, bookingLines(), mname, when, eur(b.price));
  };

  $("#btnAgain").addEventListener("click", () => {
    lastBooking = null;
    state.services.clear();
    state.date = null;
    state.time = null;
    state.master = "any";
    form.reset();
    $$(".field.is-error").forEach((f) => f.classList.remove("is-error"));
    form.hidden = false;
    $("#stepper").hidden = false;
    $("#success").hidden = true;
    showStep(1);
    renderAll();
  });

  /* ---------- Смена языка ---------- */
  onLangChange.push(() => {
    renderTabs();
    renderAll();
    if (state.step === 2) renderMasters();
    if (state.step === 3) renderDates();
    if (lastBooking) renderSuccess();
    $$(".step__error:not([hidden]), .field__error:not([hidden])").forEach(() => {});
  });

  /* ---------- Старт ---------- */
  renderTabs();
  renderSwatches();
  renderAll();
  showStep(1);
})();
