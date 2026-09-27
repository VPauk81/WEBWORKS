(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const today = new Date();

  /* ---------- Контакты из config.js ---------- */
  const cfg = window.SITE_CONFIG || {};
  const hrefs = {
    phone: () => `tel:${cfg.phoneLink}`,
    email: () => `mailto:${cfg.email}`,
    whatsapp: () => `https://wa.me/${cfg.whatsapp}`,
    map: () => cfg.mapUrl,
  };
  document.querySelectorAll("[data-contact]").forEach((el) => {
    const value = cfg[el.dataset.contact];
    if (value) el.textContent = value;
  });
  document.querySelectorAll("[data-contact-href]").forEach((el) => {
    const make = hrefs[el.dataset.contactHref];
    if (make) el.href = make();
  });

  /* ---------- Языки ---------- */
  const dict = window.I18N || {};
  // Строки, которых нет в разметке (меняются из скрипта)
  const extraEn = {
    "nav.open": "Open menu",
    "nav.close": "Close menu",
    "f.modelFirst": "Select a make first",
    "f.modelph": "Select model",
    "f.modelOther": "Other model",
    "f.modelTextMake": "Type make and model",
    "f.modelTextModel": "Type your model",
  };
  const textEls = document.querySelectorAll("[data-i18n]");
  const attrEls = document.querySelectorAll("[data-i18n-attr]");
  const parseAttrs = (el) => el.dataset.i18nAttr.split(";").map((pair) => pair.split(":"));

  // Английский берём из исходной разметки
  const en = { ...extraEn };
  textEls.forEach((el) => {
    en[el.dataset.i18n] ??= el.innerHTML.trim();
  });
  attrEls.forEach((el) => {
    parseAttrs(el).forEach(([attr, key]) => {
      en[key] ??= el.getAttribute(attr);
    });
  });
  dict.en = en;

  // Сайт всегда открывается на английском; выбор языка не запоминается —
  // посетитель каждый раз сам выбирает удобный язык.
  let lang = "en";
  const t = (key) => dict[lang]?.[key] ?? en[key] ?? key;

  const langBox = document.getElementById("lang");
  const langToggle = document.getElementById("langToggle");
  const langCurrent = document.getElementById("langCurrent");
  const langItems = [...langBox.querySelectorAll("[data-lang]")];
  const onLangChange = [];

  const setLang = (next) => {
    lang = dict[next] ? next : "en";
    document.documentElement.lang = lang;
    textEls.forEach((el) => {
      el.innerHTML = t(el.dataset.i18n);
    });
    attrEls.forEach((el) => {
      parseAttrs(el).forEach(([attr, key]) => el.setAttribute(attr, t(key)));
    });
    langCurrent.textContent = lang.toUpperCase();
    langItems.forEach((item) => item.setAttribute("aria-checked", String(item.dataset.lang === lang)));
    onLangChange.forEach((fn) => fn());
  };

  const setLangMenu = (open, focusItem = false) => {
    langBox.classList.toggle("is-open", open);
    langToggle.setAttribute("aria-expanded", String(open));
    if (open && focusItem) langItems.find((i) => i.dataset.lang === lang).focus();
  };

  langToggle.addEventListener("click", (e) => {
    setLangMenu(!langBox.classList.contains("is-open"), e.detail === 0);
  });
  langItems.forEach((item) =>
    item.addEventListener("click", () => {
      setLang(item.dataset.lang);
      setLangMenu(false);
      langToggle.focus();
    })
  );
  langBox.addEventListener("keydown", (e) => {
    const idx = langItems.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!langBox.classList.contains("is-open")) return setLangMenu(true, true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      langItems[(idx + step + langItems.length) % langItems.length].focus();
    } else if (e.key === "Escape" && langBox.classList.contains("is-open")) {
      setLangMenu(false);
      langToggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!langBox.contains(e.target)) setLangMenu(false);
  });
  langBox.addEventListener("focusout", (e) => {
    if (!langBox.contains(e.relatedTarget)) setLangMenu(false);
  });

  /* ---------- Шапка и мобильное меню ---------- */
  const header = document.querySelector(".header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", t(open ? "nav.close" : "nav.open"));
  };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  // Подсветка текущего раздела в меню
  const navLinks = [...nav.querySelectorAll("a")];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${entry.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Тахометр ---------- */
  const MAX = 8;
  const ARC = 556;
  const ticks = document.getElementById("ticks");
  const needle = document.getElementById("needle");
  const arc = document.querySelector(".gauge__value");
  const rpm = document.getElementById("rpm");
  const NS = "http://www.w3.org/2000/svg";

  const polar = (r, deg) => {
    const rad = (deg * Math.PI) / 180;
    return [150 + r * Math.sin(rad), 150 - r * Math.cos(rad)];
  };

  for (let i = 0; i <= MAX * 2; i++) {
    const deg = -135 + (i / (MAX * 2)) * 270;
    const major = i % 2 === 0;
    const [x1, y1] = polar(major ? 90 : 96, deg);
    const [x2, y2] = polar(104, deg);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    if (major) {
      line.classList.add("major");
      const [tx, ty] = polar(74, deg);
      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", tx);
      text.setAttribute("y", ty);
      text.textContent = i / 2;
      ticks.appendChild(text);
    }
    ticks.appendChild(line);
  }

  // Прогресс анимации 0…1 (время кадра rAF может быть чуть раньше performance.now())
  const progress = (now, start, dur) => (dur ? Math.min(Math.max((now - start) / dur, 0), 1) : 1);
  const formatNumber = (n, digits = 0) =>
    n.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  let shown = 0;
  let gaugeFrame = 0;
  const setGauge = (value) => {
    needle.style.transform = `rotate(${-135 + (value / MAX) * 270}deg)`;
    arc.style.strokeDashoffset = ARC * (1 - value / MAX);
    cancelAnimationFrame(gaugeFrame);
    const from = shown;
    const start = performance.now();
    const dur = reduceMotion ? 0 : 1600;
    const step = (now) => {
      const p = progress(now, start, dur);
      const eased = 1 - Math.pow(1 - p, 3);
      shown = from + (value - from) * eased;
      rpm.textContent = formatNumber(shown, 1);
      if (p < 1) gaugeFrame = requestAnimationFrame(step);
    };
    gaugeFrame = requestAnimationFrame(step);
  };

  // «Прогазовка» при загрузке, затем лёгкие колебания на холостых
  setTimeout(() => setGauge(7.2), 300);
  setTimeout(() => setGauge(2.4), 1500);
  if (!reduceMotion) {
    setInterval(() => setGauge(2 + Math.random() * 1.6), 3800);
  }
  onLangChange.push(() => (rpm.textContent = formatNumber(shown, 1)));

  /* ---------- Появление при скролле ---------- */
  document.querySelectorAll(".services, .steps, .reviews, .features").forEach((group) => {
    [...group.children].forEach((el, i) => el.style.setProperty("--d", `${(i % 4) * 0.08}s`));
  });

  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- Счётчики ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const renderCount = (el, value) => {
    el.textContent = formatNumber(value) + (el.dataset.suffix || "");
  };
  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const dur = reduceMotion ? 0 : 1800;
        const start = performance.now();
        const tick = (now) => {
          const p = progress(now, start, dur);
          renderCount(el, Math.round(target * (1 - Math.pow(1 - p, 4))));
          if (p < 1) requestAnimationFrame(tick);
          else el.dataset.done = "";
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => counterObserver.observe(el));
  // Формат чисел зависит от языка: 25,000 / 25 000
  onLangChange.push(() =>
    counters.forEach((el) => {
      if ("done" in el.dataset) renderCount(el, Number(el.dataset.count));
    })
  );

  /* ---------- Подсветка карточек услуг за курсором ---------- */
  document.querySelectorAll(".service").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Вкладки прайса ---------- */
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".price-list");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab.dataset.tab));
    });
  });

  /* ---------- Форма записи ---------- */
  const form = document.getElementById("bookingForm");
  const success = document.getElementById("formSuccess");
  const phone = document.getElementById("f-phone");
  const date = document.getElementById("f-date");

  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  date.min = iso(today);
  date.value = iso(today);

  // Марка → модель → год (данные в cars.js)
  const cars = window.CAR_MODELS || {};
  const makeSel = document.getElementById("f-make");
  const modelSel = document.getElementById("f-model");
  const modelText = document.getElementById("f-model-text");
  const modelLabel = document.querySelector('label[for="f-model"]');
  const yearSel = document.getElementById("f-year");
  const option = (value, label = value) => new Option(label, value);
  // Сортировка с учётом чисел: 2, 3, 6, 121, 323 — а не 121, 2, 3, 323
  const byName = new Intl.Collator("en", { numeric: true, sensitivity: "base" }).compare;

  const makeOtherOpt = makeSel.querySelector('[value="other"]');
  Object.keys(cars)
    .sort(byName)
    .forEach((make) => {
      cars[make] = [...cars[make]].sort(byName);
      makeSel.insertBefore(option(make), makeOtherOpt);
    });

  const yearOlderOpt = yearSel.querySelector('[value="older"]');
  for (let y = today.getFullYear(); y >= 1990; y--) yearSel.insertBefore(option(String(y)), yearOlderOpt);

  const renderModels = () => {
    const make = makeSel.value;
    const current = modelSel.value;
    const models = cars[make] || [];
    modelSel.replaceChildren(
      option("", t(make ? "f.modelph" : "f.modelFirst")),
      ...models.map((m) => option(m)),
      ...(models.length ? [option("other", t("f.modelOther"))] : [])
    );
    modelSel.disabled = !models.length;
    if (models.includes(current) || (current === "other" && models.length)) modelSel.value = current;
  };

  // «Другая марка» — вводим марку и модель текстом; «Другая модель» — только модель
  const syncModelText = () => {
    const makeOther = makeSel.value === "other";
    const modelOther = modelSel.value === "other";
    modelSel.hidden = makeOther;
    modelText.hidden = !(makeOther || modelOther);
    modelText.placeholder = t(makeOther ? "f.modelTextMake" : "f.modelTextModel");
    modelLabel.htmlFor = makeOther ? modelText.id : modelSel.id;
  };

  makeSel.addEventListener("change", () => {
    modelText.value = "";
    renderModels();
    syncModelText();
    (makeSel.value === "other" ? modelText : modelSel).focus();
  });
  modelSel.addEventListener("change", () => {
    syncModelText();
    if (modelSel.value === "other") modelText.focus();
  });
  renderModels();
  syncModelText();
  onLangChange.push(() => {
    renderModels();
    syncModelText();
  });

  // Международный номер: только цифры, пробелы, «+», скобки и дефисы
  phone.addEventListener("input", () => {
    phone.value = phone.value.replace(/[^\d+\s()-]/g, "").replace(/(?!^)\+/g, "");
  });

  const validators = {
    name: (input) => input.value.trim().length >= 2,
    phone: (input) => {
      const digits = input.value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    },
    consent: (input) => input.checked,
  };

  const fieldOf = (input) => input.closest(".field, .consent");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let firstInvalid = null;
    Object.entries(validators).forEach(([name, check]) => {
      const input = form.elements[name];
      const ok = check(input);
      fieldOf(input).classList.toggle("has-error", !ok);
      if (!ok && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Здесь можно отправить данные на сервер, например:
    // fetch("/api/booking", { method: "POST", body: new FormData(form) });
    form.hidden = true;
    success.hidden = false;
  });

  const clearError = (e) => fieldOf(e.target)?.classList.remove("has-error");
  form.addEventListener("input", clearError);
  form.addEventListener("change", clearError);

  document.getElementById("formReset").addEventListener("click", () => {
    form.reset();
    date.value = iso(today);
    renderModels();
    syncModelText();
    success.hidden = true;
    form.hidden = false;
  });

  document.getElementById("year").textContent = today.getFullYear();

  /* ---------- Звуки нажатий (Web Audio, без звуковых файлов) ---------- */
  // Каждая нота: [частота Гц, задержка с, длительность с, громкость]
  const SOUNDS = {
    tap: [[880, 0, 0.18, 0.07]],
    pop: [[1047, 0, 0.1, 0.05]],
    cta: [[660, 0, 0.22, 0.08], [990, 0.07, 0.3, 0.07]],
    lang: [[784, 0, 0.16, 0.06], [1175, 0.06, 0.24, 0.06]],
    copy: [[523, 0, 0.2, 0.06], [659, 0.06, 0.2, 0.06], [784, 0.12, 0.2, 0.06], [1047, 0.18, 0.35, 0.06]],
  };
  let audio = null;
  let soundOn = true;

  const playSound = (kind) => {
    if (!soundOn) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch {
      return; // браузер без Web Audio — просто без звука
    }
    const start = audio.currentTime + 0.01;
    SOUNDS[kind].forEach(([freq, delay, dur, vol]) => {
      const t0 = start + delay;
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      gain.connect(audio.destination);
      // Основной тон + тихий обертон октавой выше — звучит как мягкий колокольчик
      [
        [freq, "sine", 1],
        [freq * 2, "triangle", 0.25],
      ].forEach(([f, type, level]) => {
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = type;
        osc.frequency.value = f;
        g.gain.value = level;
        osc.connect(g).connect(gain);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      });
    });
  };

  // Какой звук у какого элемента (проверяется сверху вниз)
  const soundRules = [
    [".lang__menu [data-lang]", "lang"],
    [".lang__toggle", "pop"],
    ['a[href="#booking"], .form [type="submit"]', "cta"],
    ["#copyLink, #soundToggle", null], // у них свой звук
    [".nav a, .footer__nav a, .btn, .burger, .tab, .map", "tap"],
  ];
  document.addEventListener(
    "click",
    (e) => {
      const rule = soundRules.find(([sel]) => e.target.closest(sel));
      if (rule?.[1]) playSound(rule[1]);
    },
    true
  );

  const soundToggle = document.getElementById("soundToggle");
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    playSound("tap");
  });

  /* ---------- Копирование ссылки на сайт ---------- */
  const toast = document.getElementById("toast");
  let toastTimer = 0;
  const showToast = () => {
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Запасной способ для старых браузеров и страниц без HTTPS
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0, text.length);
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.remove();
      return ok;
    }
  };

  document.getElementById("copyLink").addEventListener("click", async () => {
    const url = location.href.split("#")[0];
    if (await copyText(url)) {
      playSound("copy");
      showToast();
    } else {
      window.prompt(t("copy.btn"), url); // совсем старые браузеры — показать ссылку для ручного копирования
    }
  });
})();
