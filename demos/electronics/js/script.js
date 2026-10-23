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

  /* ---------- Живые показания в шапке-иллюстрации ---------- */
  if (!reduceMotion) {
    const temp = $("#heroTemp");
    const hum = $("#heroHum");
    const oled = $(".pcb__oledtext");
    let step = 0;
    setInterval(() => {
      step += 1;
      const tv = (23.4 + Math.sin(step / 2) * 0.6).toFixed(1);
      const hv = Math.round(48 + Math.cos(step / 3) * 2);
      temp.textContent = `${tv} °C`;
      hum.textContent = `${hv} %`;
      oled.textContent = `${tv}°C`;
    }, 2200);
  }

  /* ---------- Конфигуратор ---------- */
  // Цены в евро. wifi/bt входят в цену ESP-плат (included).
  const PRICE = {
    asm: 39,
    ctl: { uno: 29, esp8266: 24, esp32: 34 },
    disp: { none: 0, lcd: 12, oled: 15, tft: 38 },
    mod: { wifi: 16, bt: 14, relay: 12, sensors: 22, sd: 9 },
    fw: { basic: 40, dash: 110 },
  };
  const INCLUDED = { uno: [], esp8266: ["wifi"], esp32: ["wifi", "bt"] };
  const MOD_ORDER = ["wifi", "bt", "relay", "sensors", "sd"];
  const CHIP_SUB = { uno: "ATmega328P · 5 V", esp8266: "Wi-Fi", esp32: "Wi-Fi · BT" };
  const CHIP_NAME = { uno: "UNO", esp8266: "ESP8266", esp32: "ESP32" };

  const KITS = {
    relay: { ctl: "esp8266", disp: "none", mods: ["relay"], fw: "dash" },
    weather: { ctl: "esp32", disp: "oled", mods: ["sensors"], fw: "dash" },
    desk: { ctl: "uno", disp: "lcd", mods: ["sensors", "sd"], fw: "basic" },
  };

  // Приводит выбор к итоговому составу: что включено в плату, что обязательно, что платное.
  const resolve = (c) => {
    const incl = INCLUDED[c.ctl];
    const eff = new Set([...c.mods, ...incl]);
    if (c.fw === "dash") eff.add("wifi");
    const parts = [{ key: `p.${c.ctl}`, price: PRICE.ctl[c.ctl] }];
    if (c.disp !== "none") parts.push({ key: `p.${c.disp}`, price: PRICE.disp[c.disp] });
    MOD_ORDER.filter((m) => eff.has(m)).forEach((m) => parts.push({ key: `m.${m}`, price: incl.includes(m) ? 0 : PRICE.mod[m], free: incl.includes(m) }));
    parts.push({ key: `fw.${c.fw}`, price: PRICE.fw[c.fw] });
    parts.push({ key: "p.asm", price: PRICE.asm });
    const paidMods = MOD_ORDER.filter((m) => eff.has(m) && !incl.includes(m)).length;
    const days = 3 + (c.disp === "tft" ? 1 : 0) + paidMods + (c.fw === "dash" ? 2 : 0);
    return { parts, total: parts.reduce((s, p) => s + p.price, 0), days, eff };
  };
  const describe = (c) =>
    resolve(c)
      .parts.filter((p) => p.key !== "p.asm")
      .map((p) => tx(p.key))
      .join(", ");

  const state = { ctl: "esp32", disp: "oled", mods: new Set(["sensors"]), fw: "basic" };
  const snapshot = () => ({ ctl: state.ctl, disp: state.disp, mods: [...state.mods], fw: state.fw });

  const partsBox = $("#parts");
  const totalBox = $(".total");
  const modInputs = $$("input[name='mod']");
  const pcbMods = { wifi: "#pcbWifi", bt: "#pcbBt", relay: "#pcbRelay", sensors: "#pcbSensors", sd: "#pcbSd" };

  const renderConfig = (bump) => {
    const r = resolve(snapshot());

    // Элементы выбора
    $$("input[name='ctl']").forEach((i) => (i.checked = i.value === state.ctl));
    $$("input[name='disp']").forEach((i) => (i.checked = i.value === state.disp));
    $$("input[name='fw']").forEach((i) => (i.checked = i.value === state.fw));
    modInputs.forEach((i) => {
      const incl = INCLUDED[state.ctl].includes(i.value);
      const req = state.fw === "dash" && i.value === "wifi";
      const locked = incl || req;
      i.checked = locked || state.mods.has(i.value);
      i.disabled = locked;
      const body = i.parentElement.querySelector(".opt__body");
      let note = body.querySelector(".opt__note");
      if (!note) {
        note = document.createElement("span");
        note.className = "opt__note";
        body.appendChild(note);
      }
      note.textContent = incl ? tx("note.incl") : req ? tx("note.req") : "";
      note.hidden = !locked;
    });

    // Плата-иллюстрация
    $("#pcbLabel").textContent = CHIP_NAME[state.ctl];
    $("#pcbSub").textContent = CHIP_SUB[state.ctl];
    $("#pcbDisp").classList.toggle("is-on", state.disp !== "none");
    Object.entries(pcbMods).forEach(([m, sel]) => $(sel).classList.toggle("is-on", r.eff.has(m)));

    // Список и итог
    partsBox.textContent = "";
    r.parts.forEach((p) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = tx(p.key);
      const price = document.createElement("b");
      if (p.free) {
        price.className = "free";
        price.textContent = tx("note.incl");
      } else {
        price.textContent = `€${p.price}`;
      }
      li.append(name, price);
      partsBox.appendChild(li);
    });
    $("#totalPrice").textContent = r.total;
    $("#totalDays").textContent = tx("days", r.days);
    if (bump) {
      totalBox.classList.remove("is-bump");
      void totalBox.offsetWidth;
      totalBox.classList.add("is-bump");
    }
    renderKitPrices();
  };

  const renderKitPrices = () => {
    $$("[data-kit]").forEach((card) => {
      $("[data-kit-price]", card).textContent = resolve(KITS[card.dataset.kit]).total;
    });
  };

  $$("input[name='ctl'], input[name='disp'], input[name='fw']").forEach((i) =>
    i.addEventListener("change", () => {
      state[i.name] = i.value;
      renderConfig(true);
    })
  );
  modInputs.forEach((i) =>
    i.addEventListener("change", () => {
      if (i.checked) state.mods.add(i.value);
      else state.mods.delete(i.value);
      renderConfig(true);
    })
  );

  $$("[data-load-kit]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const k = KITS[btn.dataset.loadKit];
      Object.assign(state, { ctl: k.ctl, disp: k.disp, mods: new Set(k.mods), fw: k.fw });
      renderConfig(true);
      toast(tx("toast.kit", tx(`k${["relay", "weather", "desk"].indexOf(btn.dataset.loadKit) + 1}.name`)));
      $("#configurator").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    })
  );

  /* ---------- Форма заявки ---------- */
  const form = $("#quoteForm");
  const fName = $("#fName");
  const fEmail = $("#fEmail");
  const fConsent = $("#fConsent");
  const field = (el) => el.closest(".field");

  const setState = (el, bad, ok) => {
    const f = field(el);
    f.classList.toggle("is-error", bad);
    f.classList.toggle("field--ok", !bad && ok);
    el.setAttribute("aria-invalid", String(bad));
  };
  const validName = () => {
    const v = fName.value.trim();
    return v.length >= 2 && /^\p{L}[\p{L}\p{M} '.\-]*$/u.test(v);
  };
  const emailState = () => {
    const v = fEmail.value.trim();
    if (!v) return "empty";
    if (/[^\x20-\x7E]/.test(v)) return "latin";
    return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v) ? "ok" : "bad";
  };
  const checkName = (final) => setState(fName, fName.value !== "" && !validName() && (final || fName.value.trim().length > 1), validName());
  const checkEmail = (final) => {
    const s = emailState();
    $("#emailErr").textContent = tx(s === "latin" ? "err.emailLatin" : "err.email");
    setState(fEmail, s === "latin" || (s === "bad" && final), s === "ok");
  };
  fName.addEventListener("input", () => checkName(false));
  fName.addEventListener("blur", () => checkName(true));
  fEmail.addEventListener("input", () => checkEmail(false));
  fEmail.addEventListener("blur", () => checkEmail(true));
  fConsent.addEventListener("change", () => ($("#consentErr").hidden = fConsent.checked));

  /* ---------- Заявки ---------- */
  const seed = () => [
    { name: "Tomasz K.", cfg: KITS.weather, hours: 3, status: "prod" },
    { name: "Lena B.", cfg: KITS.relay, hours: 11, status: "prod" },
    { name: "Oleg S.", cfg: KITS.desk, hours: 30, status: "done" },
  ];
  let orders = seed();
  let lastSent = null;
  let flash = false;

  const inbox = $("#inbox");
  const renderInbox = () => {
    inbox.textContent = "";
    orders.forEach((o, i) => {
      const r = resolve(o.cfg);
      const row = document.createElement("div");
      row.className = "msg";
      row.setAttribute("role", "listitem");
      if (flash && i === 0) row.classList.add("is-new");
      const av = document.createElement("span");
      av.className = "msg__av";
      av.textContent = o.name.trim().charAt(0).toUpperCase();
      const main = document.createElement("span");
      main.className = "msg__main";
      const b = document.createElement("b");
      b.textContent = o.name;
      const small = document.createElement("small");
      small.textContent = describe(o.cfg);
      main.append(b, small);
      const meta = document.createElement("span");
      meta.className = "msg__meta";
      const price = document.createElement("strong");
      price.textContent = `€${r.total}`;
      const when = document.createElement("span");
      when.textContent = o.hours === 0 ? tx("time.now") : tx("time.h", o.hours);
      const tagWrap = document.createElement("div");
      const tg = document.createElement("span");
      tg.className = `tag${o.status === "new" ? " tag--new" : o.status === "done" ? " tag--done" : ""}`;
      tg.textContent = tx(`st.${o.status}`);
      tagWrap.appendChild(tg);
      meta.append(price, when, tagWrap);
      row.append(av, main, meta);
      inbox.appendChild(row);
    });
    flash = false;
    $("#statOrders").textContent = orders.length;
    $("#statProd").textContent = orders.filter((o) => o.status === "prod").length;
  };

  const renderMails = () => {
    const box = $("#mails");
    if (!lastSent) {
      box.hidden = true;
      return;
    }
    const s = lastSent;
    const r = resolve(s.cfg);
    const first = s.name.split(" ")[0];
    $("#mail1To").textContent = tx("mail.to", cfg.email || "info@your-domain.com");
    $("#mail1Subj").textContent = tx("mail1.subj", s.name);
    $("#mail1Body").textContent = tx("mail1.body", s.name, s.email, describe(s.cfg), r.total, tx("days", r.days));
    $("#mail2To").textContent = tx("mail.to", s.email);
    $("#mail2Subj").textContent = tx("mail2.subj");
    $("#mail2Body").textContent = tx("mail2.body", first, r.total, tx("days", r.days));
    box.hidden = false;
  };

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2800);
  }

  const resetForm = () => {
    form.reset();
    [fName, fEmail].forEach((i) => {
      field(i).classList.remove("is-error", "field--ok");
      i.removeAttribute("aria-invalid");
    });
    $("#consentErr").hidden = true;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    checkName(true);
    checkEmail(true);
    const okName = validName();
    const okEmail = emailState() === "ok";
    const okConsent = fConsent.checked;
    if (!okName) setState(fName, true, false);
    if (!okEmail) setState(fEmail, true, false);
    $("#consentErr").hidden = okConsent;
    if (!okName) return fName.focus();
    if (!okEmail) return fEmail.focus();
    if (!okConsent) return fConsent.focus();

    const sent = { name: fName.value.trim(), email: fEmail.value.trim(), cfg: snapshot(), hours: 0, status: "new" };
    orders.unshift(sent);
    lastSent = sent;
    flash = true;
    renderInbox();
    renderMails();
    toast(tx("toast.sent", sent.name));
    resetForm();
  });

  $("#resetDemo").addEventListener("click", () => {
    orders = seed();
    lastSent = null;
    renderInbox();
    renderMails();
  });

  onLangChange.push(() => {
    renderConfig(false);
    renderInbox();
    renderMails();
    if (emailState() !== "empty") checkEmail(false);
  });

  /* ---------- Старт ---------- */
  renderConfig(false);
  renderInbox();
  $("#emailErr").textContent = tx("err.email");
})();
