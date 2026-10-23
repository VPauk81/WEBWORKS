(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const cfg = window.SITE_CONFIG || {};

  /* ---------- Бегущая строка: дублируем содержимое ДО сбора переводимых элементов ---------- */
  const marquee = $("#marqueeTrack");
  if (marquee) {
    [...marquee.children].forEach((node) => marquee.appendChild(node.cloneNode(true)));
  }

  /* ---------- Контакты из config.js ---------- */
  const hrefs = {
    phone: () => `tel:${cfg.phoneLink}`,
    email: () => `mailto:${cfg.email}`,
    map: () => cfg.mapUrl,
  };
  $$("[data-contact]").forEach((el) => {
    const value = cfg[el.dataset.contact];
    if (!value) return;
    // Заглушка из разметки (например, адрес-пример) остаётся переводимой;
    // настоящее значение из config.js показывается одинаково на всех языках.
    if (el.dataset.i18n && value === el.textContent.trim()) return;
    el.removeAttribute("data-i18n");
    el.textContent = value;
  });
  $$("[data-contact-href]").forEach((el) => {
    const make = hrefs[el.dataset.contactHref];
    if (make) el.href = make();
  });

  /* ---------- Языки ---------- */
  const dict = window.I18N || {};
  const textEls = $$("[data-i18n]");
  const attrEls = $$("[data-i18n-attr]");
  const parseAttrs = (el) => el.dataset.i18nAttr.split(";").map((pair) => pair.split(":"));

  // Английский берём из разметки, а динамические строки — из I18N.en
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

  // Сайт всегда открывается на английском; выбор языка не запоминается —
  // посетитель каждый раз сам выбирает удобный язык.
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
  // Текст без HTML-сущностей — для textContent
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
      const key = el.dataset.i18n;
      el.innerHTML = el.dataset.name ? t(key, el.dataset.name) : t(key);
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

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    syncBurgerLabel();
  };
  function syncBurgerLabel() {
    burger.setAttribute("aria-label", tx(nav.classList.contains("is-open") ? "nav.close" : "nav.open"));
  }
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

  // Подсветка пункта меню текущего раздела
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

  /* ---------- Часы работы и статус «Открыто сейчас» ---------- */
  const HOURS = cfg.hours || { 1: [10, 20], 2: [10, 20], 3: [10, 20], 4: [10, 20], 5: [10, 20], 6: [9, 18], 0: null };
  const pad = (n) => String(n).padStart(2, "0");
  const hh = (h) => `${pad(h)}:00`;
  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmt = (opts) => new Intl.DateTimeFormat(locale(), opts);

  const renderOpenStatus = () => {
    const now = new Date();
    const today = HOURS[now.getDay()];
    const minutes = now.getHours() * 60 + now.getMinutes();
    let text;
    let open = false;
    if (today && minutes >= today[0] * 60 && minutes < today[1] * 60) {
      open = true;
      text = tx("st.open", hh(today[1]));
    } else if (today && minutes < today[0] * 60) {
      text = tx("st.opensToday", hh(today[0]));
    } else {
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const h = HOURS[d.getDay()];
        if (h) {
          text = tx("st.opensDay", capitalize(fmt({ weekday: "long" }).format(d)), hh(h[0]));
          break;
        }
      }
    }
    if (!text) return;
    $("#openStatus").textContent = text;
    $("#openDot").classList.toggle("is-open", open);
  };

  const renderHours = () => {
    const list = $("#hoursList");
    list.textContent = "";
    const todayIdx = new Date().getDay();
    [1, 2, 3, 4, 5, 6, 0].forEach((idx, i) => {
      // 4 января 2021 — понедельник
      const day = capitalize(fmt({ weekday: "long" }).format(new Date(2021, 0, 4 + i)));
      const li = document.createElement("li");
      if (idx === todayIdx) li.classList.add("is-today");
      const name = document.createElement("span");
      name.textContent = day;
      const value = document.createElement("span");
      if (HOURS[idx]) {
        value.textContent = `${hh(HOURS[idx][0])} – ${hh(HOURS[idx][1])}`;
      } else {
        value.textContent = tx("c.closed");
        value.className = "is-closed";
      }
      li.append(name, value);
      list.appendChild(li);
    });
  };

  /* ---------- Вкладки прайса ---------- */
  const tabs = $$("#priceTabs [role='tab']");
  const selectTab = (tab, focus = false) => {
    tabs.forEach((other) => {
      const on = other === tab;
      other.setAttribute("aria-selected", String(on));
      other.tabIndex = on ? 0 : -1;
      $(`#${other.getAttribute("aria-controls")}`).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (dir) {
        e.preventDefault();
        selectTab(tabs[(i + dir + tabs.length) % tabs.length], true);
      }
    });
  });

  /* ---------- Услуги: одна «правда» — строки прайса в разметке ---------- */
  const SERVICES = $$(".price-row").map((row) => ({
    id: row.dataset.id,
    min: Number(row.dataset.min),
    price: Number(row.dataset.price),
    row,
  }));
  const svcById = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
  const BARBERS = $$("[data-barber]").map((el) => ({ id: el.dataset.barber, name: $("h3", el).textContent.trim() }));

  const state = { step: 1, services: new Set(), barber: "any", date: "", time: "", slotBarber: "" };

  const svcName = (id) => tx(`svc.${id}.name`);
  const totalMin = () => [...state.services].reduce((sum, id) => sum + svcById[id].min, 0);
  const totalPrice = () => [...state.services].reduce((sum, id) => sum + svcById[id].price, 0);
  const minText = (m) => `${m} ${tx("unit.min")}`;
  const barberName = (id) => (id === "any" ? tx("bk.any") : BARBERS.find((b) => b.id === id)?.name || "");

  const renderDurations = () => {
    SERVICES.forEach((s) => ($(".dur__text", s.row).textContent = minText(s.min)));
  };

  const syncAddButtons = () => {
    SERVICES.forEach((s) => {
      const on = state.services.has(s.id);
      s.row.classList.toggle("is-added", on);
      const label = $("[data-add] span", s.row);
      label.dataset.i18n = on ? "svc.added" : "svc.add";
      label.innerHTML = t(label.dataset.i18n);
      $("[data-add]", s.row).setAttribute("aria-pressed", String(on));
    });
  };

  /* ---------- Мини-корзина: «выбрано N · итог → Записаться» ---------- */
  const cart = $("#cart");
  const renderCart = () => {
    const n = state.services.size;
    $("#cartText").textContent = tx("cart.n", n);
    $("#cartTotal").textContent = `€${totalPrice()}`;
    cart.hidden = n === 0 || bookingInView;
  };
  let bookingInView = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      bookingInView = entries[0].isIntersecting;
      renderCart();
    }).observe($("#booking"));
  }

  /* ---------- Запись ---------- */
  const form = $("#bookingForm");
  const steps = $$(".step", form);
  const stepperItems = $$("#stepper li");
  const btnPrev = $("#btnPrev");
  const btnNext = $("#btnNext");
  const btnConfirm = $("#btnConfirm");

  const makePick = (type, id, nameText, subText, rightText) => {
    const label = document.createElement("label");
    label.className = type;
    const input = document.createElement("input");
    input.type = type === "pick" ? "checkbox" : "radio";
    if (type === "bpick") input.name = "barber";
    input.value = id;
    label.appendChild(input);
    return { label, input };
  };

  const renderServices = () => {
    const box = $("#svcPick");
    box.textContent = "";
    SERVICES.forEach((s) => {
      const { label, input } = makePick("pick", s.id);
      input.checked = state.services.has(s.id);
      label.classList.toggle("is-on", input.checked);
      const check = document.createElement("span");
      check.className = "pick__box";
      check.innerHTML = '<svg class="ico"><use href="#i-check" /></svg>';
      const body = document.createElement("span");
      body.className = "pick__body";
      const name = document.createElement("span");
      name.className = "pick__name";
      name.textContent = svcName(s.id);
      const sub = document.createElement("span");
      sub.className = "pick__sub";
      sub.textContent = minText(s.min);
      body.append(name, document.createElement("br"), sub);
      const price = document.createElement("span");
      price.className = "pick__price";
      price.textContent = `€${s.price}`;
      label.append(check, body, price);
      input.addEventListener("change", () => toggleService(s.id, input.checked));
      box.appendChild(label);
    });
  };

  const renderBarbers = () => {
    const box = $("#barberPick");
    box.textContent = "";
    [{ id: "any" }, ...BARBERS].forEach((b) => {
      const { label, input } = makePick("bpick", b.id);
      input.checked = state.barber === b.id;
      label.classList.toggle("is-on", input.checked);
      const av = document.createElement("span");
      av.className = "bpick__av";
      av.textContent = b.id === "any" ? "★" : b.name.charAt(0);
      const body = document.createElement("span");
      body.className = "pick__body";
      const name = document.createElement("span");
      name.className = "bpick__name";
      name.textContent = barberName(b.id);
      const sub = document.createElement("span");
      sub.className = "bpick__sub";
      sub.textContent = b.id === "any" ? tx("bk.any.sub") : tx(`b.${b.id}.role`);
      body.append(name, document.createElement("br"), sub);
      label.append(av, body);
      input.addEventListener("change", () => {
        state.barber = b.id;
        state.time = "";
        renderBarbers();
        renderSlots();
        renderSummary();
      });
      box.appendChild(label);
    });
  };

  // Занятость — детерминированная «имитация»: одна и та же дата и барбер
  // всегда дают один и тот же набор свободных окон
  const hashStr = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const SLOT_STEP = 30;
  const isBusy = (iso, barber, cell) => hashStr(`${iso}|${barber}|${cell}`) % 100 < 34;

  const slotsFor = (iso) => {
    const d = parseISO(iso);
    const h = HOURS[d.getDay()];
    if (!h) return [];
    const dur = totalMin() || SLOT_STEP;
    const cells = Math.ceil(dur / SLOT_STEP);
    const now = new Date();
    const minStart = iso === isoOf(now) ? now.getHours() * 60 + now.getMinutes() + 30 : 0;
    const barbers = state.barber === "any" ? BARBERS.map((b) => b.id) : [state.barber];
    const out = [];
    for (let start = h[0] * 60; start + dur <= h[1] * 60; start += SLOT_STEP) {
      if (start < minStart) continue;
      const free = barbers.find((b) => {
        for (let c = 0; c < cells; c++) if (isBusy(iso, b, start / SLOT_STEP + c)) return false;
        return true;
      });
      if (free) out.push({ time: `${pad(Math.floor(start / 60))}:${pad(start % 60)}`, barber: free });
    }
    return out;
  };

  const renderDates = () => {
    const strip = $("#dateStrip");
    strip.textContent = "";
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const iso = isoOf(d);
      const closed = !HOURS[d.getDay()];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "date-btn";
      btn.dataset.sound = "none";
      btn.disabled = closed;
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", String(state.date === iso));
      if (state.date === iso) btn.classList.add("is-on");
      const top = document.createElement("span");
      top.textContent = i === 0 ? tx("bk.today") : i === 1 ? tx("bk.tomorrow") : fmt({ weekday: "short" }).format(d);
      const day = document.createElement("b");
      day.textContent = d.getDate();
      const month = document.createElement("span");
      month.textContent = closed ? tx("bk.closed") : fmt({ month: "short" }).format(d);
      btn.append(top, day, month);
      btn.addEventListener("click", () => {
        state.date = iso;
        state.time = "";
        playSound("select");
        renderDates();
        renderSlots();
        renderSummary();
      });
      strip.appendChild(btn);
    }
  };

  const renderSlots = () => {
    const box = $("#slots");
    const hint = $("#slotHint");
    box.textContent = "";
    $("#err-time").hidden = true;
    if (!state.date) {
      hint.textContent = tx("bk.pickday");
      return;
    }
    const d = parseISO(state.date);
    hint.textContent = tx("bk.hint", capitalize(fmt({ weekday: "long", day: "numeric", month: "long" }).format(d)));
    const list = slotsFor(state.date);
    if (state.time && !list.some((s) => s.time === state.time)) state.time = "";
    if (!list.length) {
      const empty = document.createElement("p");
      empty.className = "slots__empty";
      empty.textContent = tx("bk.noslots");
      box.appendChild(empty);
      return;
    }
    list.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot" + (state.time === s.time ? " is-on" : "");
      btn.dataset.sound = "none";
      btn.textContent = s.time;
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", String(state.time === s.time));
      btn.addEventListener("click", () => {
        state.time = s.time;
        state.slotBarber = s.barber;
        playSound("select");
        renderSlots();
        renderSummary();
      });
      if (state.time === s.time) state.slotBarber = s.barber;
      box.appendChild(btn);
    });
  };

  const whenText = () => {
    if (!state.date) return "";
    const d = parseISO(state.date);
    const day = fmt({ weekday: "short", day: "numeric", month: "short" }).format(d);
    return state.time ? `${day}, ${state.time}` : day;
  };

  const renderSummary = () => {
    const list = $("#sumServices");
    list.textContent = "";
    if (!state.services.size) {
      const li = document.createElement("li");
      li.className = "is-empty";
      li.textContent = tx("sum.none");
      list.appendChild(li);
    } else {
      SERVICES.filter((s) => state.services.has(s.id)).forEach((s) => {
        const li = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = svcName(s.id);
        const price = document.createElement("b");
        price.textContent = `€${s.price}`;
        li.append(name, price);
        list.appendChild(li);
      });
    }
    let barber = barberName(state.barber);
    if (state.barber === "any" && state.time && state.slotBarber) barber = `${tx("bk.any")} → ${barberName(state.slotBarber)}`;
    $("#sumBarber").textContent = barber;
    $("#sumWhen").textContent = whenText() || "—";
    $("#sumDuration").textContent = state.services.size ? minText(totalMin()) : "—";
    $("#sumTotal").textContent = `€${totalPrice()}`;
    renderCart();
  };

  const toggleService = (id, on) => {
    if (on) state.services.add(id);
    else state.services.delete(id);
    $("#err-services").hidden = true;
    state.time = state.time && state.date && slotsFor(state.date).some((s) => s.time === state.time) ? state.time : "";
    syncAddButtons();
    renderServices();
    renderSlots();
    renderSummary();
  };

  $$("[data-add]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.add;
      toggleService(id, !state.services.has(id));
      playSound("select");
    })
  );
  $$("[data-pick-barber]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.barber = btn.dataset.pickBarber;
      state.time = "";
      renderBarbers();
      renderSlots();
      renderSummary();
      $("#booking").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    })
  );

  const showStep = (n, scroll = true) => {
    state.step = n;
    steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    stepperItems.forEach((li, i) => {
      li.classList.toggle("is-current", i + 1 === n);
      li.classList.toggle("is-done", i + 1 < n);
    });
    btnPrev.hidden = n === 1;
    btnNext.hidden = n === 4;
    btnConfirm.hidden = n !== 4;
    if (n === 3) {
      renderDates();
      renderSlots();
      const on = $(".date-btn.is-on", $("#dateStrip"));
      if (on) on.scrollIntoView({ block: "nearest", inline: "center" });
    }
    if (scroll) $("#stepper").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const showError = (id, key) => {
    const p = $(`#${id}`);
    p.dataset.errKey = key;
    p.textContent = tx(key);
    p.hidden = false;
    const field = p.closest(".field, .consent");
    if (field) field.classList.add("has-error");
  };
  const clearErrors = () => {
    $$(".step__error, .field__error").forEach((p) => (p.hidden = true));
    $$(".has-error").forEach((f) => f.classList.remove("has-error"));
  };

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const validPhone = (v) => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15;

  const validateStep = (n) => {
    clearErrors();
    if (n === 1 && !state.services.size) {
      showError("err-services", "err.services");
      return false;
    }
    if (n === 3 && !(state.date && state.time)) {
      showError("err-time", "err.time");
      return false;
    }
    if (n === 4) {
      let first = null;
      const fail = (id, key, input) => {
        showError(id, key);
        first ??= input;
      };
      if ($("#f-name").value.trim().length < 2) fail("err-name", "err.name", $("#f-name"));
      if (!validPhone($("#f-phone").value.trim())) fail("err-phone", "err.phone", $("#f-phone"));
      const email = $("#f-email").value.trim();
      if (email && !validEmail(email)) fail("err-email", "err.email", $("#f-email"));
      if (!$("#f-consent").checked) fail("err-consent", "err.consent", $("#f-consent"));
      if (first) {
        first.focus();
        return false;
      }
    }
    return true;
  };

  btnNext.addEventListener("click", () => {
    if (!validateStep(state.step)) return playSound("error");
    showStep(state.step + 1);
  });
  btnPrev.addEventListener("click", () => {
    clearErrors();
    showStep(state.step - 1);
  });
  $$("input, textarea", form).forEach((el) =>
    el.addEventListener("input", () => {
      el.closest(".field, .consent")?.classList.remove("has-error");
      const err = $(`#err-${el.id.replace("f-", "")}`);
      if (err) err.hidden = true;
    })
  );

  const randomCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "CB-";
    for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    return code;
  };
  let lastBooking = null;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.step < 4) return btnNext.click();
    if (!validateStep(4)) return playSound("error");
    const name = $("#f-name").value.trim();
    lastBooking = {
      code: randomCode(),
      date: state.date,
      time: state.time,
      minutes: totalMin(),
      services: SERVICES.filter((s) => state.services.has(s.id)).map((s) => s.id),
    };
    $("#okText").textContent = tx("ok.text", `${name} · ${whenText()}`);
    $("#okCode").textContent = lastBooking.code;
    form.hidden = true;
    $("#stepper").hidden = true;
    const success = $("#success");
    success.hidden = false;
    success.tabIndex = -1;
    success.focus({ preventScroll: true });
    $("#booking").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    playSound("ok");
  });

  $("#btnAgain").addEventListener("click", () => {
    state.services.clear();
    Object.assign(state, { barber: "any", date: "", time: "", slotBarber: "" });
    form.reset();
    clearErrors();
    form.hidden = false;
    $("#stepper").hidden = false;
    $("#success").hidden = true;
    syncAddButtons();
    renderServices();
    renderBarbers();
    renderSlots();
    renderSummary();
    showStep(1, false);
  });

  // Файл календаря (.ics) — формируется прямо в браузере
  const icsEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  $("#btnIcs").addEventListener("click", () => {
    if (!lastBooking) return;
    const [y, mo, d] = lastBooking.date.split("-").map(Number);
    const [hr, mi] = lastBooking.time.split(":").map(Number);
    const start = new Date(y, mo - 1, d, hr, mi);
    const end = new Date(start.getTime() + lastBooking.minutes * 60000);
    const local = (dt) => `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const names = lastBooking.services.map(svcName).join(", ");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Crown & Blade//Demo//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${lastBooking.code}@barbershop.demo`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${local(start)}`,
      `DTEND:${local(end)}`,
      `SUMMARY:${icsEscape(tx("ics.summary", names))}`,
      `LOCATION:${icsEscape(cfg.address || "")}`,
      `DESCRIPTION:${icsEscape(`${lastBooking.code} — ${tx("ics.desc")}`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lastBooking.code}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* ---------- Звуки нажатий (Web Audio, без звуковых файлов) ---------- */
  let audio = null;
  let soundOn = true;
  const tone = (freq, start, dur, type = "sine", vol = 0.06) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime + start);
    gain.gain.setValueAtTime(0.0001, audio.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol, audio.currentTime + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(audio.currentTime + start);
    osc.stop(audio.currentTime + start + dur + 0.03);
  };
  function playSound(kind) {
    if (!soundOn) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state !== "running") audio.resume();
      if (kind === "tap") tone(880, 0, 0.06, "triangle", 0.05);
      else if (kind === "select") {
        tone(660, 0, 0.07, "sine", 0.06);
        tone(990, 0.05, 0.09, "sine", 0.05);
      } else if (kind === "ok") {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.28, "sine", 0.07));
      } else if (kind === "error") {
        tone(300, 0, 0.1, "square", 0.04);
        tone(220, 0.1, 0.14, "square", 0.04);
      } else if (kind === "copy") {
        tone(880, 0, 0.1, "sine", 0.06);
        tone(1320, 0.07, 0.14, "sine", 0.05);
      }
    } catch {
      /* звук недоступен — молча пропускаем */
    }
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button, a[href], summary, [role='tab'], .pick, .bpick");
    if (!el || el.closest("#soundToggle") || el.id === "copyLink" || el.dataset.sound === "none" || el.hasAttribute("data-add")) return;
    playSound(el.matches(".pick, .bpick") ? "select" : "tap");
  });
  const soundToggle = $("#soundToggle");
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    if (soundOn) playSound("tap");
  });

  /* ---------- Копирование ссылки на сайт ---------- */
  const toast = $("#toast");
  let toastTimer = 0;
  const showToast = () => {
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };
  $("#copyLink").addEventListener("click", async () => {
    const url = location.href.split("#")[0];
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    playSound("copy");
    showToast();
  });

  /* ---------- Перерисовка динамических частей при смене языка ---------- */
  onLangChange.push(() => {
    // Уже показанные сообщения об ошибках тоже переводим
    $$("[data-err-key]").forEach((p) => {
      if (!p.hidden) p.textContent = tx(p.dataset.errKey);
    });
    renderOpenStatus();
    renderHours();
    renderDurations();
    syncAddButtons();
    renderServices();
    renderBarbers();
    renderSummary();
    if (state.step === 3) {
      renderDates();
      renderSlots();
    }
  });

  /* ---------- Старт ---------- */
  setLang("en");
  showStep(1, false);
})();
