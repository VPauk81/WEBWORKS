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


  /* ---------- Страны для телефона (digits — количество цифр национального номера) ---------- */
  const COUNTRIES = [
    ["PL", "+48", 9], ["DE", "+49", 11], ["GB", "+44", 10], ["US", "+1", 10], ["FR", "+33", 9],
    ["IT", "+39", 10], ["ES", "+34", 9], ["NL", "+31", 9], ["BE", "+32", 9], ["AT", "+43", 10],
    ["CH", "+41", 9], ["CZ", "+420", 9], ["SK", "+421", 9], ["HU", "+36", 9], ["RO", "+40", 9],
    ["BG", "+359", 9], ["UA", "+380", 9], ["LT", "+370", 8], ["LV", "+371", 8], ["EE", "+372", 8],
    ["SE", "+46", 9], ["NO", "+47", 8], ["DK", "+45", 8], ["FI", "+358", 9], ["IE", "+353", 9],
    ["PT", "+351", 9], ["GR", "+30", 10], ["TR", "+90", 10], ["CA", "+1", 10], ["RU", "+7", 10],
    ["BY", "+375", 9], ["HR", "+385", 9],
  ].map(([iso, code, digits]) => ({ iso, code, digits }));
  let country = COUNTRIES[0];
  const flagUrl = (iso) => `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
  const countryName = (iso) => {
    try {
      return new Intl.DisplayNames([lang], { type: "region" }).of(iso) || iso;
    } catch (e) {
      return iso;
    }
  };

  /* ---------- Форма ---------- */
  const form = $("#contactForm");
  const fName = $("#fName");
  const fEmail = $("#fEmail");
  const fPhone = $("#fPhone");
  const fTopic = $("#fTopic");
  const fMsg = $("#fMsg");
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
  const phoneDigits = () => fPhone.value.replace(/\D/g, "");
  const validMsg = () => fMsg.value.trim().length >= 10;

  const checkName = (final) => setState(fName, fName.value !== "" && !validName() && (final || fName.value.trim().length > 1), validName());
  const checkEmail = (final) => {
    const s = emailState();
    $("#emailErr").textContent = tx(s === "latin" ? "err.emailLatin" : "err.email");
    setState(fEmail, s === "latin" || (s === "bad" && final), s === "ok");
  };
  const checkPhone = (final) => {
    const n = phoneDigits().length;
    $("#phoneErr").textContent = tx("err.phone", country.digits);
    const bad = n > country.digits || (final && n !== country.digits && n > 0);
    setState(fPhone, bad, n === country.digits);
  };
  const checkMsg = (final) => setState(fMsg, final && !validMsg(), validMsg());

  fName.addEventListener("input", () => checkName(false));
  fName.addEventListener("blur", () => checkName(true));
  fEmail.addEventListener("input", () => checkEmail(false));
  fEmail.addEventListener("blur", () => checkEmail(true));
  fPhone.addEventListener("input", () => {
    const cleaned = fPhone.value.replace(/[^\d\s\-]/g, "");
    if (cleaned !== fPhone.value) fPhone.value = cleaned;
    checkPhone(false);
  });
  fPhone.addEventListener("blur", () => checkPhone(true));
  fMsg.addEventListener("input", () => {
    $("#msgCount").textContent = `${fMsg.value.length} / 300`;
    checkMsg(false);
  });
  fMsg.addEventListener("blur", () => checkMsg(true));
  fConsent.addEventListener("change", () => ($("#consentErr").hidden = fConsent.checked));

  /* ---------- Выбор страны ---------- */
  const cc = $("#cc");
  const ccBtn = $("#ccBtn");
  const ccList = $("#ccList");
  const placeholder = () => {
    const digits = "5123456789012".slice(0, country.digits);
    fPhone.placeholder = digits.match(/.{1,3}/g).join(" ");
  };
  const renderCountries = () => {
    ccList.textContent = "";
    const items = COUNTRIES.map((c) => ({ ...c, name: countryName(c.iso) })).sort((a, b) => (a.iso === "PL" ? -1 : b.iso === "PL" ? 1 : a.name.localeCompare(b.name, lang)));
    items.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "option");
      b.className = c.iso === country.iso ? "is-sel" : "";
      const img = document.createElement("img");
      img.src = flagUrl(c.iso);
      img.alt = "";
      img.width = 24;
      img.height = 17;
      img.loading = "lazy";
      const nm = document.createElement("span");
      nm.textContent = c.name;
      const code = document.createElement("em");
      code.textContent = c.code;
      b.append(img, nm, code);
      b.addEventListener("click", () => {
        country = COUNTRIES.find((x) => x.iso === c.iso);
        $("#ccFlag").src = flagUrl(country.iso);
        $("#ccCode").textContent = country.code;
        ccBtn.setAttribute("aria-label", c.name);
        setCc(false);
        placeholder();
        if (phoneDigits().length) checkPhone(true);
        else field(fPhone).classList.remove("is-error", "field--ok");
        fPhone.focus();
      });
      ccList.appendChild(b);
    });
  };
  const setCc = (open) => {
    ccList.hidden = !open;
    ccBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      renderCountries();
      const sel = $(".is-sel", ccList);
      if (sel) ccList.scrollTop = sel.offsetTop - 60;
    }
  };
  ccBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setCc(ccList.hidden);
  });
  document.addEventListener("click", (e) => {
    if (!cc.contains(e.target)) setCc(false);
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && setCc(false));

  /* ---------- Входящие ---------- */
  const TOPIC_KEYS = ["tp.1", "tp.2", "tp.3"];
  const seed = () => [
    { name: "Marta Nowak", topic: 0, seed: "seed.1", hours: 2 },
    { name: "Lukas Weber", topic: 1, seed: "seed.2", hours: 5 },
    { name: "Elena Petrova", topic: 2, seed: "seed.3", hours: 9 },
  ];
  let messages = seed();
  let lastSent = null;
  let flash = false;

  const inbox = $("#inbox");
  const renderInbox = () => {
    inbox.textContent = "";
    messages.forEach((m, i) => {
      const row = document.createElement("div");
      row.className = "msg";
      row.setAttribute("role", "listitem");
      if (flash && i === 0) row.classList.add("is-new");
      const av = document.createElement("span");
      av.className = "msg__av";
      av.textContent = m.name.trim().charAt(0).toUpperCase();
      const main = document.createElement("span");
      main.className = "msg__main";
      const b = document.createElement("b");
      b.textContent = m.name;
      const small = document.createElement("small");
      small.textContent = m.seed ? tx(m.seed) : m.text;
      main.append(b, small);
      const meta = document.createElement("span");
      meta.className = "msg__meta";
      meta.textContent = m.hours === 0 ? tx("time.now") : tx("time.h", m.hours);
      const tag = document.createElement("div");
      const tg = document.createElement("span");
      tg.className = "tag" + (m.hours === 0 ? " tag--new" : "");
      tg.textContent = tx(TOPIC_KEYS[m.topic]);
      tag.appendChild(tg);
      meta.appendChild(tag);
      row.append(av, main, meta);
      inbox.appendChild(row);
    });
    flash = false;
    $("#statMsgs").textContent = messages.length;
    $("#statNew").textContent = messages.filter((m) => m.hours === 0).length;
  };

  const renderMails = () => {
    const box = $("#mails");
    if (!lastSent) {
      box.hidden = true;
      return;
    }
    const s = lastSent;
    const first = s.name.split(" ")[0];
    $("#mail1To").textContent = tx("mail.to", cfg.email || "info@your-domain.com");
    $("#mail1Subj").textContent = tx("mail1.subj", s.name);
    $("#mail1Body").textContent = tx("mail1.body", s.name, s.email, s.phone, tx(TOPIC_KEYS[s.topic]), s.text);
    $("#mail2To").textContent = tx("mail.to", s.email);
    $("#mail2Subj").textContent = tx("mail2.subj");
    $("#mail2Body").textContent = tx("mail2.body", first);
    box.hidden = false;
  };

  let toastTimer;
  const toast = (msg) => {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2800);
  };

  const resetForm = () => {
    form.reset();
    $("#msgCount").textContent = "0 / 300";
    [fName, fEmail, fPhone, fMsg].forEach((i) => {
      field(i).classList.remove("is-error", "field--ok");
      i.removeAttribute("aria-invalid");
    });
    $("#consentErr").hidden = true;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    checkName(true);
    checkEmail(true);
    checkPhone(true);
    checkMsg(true);
    const okName = validName();
    const okEmail = emailState() === "ok";
    const okPhone = phoneDigits().length === country.digits;
    const okMsg = validMsg();
    const okConsent = fConsent.checked;
    if (!okName) setState(fName, true, false);
    if (!okEmail) setState(fEmail, true, false);
    if (!okPhone) setState(fPhone, true, false);
    $("#consentErr").hidden = okConsent;
    if (!okName) return fName.focus();
    if (!okEmail) return fEmail.focus();
    if (!okPhone) return fPhone.focus();
    if (!okMsg) return fMsg.focus();
    if (!okConsent) return fConsent.focus();

    const sent = {
      name: fName.value.trim(),
      email: fEmail.value.trim(),
      phone: `${country.code} ${phoneDigits()}`,
      topic: Number(fTopic.value),
      text: fMsg.value.trim(),
      hours: 0,
    };
    messages.unshift(sent);
    lastSent = sent;
    flash = true;
    renderInbox();
    renderMails();
    toast(tx("toast.sent", sent.name));
    resetForm();
  });

  $("#resetDemo").addEventListener("click", () => {
    messages = seed();
    lastSent = null;
    renderInbox();
    renderMails();
  });

  onLangChange.push(() => {
    renderInbox();
    renderMails();
    renderCountries();
    ccBtn.setAttribute("aria-label", countryName(country.iso));
    checkPhone(false);
    if (emailState() !== "empty") checkEmail(false);
  });

  /* ---------- Старт ---------- */
  placeholder();
  renderInbox();
  renderCountries();
  $("#phoneErr").textContent = tx("err.phone", country.digits);
})();
