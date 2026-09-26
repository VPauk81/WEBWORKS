(function(){
  "use strict";

  /* ========================================================
     TRANSLATIONS
     Edit the text on the right-hand side of each ":" to change
     what appears on the site. Keys must stay the same, since
     they are matched to data-i18n="..." attributes in the HTML.
     ======================================================== */
  var TRANSLATIONS = {
    en: {
      meta_title: "Web Development & Business Solutions | WEBWORKS",
      meta_description: "Websites, online calculators, product configurators and business tools for small and medium businesses across Europe.",

      nav_services: "Services", nav_projects: "Projects", nav_process: "Process", nav_contact: "Contact", nav_cta: "Start a Project",

      hero_title: "Practical web tools for businesses that want things to just work.",
      hero_sub: "Websites, online calculators, configurators and order systems for small and medium businesses across Europe.",
      hero_cta_primary: "View Projects", hero_cta_secondary: "Start a Project",
      stat_languages: "languages supported", stat_services: "services offered", stat_mobile: "mobile-friendly",

      services_title: "Services",
      services_intro: "Practical web solutions for small and medium businesses — from a single landing page to a full configurator with order automation.",
      service_1_t: "Business Websites", service_1_d: "Clear, fast websites that explain what you do and make it easy to get in touch.",
      service_2_t: "Landing Pages", service_2_d: "Focused single-page sites built around one offer and one clear action.",
      service_3_t: "Online Calculators", service_3_d: "Interactive price or estimate calculators your customers can use themselves.",
      service_4_t: "Product Configurators", service_4_d: "Step-by-step configurators for choosing components, options and add-ons.",
      service_5_t: "Order Forms", service_5_d: "Structured forms that collect exactly the information you need, cleanly.",
      service_6_t: "Google Sheets Integration", service_6_d: "Orders and form submissions saved automatically to a spreadsheet you already use.",
      service_7_t: "Automatic Email Notifications", service_7_d: "You and your customer are both notified the moment an order comes in.",
      service_8_t: "Custom Business Tools", service_8_d: "Small internal tools built around how your business actually works.",
      service_9_t: "Mobile-friendly Websites", service_9_d: "Every project is built and tested to work properly on a phone first.",

      build_title: "What I Build",
      build_intro: "The same core pieces, combined differently for each business.",
      build_1_t: "Business Websites", build_1_d: "A clear online presence for your business.",
      build_2_t: "Online Calculators", build_2_d: "Instant estimates based on customer input.",
      build_3_t: "Product Configurators", build_3_d: "Guided selection of components and options.",
      build_4_t: "Order Systems", build_4_d: "Structured requests from customer to inbox.",
      build_5_t: "Google Sheets Integrations", build_5_d: "Orders logged where you already work.",
      build_6_t: "Email Automation", build_6_d: "Automatic notifications for every order.",
      build_7_t: "Custom Web Applications", build_7_d: "Small tools shaped around your workflow.",
      build_8_t: "Mobile-first Design", build_8_d: "Built for a phone screen, not just a desktop.",

      projects_title: "Selected Projects",
      projects_intro: "Demo concepts built to show how the finished product could look and work — not live client projects.",
      project_demo_tag: "Demo concept",

      featured_badge: "Live project — not a demo",
      featured_title: "Arduino / ESP32 Firmware Studio",
      featured_desc: "A real, deployed ordering site I built and run myself — pick a controller, modules and options, and the price is calculated automatically, with the order sent straight to me. This is exactly the kind of site I can build for your business.",
      featured_cta: "Open Live Site →",
      featured_device_mobile: "Works great on phone",
      featured_device_tablet: "and tablet",
      featured_device_desktop: "too — try it on your phone",

      p1_category: "Auto Service", p1_title: "Service Calculator",
      p1_desc: "Website with services, pricing and an interactive calculator for customer requests.",
      p1_mock_title: "Brake Service Estimate", p1_mock_label1: "Vehicle type", p1_mock_label2: "Service type", p1_mock_total_label: "Estimated total",
      p1_opt_v1: "Compact car", p1_opt_v2: "Sedan", p1_opt_v3: "SUV / Van",
      p1_opt_s1: "Inspection", p1_opt_s2: "Pad replacement", p1_opt_s3: "Full brake overhaul",

      p2_category: "Barbershop", p2_title: "Booking Website",
      p2_desc: "Modern presentation website with services, prices and appointment request functionality.",
      p2_mock_title: "Book an Appointment", p2_service1: "Haircut", p2_service2: "Beard trim", p2_service3: "Haircut & beard",
      p2_mock_cta: "Request Appointment",

      p3_category: "Electronics", p3_title: "Product Configurator",
      p3_desc: "Configurator for selecting controllers, displays and additional modules, with automatic price calculation — built for Arduino / ESP32 hardware projects.",
      p3_mock_title: "Board Configurator", p3_mock_label1: "Controller", p3_mock_label2: "Display", p3_mock_total_label: "Configuration total",
      p3_opt_b1: "Arduino Uno", p3_opt_b2: "ESP8266", p3_opt_b3: "ESP32",
      p3_opt_d1: "None", p3_opt_d2: "LCD 16x2", p3_opt_d3: "OLED", p3_opt_d4: "TFT touch",
      p3_mod1: "Wi-Fi module", p3_mod2: "Relay module", p3_mod3: "Sensor kit",

      p4_category: "Business Tools", p4_title: "Order Management",
      p4_desc: "Order form connected to Google Sheets, with automatic email notifications and order status management.",
      p4_mock_title: "Orders", p4_status_new: "New", p4_status_progress: "Processing", p4_status_done: "Shipped",

      p5_category: "Contact Forms", p5_title: "Clear Contact Form",
      p5_desc: "A demo of a clean, easy-to-understand contact form with live validation — a real name check, an email check against common domain endings, and a phone field with a real country/dial-code picker, so the number is checked against the right length for the chosen country. This preview doesn't send anything; a live version would connect to email, Google Sheets, or your CRM.",
      p5_mock_title: "New Order", p5_label_name: "Name", p5_ph_name: "John Smith",
      p5_label_email: "Email", p5_ph_email: "name@mail.com",
      p5_label_phone: "Phone", p5_ph_phone: "512 345 678",
      p5_submit: "Send Request",
      p5_demo_sent: "Demo only — this is where a real submission confirmation would appear.",
      p5_email_latin_only: "⚠ Email can only be entered using Latin letters and digits (Cyrillic and special characters like * / are not allowed)",

      process_title: "How It Works", process_intro: "A short, clear process from first message to a live site.",
      process_1_t: "Discuss", process_1_d: "We talk through what you need, who it's for, and what success looks like.",
      process_2_t: "Build", process_2_d: "I design and build the site or tool, keeping you updated as it takes shape.",
      process_3_t: "Review", process_3_d: "You test everything, and we adjust the details so it fits how you work.",
      process_4_t: "Launch", process_4_d: "The project goes live, and you get everything you need to keep running it.",

      why_title: "Why Work With Me", why_intro: "No agency overhead, no inflated promises — just a direct way of working.",
      why_1_t: "Practical solutions", why_1_d: "Built around what your business actually needs, not extra features you'll never use.",
      why_2_t: "Mobile-friendly", why_2_d: "Every project works properly on a phone, not only on a desktop screen.",
      why_3_t: "Clear communication", why_3_d: "You'll always know what stage the project is at and what happens next.",
      why_4_t: "Custom functionality", why_4_d: "Calculators, configurators and forms built around your exact process.",
      why_5_t: "Fast development", why_5_d: "Small, focused projects that move quickly without cutting corners.",
      why_6_t: "Transparent process", why_6_d: "No hidden steps — you can see the project as it's being built.",

      share_copy: "Copy Link", share_copied: "Copied!", share_button: "Share", share_channel_title: "Share the site",

      contact_line1: "Have a project?", contact_line2: "Let's build it.", contact_cta: "Contact Me",

      inquiry_title: "Tell me about your project", inquiry_intro: "Write in whatever language is easiest for you — describe what you want, and I'll reply by email.",
      inquiry_label_name: "Your name", inquiry_ph_name: "John Smith",
      inquiry_label_email: "Your email", inquiry_ph_email: "name@mail.com",
      inquiry_label_phone: "Phone (optional)", inquiry_ph_phone: "512 345 678",
      inquiry_messenger_question: "This number also has:",
      inquiry_label_message: "What do you want on your site?", inquiry_ph_message: "Describe your business, what the site should do, any examples you like...",
      inquiry_err_name: "Please enter your name.",
      inquiry_err_email_required: "Please enter your email.",
      inquiry_err_email_invalid: "Please enter a valid email address.",
      inquiry_err_phone_invalid: "Check the phone number for the selected country.",
      inquiry_err_message: "Please describe your project.",
      inquiry_submit: "Send",
      inquiry_note: "Sent straight to me — write in your own language, no phone call needed.",
      inquiry_sent: "Sent! I'll get back to you by email.",
      inquiry_sent_btn: "Sent ✓",
      contact_whatsapp_link: "Message me",
      contact_github_link: "View on GitHub",
      footer_rights: "All rights reserved."
    },

    pl: {
      meta_title: "Tworzenie Stron i Rozwiązania Biznesowe | WEBWORKS",
      meta_description: "Strony internetowe, kalkulatory online, konfiguratory produktów i narzędzia biznesowe dla małych i średnich firm w Europie.",

      nav_services: "Usługi", nav_projects: "Projekty", nav_process: "Proces", nav_contact: "Kontakt", nav_cta: "Rozpocznij projekt",

      hero_title: "Praktyczne narzędzia webowe dla firm, które chcą, by wszystko po prostu działało.",
      hero_sub: "Strony internetowe, kalkulatory online, konfiguratory i systemy zamówień dla małych i średnich firm w całej Europie.",
      hero_cta_primary: "Zobacz projekty", hero_cta_secondary: "Rozpocznij projekt",
      stat_languages: "obsługiwane języki", stat_services: "oferowanych usług", stat_mobile: "przyjazne mobilnie",

      services_title: "Usługi",
      services_intro: "Praktyczne rozwiązania webowe dla małych i średnich firm — od pojedynczej strony docelowej po pełny konfigurator z automatyzacją zamówień.",
      service_1_t: "Strony firmowe", service_1_d: "Przejrzyste, szybkie strony, które jasno pokazują czym się zajmujesz i ułatwiają kontakt.",
      service_2_t: "Strony docelowe (Landing Page)", service_2_d: "Jednostronicowe witryny skupione wokół jednej oferty i jednego jasnego działania.",
      service_3_t: "Kalkulatory online", service_3_d: "Interaktywne kalkulatory cen lub wycen, z których klienci korzystają samodzielnie.",
      service_4_t: "Konfiguratory produktów", service_4_d: "Konfiguratory krok po kroku do wyboru komponentów, opcji i dodatków.",
      service_5_t: "Formularze zamówień", service_5_d: "Uporządkowane formularze zbierające dokładnie te informacje, których potrzebujesz.",
      service_6_t: "Integracja z Google Sheets", service_6_d: "Zamówienia i zgłoszenia z formularzy zapisywane automatycznie w arkuszu, z którego już korzystasz.",
      service_7_t: "Automatyczne powiadomienia e-mail", service_7_d: "Ty i Twój klient otrzymujecie powiadomienie w chwili złożenia zamówienia.",
      service_8_t: "Narzędzia biznesowe na zamówienie", service_8_d: "Niewielkie narzędzia wewnętrzne dopasowane do sposobu działania Twojej firmy.",
      service_9_t: "Strony przyjazne urządzeniom mobilnym", service_9_d: "Każdy projekt jest budowany i testowany tak, by dobrze działać na telefonie.",

      build_title: "Co tworzę",
      build_intro: "Te same podstawowe elementy, łączone inaczej dla każdej firmy.",
      build_1_t: "Strony firmowe", build_1_d: "Przejrzysta obecność online dla Twojej firmy.",
      build_2_t: "Kalkulatory online", build_2_d: "Natychmiastowe wyceny na podstawie danych klienta.",
      build_3_t: "Konfiguratory produktów", build_3_d: "Prowadzony wybór komponentów i opcji.",
      build_4_t: "Systemy zamówień", build_4_d: "Uporządkowane zgłoszenia od klienta aż do skrzynki mailowej.",
      build_5_t: "Integracje z Google Sheets", build_5_d: "Zamówienia zapisywane tam, gdzie już pracujesz.",
      build_6_t: "Automatyzacja e-mail", build_6_d: "Automatyczne powiadomienia o każdym zamówieniu.",
      build_7_t: "Aplikacje webowe na zamówienie", build_7_d: "Niewielkie narzędzia dopasowane do Twojego procesu pracy.",
      build_8_t: "Design mobile-first", build_8_d: "Zaprojektowane pod ekran telefonu, nie tylko pod komputer.",

      projects_title: "Wybrane projekty",
      projects_intro: "Koncepcje demonstracyjne pokazujące, jak mógłby wyglądać i działać gotowy produkt — nie są to realizacje dla klientów.",
      project_demo_tag: "Koncepcja demo",

      featured_badge: "Projekt na żywo — to nie demo",
      featured_title: "Arduino / ESP32 Firmware Studio",
      featured_desc: "Prawdziwa, działająca strona zamówień, którą sam zbudowałem i prowadzę — wybierasz sterownik, moduły i opcje, cena liczy się automatycznie, a zamówienie trafia prosto do mnie. Dokładnie taką stronę mogę zbudować dla Twojej firmy.",
      featured_cta: "Otwórz stronę na żywo →",
      featured_device_mobile: "Świetnie działa na telefonie",
      featured_device_tablet: "i tablecie",
      featured_device_desktop: "też — sprawdź na swoim telefonie",

      p1_category: "Serwis samochodowy", p1_title: "Kalkulator serwisowy",
      p1_desc: "Strona z usługami, cennikiem i interaktywnym kalkulatorem dla zgłoszeń klientów.",
      p1_mock_title: "Wycena serwisu hamulców", p1_mock_label1: "Typ pojazdu", p1_mock_label2: "Rodzaj usługi", p1_mock_total_label: "Szacowana kwota",
      p1_opt_v1: "Samochód kompaktowy", p1_opt_v2: "Sedan", p1_opt_v3: "SUV / Van",
      p1_opt_s1: "Przegląd", p1_opt_s2: "Wymiana klocków", p1_opt_s3: "Pełny remont hamulców",

      p2_category: "Fryzjer męski (barbershop)", p2_title: "Strona z rezerwacją",
      p2_desc: "Nowoczesna strona prezentacyjna z usługami, cenami i możliwością zgłoszenia wizyty.",
      p2_mock_title: "Zarezerwuj wizytę", p2_service1: "Strzyżenie", p2_service2: "Trymowanie brody", p2_service3: "Strzyżenie i broda",
      p2_mock_cta: "Zgłoś wizytę",

      p3_category: "Elektronika", p3_title: "Konfigurator produktu",
      p3_desc: "Konfigurator do wyboru sterowników, wyświetlaczy i dodatkowych modułów, z automatycznym przeliczaniem ceny — zbudowany pod projekty na Arduino / ESP32.",
      p3_mock_title: "Konfigurator płytki", p3_mock_label1: "Sterownik", p3_mock_label2: "Wyświetlacz", p3_mock_total_label: "Suma konfiguracji",
      p3_opt_b1: "Arduino Uno", p3_opt_b2: "ESP8266", p3_opt_b3: "ESP32",
      p3_opt_d1: "Brak", p3_opt_d2: "LCD 16x2", p3_opt_d3: "OLED", p3_opt_d4: "TFT dotykowy",
      p3_mod1: "Moduł Wi-Fi", p3_mod2: "Moduł przekaźnikowy", p3_mod3: "Zestaw czujników",

      p4_category: "Narzędzia biznesowe", p4_title: "Zarządzanie zamówieniami",
      p4_desc: "Formularz zamówień połączony z Google Sheets, z automatycznymi powiadomieniami e-mail i zarządzaniem statusem zamówienia.",
      p4_mock_title: "Zamówienia", p4_status_new: "Nowe", p4_status_progress: "W realizacji", p4_status_done: "Wysłane",

      p5_category: "Formularze kontaktowe", p5_title: "Przejrzysty formularz kontaktowy",
      p5_desc: "Demo przejrzystego, łatwego do zrozumienia formularza kontaktowego z walidacją na żywo — sprawdzenie imienia, weryfikacja e-maila pod kątem typowych końcówek domen oraz pole telefonu z prawdziwym wyborem kraju/numeru kierunkowego, dzięki czemu numer jest sprawdzany pod kątem właściwej długości dla wybranego kraju. Ten podgląd niczego nie wysyła — wersja produkcyjna łączyłaby się z e-mailem, Google Sheets lub Twoim CRM.",
      p5_mock_title: "Nowe zamówienie", p5_label_name: "Imię", p5_ph_name: "Jan Kowalski",
      p5_label_email: "Email", p5_ph_email: "imie@mail.com",
      p5_label_phone: "Telefon", p5_ph_phone: "512 345 678",
      p5_submit: "Wyślij zapytanie",
      p5_demo_sent: "Tylko demo — tu pojawiłoby się potwierdzenie prawdziwego zgłoszenia.",
      p5_email_latin_only: "⚠ Adres Email można wpisywać tylko literami łacińskimi i cyframi (cyrylica i znaki specjalne jak * / są niedozwolone)",

      process_title: "Jak to wygląda", process_intro: "Krótki, jasny proces od pierwszej wiadomości do działającej strony.",
      process_1_t: "Rozmowa", process_1_d: "Omawiamy, czego potrzebujesz, dla kogo jest strona i jak wygląda sukces projektu.",
      process_2_t: "Budowa", process_2_d: "Projektuję i buduję stronę lub narzędzie, informując Cię na bieżąco o postępach.",
      process_3_t: "Weryfikacja", process_3_d: "Testujesz wszystko, a my dopracowujemy szczegóły, by pasowały do Twojej pracy.",
      process_4_t: "Publikacja", process_4_d: "Projekt trafia online, a Ty otrzymujesz wszystko, czego potrzebujesz, by nim zarządzać.",

      why_title: "Dlaczego warto ze mną pracować", why_intro: "Bez kosztów agencji, bez wyolbrzymionych obietnic — po prostu bezpośrednia współpraca.",
      why_1_t: "Praktyczne rozwiązania", why_1_d: "Dopasowane do realnych potrzeb Twojej firmy, bez zbędnych funkcji, których nigdy nie użyjesz.",
      why_2_t: "Przyjazność mobilna", why_2_d: "Każdy projekt działa poprawnie na telefonie, nie tylko na ekranie komputera.",
      why_3_t: "Jasna komunikacja", why_3_d: "Zawsze wiesz, na jakim etapie jest projekt i co będzie dalej.",
      why_4_t: "Funkcje na zamówienie", why_4_d: "Kalkulatory, konfiguratory i formularze dopasowane do Twojego procesu.",
      why_5_t: "Szybka realizacja", why_5_d: "Niewielkie, skoncentrowane projekty realizowane sprawnie i bez uproszczeń.",
      why_6_t: "Przejrzysty proces", why_6_d: "Żadnych ukrytych etapów — widzisz projekt na każdym kroku jego powstawania.",

      share_copy: "Kopiuj link", share_copied: "Skopiowano!", share_button: "Udostępnij", share_channel_title: "Udostępnij stronę",

      contact_line1: "Masz projekt?", contact_line2: "Zbudujmy go.", contact_cta: "Napisz do mnie",

      inquiry_title: "Opowiedz mi o swoim projekcie", inquiry_intro: "Napisz w języku, w którym Ci najwygodniej — opisz, czego potrzebujesz, a odpowiem mailem.",
      inquiry_label_name: "Twoje imię", inquiry_ph_name: "Jan Kowalski",
      inquiry_label_email: "Twój email", inquiry_ph_email: "imie@mail.com",
      inquiry_label_phone: "Telefon (opcjonalnie)", inquiry_ph_phone: "512 345 678",
      inquiry_messenger_question: "Pod tym numerem dostępne są też:",
      inquiry_label_message: "Co ma się znaleźć na Twojej stronie?", inquiry_ph_message: "Opisz swoją firmę, co strona powinna robić, przykłady, które Ci się podobają...",
      inquiry_err_name: "Podaj swoje imię.",
      inquiry_err_email_required: "Podaj swój email.",
      inquiry_err_email_invalid: "Podaj poprawny adres email.",
      inquiry_err_phone_invalid: "Sprawdź numer telefonu dla wybranego kraju.",
      inquiry_err_message: "Opisz swój projekt.",
      inquiry_submit: "Wyślij",
      inquiry_note: "Trafia prosto do mnie — pisz w swoim języku, bez telefonowania.",
      inquiry_sent: "Wysłano! Odpowiem mailem.",
      inquiry_sent_btn: "Wysłano ✓",
      contact_whatsapp_link: "Napisz do mnie",
      contact_github_link: "Zobacz na GitHub",
      footer_rights: "Wszelkie prawa zastrzeżone."
    },

    de: {
      meta_title: "Webentwicklung & Business-Lösungen | WEBWORKS",
      meta_description: "Websites, Online-Rechner, Produktkonfiguratoren und Business-Tools für kleine und mittlere Unternehmen in Europa.",

      nav_services: "Leistungen", nav_projects: "Projekte", nav_process: "Ablauf", nav_contact: "Kontakt", nav_cta: "Projekt starten",

      hero_title: "Praktische Web-Tools für Unternehmen, bei denen es einfach funktionieren soll.",
      hero_sub: "Websites, Online-Rechner, Konfiguratoren und Bestellsysteme für kleine und mittlere Unternehmen in ganz Europa.",
      hero_cta_primary: "Projekte ansehen", hero_cta_secondary: "Projekt starten",
      stat_languages: "unterstützte Sprachen", stat_services: "angebotene Leistungen", stat_mobile: "mobilfreundlich",

      services_title: "Leistungen",
      services_intro: "Praktische Web-Lösungen für kleine und mittlere Unternehmen — von einer einzelnen Landingpage bis zum vollständigen Konfigurator mit Bestellautomatisierung.",
      service_1_t: "Business-Websites", service_1_d: "Klare, schnelle Websites, die zeigen, was Sie tun, und die Kontaktaufnahme leicht machen.",
      service_2_t: "Landingpages", service_2_d: "Fokussierte Einzelseiten, aufgebaut um ein Angebot und eine klare Handlung.",
      service_3_t: "Online-Rechner", service_3_d: "Interaktive Preis- oder Kostenrechner, die Ihre Kunden selbst bedienen können.",
      service_4_t: "Produktkonfiguratoren", service_4_d: "Schrittweise Konfiguratoren zur Auswahl von Komponenten, Optionen und Zusätzen.",
      service_5_t: "Bestellformulare", service_5_d: "Strukturierte Formulare, die genau die Informationen erfassen, die Sie brauchen.",
      service_6_t: "Google-Sheets-Integration", service_6_d: "Bestellungen und Formulareingaben werden automatisch in einer Tabelle gespeichert, die Sie bereits nutzen.",
      service_7_t: "Automatische E-Mail-Benachrichtigungen", service_7_d: "Sie und Ihr Kunde werden benachrichtigt, sobald eine Bestellung eingeht.",
      service_8_t: "Individuelle Business-Tools", service_8_d: "Kleine interne Tools, gebaut nach der Arbeitsweise Ihres Unternehmens.",
      service_9_t: "Mobilfreundliche Websites", service_9_d: "Jedes Projekt wird zuerst für das Smartphone gebaut und getestet.",

      build_title: "Was ich baue",
      build_intro: "Dieselben Grundbausteine, für jedes Unternehmen anders kombiniert.",
      build_1_t: "Business-Websites", build_1_d: "Eine klare Online-Präsenz für Ihr Unternehmen.",
      build_2_t: "Online-Rechner", build_2_d: "Sofortige Kostenvoranschläge auf Basis von Kundeneingaben.",
      build_3_t: "Produktkonfiguratoren", build_3_d: "Geführte Auswahl von Komponenten und Optionen.",
      build_4_t: "Bestellsysteme", build_4_d: "Strukturierte Anfragen vom Kunden bis ins Postfach.",
      build_5_t: "Google-Sheets-Integrationen", build_5_d: "Bestellungen werden dort erfasst, wo Sie bereits arbeiten.",
      build_6_t: "E-Mail-Automatisierung", build_6_d: "Automatische Benachrichtigung bei jeder Bestellung.",
      build_7_t: "Individuelle Web-Anwendungen", build_7_d: "Kleine Tools, zugeschnitten auf Ihren Arbeitsablauf.",
      build_8_t: "Mobile-First-Design", build_8_d: "Gebaut für den Smartphone-Bildschirm, nicht nur für den Desktop.",

      projects_title: "Ausgewählte Projekte",
      projects_intro: "Demo-Konzepte, die zeigen, wie das fertige Produkt aussehen und funktionieren könnte — keine echten Kundenprojekte.",
      project_demo_tag: "Demo-Konzept",

      featured_badge: "Live-Projekt — keine Demo",
      featured_title: "Arduino / ESP32 Firmware Studio",
      featured_desc: "Eine echte, live geschaltete Bestellseite, die ich selbst gebaut habe und betreibe — Controller, Module und Optionen auswählen, der Preis wird automatisch berechnet, und die Bestellung geht direkt an mich. Genau so eine Seite kann ich auch für Ihr Unternehmen bauen.",
      featured_cta: "Live-Seite öffnen →",
      featured_device_mobile: "Funktioniert super auf dem Handy",
      featured_device_tablet: "und Tablet",
      featured_device_desktop: "auch — probieren Sie es auf Ihrem Handy aus",

      p1_category: "Kfz-Service", p1_title: "Service-Rechner",
      p1_desc: "Website mit Leistungen, Preisen und einem interaktiven Rechner für Kundenanfragen.",
      p1_mock_title: "Kostenvoranschlag Bremsenservice", p1_mock_label1: "Fahrzeugtyp", p1_mock_label2: "Leistung", p1_mock_total_label: "Geschätzter Preis",
      p1_opt_v1: "Kleinwagen", p1_opt_v2: "Limousine", p1_opt_v3: "SUV / Van",
      p1_opt_s1: "Inspektion", p1_opt_s2: "Bremsbelagwechsel", p1_opt_s3: "Komplette Bremsenüberholung",

      p2_category: "Barbershop", p2_title: "Buchungswebsite",
      p2_desc: "Moderne Präsentationswebsite mit Leistungen, Preisen und Terminanfrage-Funktion.",
      p2_mock_title: "Termin buchen", p2_service1: "Haarschnitt", p2_service2: "Bartschnitt", p2_service3: "Haarschnitt & Bart",
      p2_mock_cta: "Termin anfragen",

      p3_category: "Elektronik", p3_title: "Produktkonfigurator",
      p3_desc: "Konfigurator zur Auswahl von Controllern, Displays und zusätzlichen Modulen mit automatischer Preisberechnung — entwickelt für Arduino- / ESP32-Hardwareprojekte.",
      p3_mock_title: "Board-Konfigurator", p3_mock_label1: "Controller", p3_mock_label2: "Display", p3_mock_total_label: "Konfigurationssumme",
      p3_opt_b1: "Arduino Uno", p3_opt_b2: "ESP8266", p3_opt_b3: "ESP32",
      p3_opt_d1: "Keins", p3_opt_d2: "LCD 16x2", p3_opt_d3: "OLED", p3_opt_d4: "TFT Touch",
      p3_mod1: "WLAN-Modul", p3_mod2: "Relaismodul", p3_mod3: "Sensor-Kit",

      p4_category: "Business-Tools", p4_title: "Bestellverwaltung",
      p4_desc: "Bestellformular verbunden mit Google Sheets, inklusive automatischer E-Mail-Benachrichtigungen und Statusverwaltung.",
      p4_mock_title: "Bestellungen", p4_status_new: "Neu", p4_status_progress: "In Bearbeitung", p4_status_done: "Versendet",

      p5_category: "Kontaktformulare", p5_title: "Übersichtliches Kontaktformular",
      p5_desc: "Eine Demo eines übersichtlichen, leicht verständlichen Kontaktformulars mit Live-Validierung — echte Namensprüfung, E-Mail-Prüfung anhand gängiger Domain-Endungen und ein Telefonfeld mit echter Länder-/Vorwahl-Auswahl, sodass die Nummer gegen die passende Länge für das gewählte Land geprüft wird. Diese Vorschau sendet nichts — eine Live-Version würde mit E-Mail, Google Sheets oder Ihrem CRM verbunden.",
      p5_mock_title: "Neue Bestellung", p5_label_name: "Name", p5_ph_name: "Max Mustermann",
      p5_label_email: "E-Mail", p5_ph_email: "name@mail.com",
      p5_label_phone: "Telefon", p5_ph_phone: "123 4567890",
      p5_submit: "Anfrage senden",
      p5_demo_sent: "Nur Demo — hier würde die Bestätigung einer echten Anfrage erscheinen.",
      p5_email_latin_only: "⚠ E-Mail darf nur mit lateinischen Buchstaben und Ziffern eingegeben werden (Kyrillisch und Sonderzeichen wie * / sind nicht erlaubt)",

      process_title: "So läuft es ab", process_intro: "Ein kurzer, klarer Ablauf von der ersten Nachricht bis zur Live-Website.",
      process_1_t: "Besprechen", process_1_d: "Wir klären, was Sie brauchen, für wen es ist und wie Erfolg für Sie aussieht.",
      process_2_t: "Umsetzen", process_2_d: "Ich entwerfe und baue die Website oder das Tool und halte Sie dabei auf dem Laufenden.",
      process_3_t: "Prüfen", process_3_d: "Sie testen alles, und wir passen Details an, damit es zu Ihrer Arbeitsweise passt.",
      process_4_t: "Live gehen", process_4_d: "Das Projekt geht online, und Sie erhalten alles, was Sie zur Verwaltung brauchen.",

      why_title: "Warum mit mir arbeiten", why_intro: "Kein Agentur-Overhead, keine übertriebenen Versprechen — einfach direkte Zusammenarbeit.",
      why_1_t: "Praktische Lösungen", why_1_d: "Gebaut nach dem, was Ihr Unternehmen wirklich braucht — nicht nach Funktionen, die nie genutzt werden.",
      why_2_t: "Mobilfreundlich", why_2_d: "Jedes Projekt funktioniert auf dem Smartphone genauso gut wie am Desktop.",
      why_3_t: "Klare Kommunikation", why_3_d: "Sie wissen immer, in welcher Phase das Projekt ist und was als Nächstes passiert.",
      why_4_t: "Individuelle Funktionen", why_4_d: "Rechner, Konfiguratoren und Formulare, gebaut für Ihren genauen Ablauf.",
      why_5_t: "Schnelle Umsetzung", why_5_d: "Kleine, fokussierte Projekte, die zügig vorankommen, ohne Abstriche bei der Qualität.",
      why_6_t: "Transparenter Prozess", why_6_d: "Keine versteckten Schritte — Sie sehen das Projekt während der Entstehung.",

      share_copy: "Link kopieren", share_copied: "Kopiert!", share_button: "Teilen", share_channel_title: "Seite teilen",

      contact_line1: "Haben Sie ein Projekt?", contact_line2: "Lassen Sie es uns bauen.", contact_cta: "Kontaktieren Sie mich",

      inquiry_title: "Erzählen Sie mir von Ihrem Projekt", inquiry_intro: "Schreiben Sie in der Sprache, die Ihnen am leichtesten fällt — beschreiben Sie, was Sie möchten, ich antworte per E-Mail.",
      inquiry_label_name: "Ihr Name", inquiry_ph_name: "Max Mustermann",
      inquiry_label_email: "Ihre E-Mail", inquiry_ph_email: "name@mail.com",
      inquiry_label_phone: "Telefon (optional)", inquiry_ph_phone: "512 345 678",
      inquiry_messenger_question: "Unter dieser Nummer erreichbar auch über:",
      inquiry_label_message: "Was soll auf Ihrer Website stehen?", inquiry_ph_message: "Beschreiben Sie Ihr Unternehmen, was die Website tun soll, Beispiele, die Ihnen gefallen ...",
      inquiry_err_name: "Bitte geben Sie Ihren Namen ein.",
      inquiry_err_email_required: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
      inquiry_err_email_invalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      inquiry_err_phone_invalid: "Überprüfen Sie die Telefonnummer für das ausgewählte Land.",
      inquiry_err_message: "Bitte beschreiben Sie Ihr Projekt.",
      inquiry_submit: "Senden",
      inquiry_note: "Geht direkt an mich — schreiben Sie in Ihrer eigenen Sprache, kein Anruf nötig.",
      inquiry_sent: "Gesendet! Ich melde mich per E-Mail.",
      inquiry_sent_btn: "Gesendet ✓",
      contact_whatsapp_link: "Schreiben Sie mir",
      contact_github_link: "Auf GitHub ansehen",
      footer_rights: "Alle Rechte vorbehalten."
    },

    ru: {
      meta_title: "Разработка сайтов и бизнес-решения | WEBWORKS",
      meta_description: "Сайты, онлайн-калькуляторы, конфигураторы продукции и бизнес-инструменты для малого и среднего бизнеса в Европе.",

      nav_services: "Услуги", nav_projects: "Проекты", nav_process: "Процесс", nav_contact: "Контакты", nav_cta: "Начать проект",

      hero_title: "Практичные веб-инструменты для бизнеса, которому важно, чтобы всё просто работало.",
      hero_sub: "Сайты, онлайн-калькуляторы, конфигураторы и системы заказов для малого и среднего бизнеса в Европе.",
      hero_cta_primary: "Смотреть проекты", hero_cta_secondary: "Начать проект",
      stat_languages: "поддерживаемых языка", stat_services: "видов услуг", stat_mobile: "адаптация под мобильные",

      services_title: "Услуги",
      services_intro: "Практичные веб-решения для малого и среднего бизнеса — от одностраничного лендинга до полноценного конфигуратора с автоматизацией заказов.",
      service_1_t: "Сайты для бизнеса", service_1_d: "Понятные и быстрые сайты, которые ясно объясняют, чем вы занимаетесь, и облегчают связь с вами.",
      service_2_t: "Лендинги", service_2_d: "Одностраничные сайты, построенные вокруг одного предложения и одного чёткого действия.",
      service_3_t: "Онлайн-калькуляторы", service_3_d: "Интерактивные калькуляторы цены или стоимости, которыми клиенты пользуются самостоятельно.",
      service_4_t: "Конфигураторы продукции", service_4_d: "Пошаговые конфигураторы для выбора комплектующих, опций и дополнений.",
      service_5_t: "Формы заказа", service_5_d: "Структурированные формы, которые собирают именно ту информацию, что вам нужна.",
      service_6_t: "Интеграция с Google Sheets", service_6_d: "Заказы и заявки из форм автоматически сохраняются в таблице, которой вы уже пользуетесь.",
      service_7_t: "Автоматические email-уведомления", service_7_d: "Вы и ваш клиент получаете уведомление в момент оформления заказа.",
      service_8_t: "Индивидуальные бизнес-инструменты", service_8_d: "Небольшие внутренние инструменты, созданные под реальные процессы вашего бизнеса.",
      service_9_t: "Сайты для мобильных устройств", service_9_d: "Каждый проект создаётся и тестируется в первую очередь для телефона.",

      build_title: "Что я создаю",
      build_intro: "Одни и те же базовые элементы, по-разному собранные под каждый бизнес.",
      build_1_t: "Сайты для бизнеса", build_1_d: "Понятное присутствие вашего бизнеса в интернете.",
      build_2_t: "Онлайн-калькуляторы", build_2_d: "Мгновенный расчёт стоимости по данным клиента.",
      build_3_t: "Конфигураторы продукции", build_3_d: "Пошаговый выбор комплектующих и опций.",
      build_4_t: "Системы заказов", build_4_d: "Структурированные заявки от клиента до вашей почты.",
      build_5_t: "Интеграции с Google Sheets", build_5_d: "Заказы фиксируются там, где вы уже работаете.",
      build_6_t: "Автоматизация email", build_6_d: "Автоматические уведомления по каждому заказу.",
      build_7_t: "Индивидуальные веб-приложения", build_7_d: "Небольшие инструменты под ваш рабочий процесс.",
      build_8_t: "Mobile-first дизайн", build_8_d: "Спроектировано под экран телефона, а не только под компьютер.",

      projects_title: "Избранные проекты",
      projects_intro: "Демонстрационные концепты, показывающие, как мог бы выглядеть и работать готовый продукт — это не реальные проекты клиентов.",
      project_demo_tag: "Демо-концепт",

      featured_badge: "Реальный проект — не демо",
      featured_title: "Arduino / ESP32 Firmware Studio",
      featured_desc: "Настоящий, работающий сайт для приёма заказов, который я сам разработал и веду — выбираете контроллер, модули и опции, цена считается автоматически, а заказ приходит прямо мне. Именно такой сайт я могу сделать и для вашего бизнеса.",
      featured_cta: "Открыть рабочий сайт →",
      featured_device_mobile: "Отлично работает на телефоне",
      featured_device_tablet: "и планшете",
      featured_device_desktop: "тоже — проверьте на своём телефоне",

      p1_category: "Автосервис", p1_title: "Калькулятор услуг",
      p1_desc: "Сайт с услугами, ценами и интерактивным калькулятором для заявок клиентов.",
      p1_mock_title: "Расчёт стоимости ремонта тормозов", p1_mock_label1: "Тип автомобиля", p1_mock_label2: "Вид услуги", p1_mock_total_label: "Примерная стоимость",
      p1_opt_v1: "Компактный автомобиль", p1_opt_v2: "Седан", p1_opt_v3: "Внедорожник / Фургон",
      p1_opt_s1: "Диагностика", p1_opt_s2: "Замена колодок", p1_opt_s3: "Полный ремонт тормозной системы",

      p2_category: "Барбершоп", p2_title: "Сайт для записи",
      p2_desc: "Современный презентационный сайт с услугами, ценами и функцией записи на приём.",
      p2_mock_title: "Записаться на приём", p2_service1: "Стрижка", p2_service2: "Оформление бороды", p2_service3: "Стрижка и борода",
      p2_mock_cta: "Отправить заявку",

      p3_category: "Электроника", p3_title: "Конфигуратор продукта",
      p3_desc: "Конфигуратор для выбора контроллеров, дисплеев и дополнительных модулей с автоматическим расчётом цены — создан для проектов на Arduino / ESP32.",
      p3_mock_title: "Конфигуратор платы", p3_mock_label1: "Контроллер", p3_mock_label2: "Дисплей", p3_mock_total_label: "Итоговая стоимость",
      p3_opt_b1: "Arduino Uno", p3_opt_b2: "ESP8266", p3_opt_b3: "ESP32",
      p3_opt_d1: "Без дисплея", p3_opt_d2: "LCD 16x2", p3_opt_d3: "OLED", p3_opt_d4: "TFT сенсорный",
      p3_mod1: "Wi-Fi модуль", p3_mod2: "Модуль реле", p3_mod3: "Набор датчиков",

      p4_category: "Бизнес-инструменты", p4_title: "Управление заказами",
      p4_desc: "Форма заказа, связанная с Google Sheets, с автоматическими email-уведомлениями и управлением статусами заказов.",
      p4_mock_title: "Заказы", p4_status_new: "Новый", p4_status_progress: "В обработке", p4_status_done: "Отправлен",

      p5_category: "Формы контактов", p5_title: "Понятная форма контактной информации",
      p5_desc: "Демонстрация понятной формы контактной информации с проверкой полей в реальном времени — реальная проверка имени, проверка email по распространённым окончаниям доменов и поле телефона с настоящим выбором страны/кода, при котором номер проверяется на нужное количество цифр под выбранную страну. Эта форма ничего не отправляет — рабочая версия подключалась бы к email, Google Sheets или вашей CRM.",
      p5_mock_title: "Новый заказ", p5_label_name: "Имя", p5_ph_name: "Иван Иванов",
      p5_label_email: "Email", p5_ph_email: "name@mail.com",
      p5_label_phone: "Телефон", p5_ph_phone: "512 345 678",
      p5_submit: "Отправить заявку",
      p5_demo_sent: "Только демо — здесь появилось бы подтверждение реальной заявки.",
      p5_email_latin_only: "⚠ Email можно вводить только латинскими буквами и цифрами (кириллица и спецсимволы вроде * / не допускаются)",

      process_title: "Как проходит работа", process_intro: "Короткий и понятный процесс — от первого сообщения до работающего сайта.",
      process_1_t: "Обсуждение", process_1_d: "Обсуждаем, что вам нужно, для кого это, и как выглядит результат.",
      process_2_t: "Разработка", process_2_d: "Проектирую и создаю сайт или инструмент, держу вас в курсе по ходу работы.",
      process_3_t: "Проверка", process_3_d: "Вы тестируете всё, а мы дорабатываем детали под ваш рабочий процесс.",
      process_4_t: "Запуск", process_4_d: "Проект публикуется, и вы получаете всё необходимое для дальнейшей работы с ним.",

      why_title: "Почему стоит работать со мной", why_intro: "Без наценки агентства, без завышенных обещаний — просто прямая работа напрямую.",
      why_1_t: "Практичные решения", why_1_d: "Создаются под реальные потребности вашего бизнеса, без лишних функций, которыми вы никогда не воспользуетесь.",
      why_2_t: "Удобство на мобильных", why_2_d: "Каждый проект корректно работает на телефоне, а не только на экране компьютера.",
      why_3_t: "Понятная коммуникация", why_3_d: "Вы всегда знаете, на каком этапе находится проект и что будет дальше.",
      why_4_t: "Индивидуальный функционал", why_4_d: "Калькуляторы, конфигураторы и формы создаются под ваш конкретный процесс.",
      why_5_t: "Быстрая разработка", why_5_d: "Небольшие, сфокусированные проекты, которые движутся быстро без потери качества.",
      why_6_t: "Прозрачный процесс", why_6_d: "Никаких скрытых этапов — вы видите проект по мере его создания.",

      share_copy: "Копировать ссылку", share_copied: "Скопировано!", share_button: "Поделиться", share_channel_title: "Поделиться сайтом",

      contact_line1: "Есть проект?", contact_line2: "Давайте его реализуем.", contact_cta: "Написать мне",

      inquiry_title: "Расскажите о своём проекте", inquiry_intro: "Пишите на любом удобном вам языке — опишите, что вам нужно, и я отвечу по email.",
      inquiry_label_name: "Ваше имя", inquiry_ph_name: "Иван Иванов",
      inquiry_label_email: "Ваш email", inquiry_ph_email: "name@mail.com",
      inquiry_label_phone: "Телефон (необязательно)", inquiry_ph_phone: "512 345 678",
      inquiry_messenger_question: "На этом номере также есть:",
      inquiry_label_message: "Что вы хотите видеть на сайте?", inquiry_ph_message: "Опишите свой бизнес, что должен уметь сайт, примеры, которые вам нравятся...",
      inquiry_err_name: "Пожалуйста, введите ваше имя.",
      inquiry_err_email_required: "Пожалуйста, введите ваш email.",
      inquiry_err_email_invalid: "Введите корректный адрес email.",
      inquiry_err_phone_invalid: "Проверьте номер телефона для выбранной страны.",
      inquiry_err_message: "Опишите, пожалуйста, ваш проект.",
      inquiry_submit: "Отправить",
      inquiry_note: "Придёт прямо мне — пишите на своём языке, звонить не нужно.",
      inquiry_sent: "Отправлено! Я отвечу вам по email.",
      inquiry_sent_btn: "Отправлено ✓",
      contact_whatsapp_link: "Написать мне",
      contact_github_link: "Смотреть на GitHub",
      footer_rights: "Все права защищены."
    }
  };

  /* ========================================================
     APPLY LANGUAGE
     ======================================================== */
  var STORAGE_KEY = "webworks_lang";
  var SUPPORTED = ["en", "pl", "de", "ru"];

  function applyLanguage(lang){
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    var dict = TRANSLATIONS[lang];

    document.documentElement.setAttribute("lang", lang);

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++){
      var node = nodes[i];
      var key = node.getAttribute("data-i18n");
      if (dict[key] === undefined) continue;

      /* <meta> and <link> tags don't render textContent — they need their
         content/href attribute set instead. Everything else (headings,
         paragraphs, buttons, the <title> tag) uses textContent as before. */
      if (node.tagName === "META"){
        node.setAttribute("content", dict[key]);
      } else {
        node.textContent = dict[key];
      }
    }

    var placeholderNodes = document.querySelectorAll("[data-i18n-placeholder]");
    for (var pi = 0; pi < placeholderNodes.length; pi++){
      var pNode = placeholderNodes[pi];
      var pKey = pNode.getAttribute("data-i18n-placeholder");
      if (dict[pKey] !== undefined){ pNode.setAttribute("placeholder", dict[pKey]); }
    }

    if (dict.meta_title){ document.title = dict.meta_title; }

    var buttons = document.querySelectorAll(".lang-switch button");
    for (var j = 0; j < buttons.length; j++){
      var isActive = buttons[j].getAttribute("data-lang") === lang;
      buttons[j].setAttribute("aria-pressed", isActive ? "true" : "false");
    }

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* localStorage unavailable — ignore */ }
  }

  function getInitialLanguage(){
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* ignore */ }
    return "en";
  }

  /* ========================================================
     UI CLICK SOUNDS
     Short tones synthesized with the Web Audio API — no audio
     files to load. A single AudioContext is created lazily on
     the first click (browsers block audio until a user gesture
     anyway) and reused for every sound after that.
     ======================================================== */
  var uiAudioCtx = null;

  function getUiAudioContext(){
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!uiAudioCtx){ uiAudioCtx = new Ctx(); }
    if (uiAudioCtx.state === "suspended"){ uiAudioCtx.resume(); }
    return uiAudioCtx;
  }

  // Language switch — a quick, light two-note "pop".
  function playLangClickSound(){
    try {
      var ctx = getUiAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(1080, now + 0.09);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) { /* Web Audio unavailable — silently skip the sound */ }
  }

  // Main call-to-action buttons (View Projects / Start a Project / Contact
  // Me) — a warmer, richer ascending chime (two layered notes, a major
  // third apart) so it reads as a bigger, more deliberate action than the
  // language switch's light pop.
  function playCtaClickSound(){
    try {
      var ctx = getUiAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;

      var notes = [523.25, 659.25]; // C5, E5
      for (var i = 0; i < notes.length; i++){
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "triangle";
        var startAt = now + i * 0.045;
        osc.frequency.setValueAtTime(notes[i], startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.14, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.32);

        osc.start(startAt);
        osc.stop(startAt + 0.34);
      }
    } catch (e) { /* Web Audio unavailable — silently skip the sound */ }
  }

  // Top nav links (Services / Projects / Process / Contact) — a very
  // short, quiet "tick", lighter and more neutral than the other two
  // sounds since these are frequent, low-weight navigation clicks.
  function playNavClickSound(){
    try {
      var ctx = getUiAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(920, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) { /* Web Audio unavailable — silently skip the sound */ }
  }

  // "Copy Link" — a bright, quick two-step "ding" confirming the copy
  // succeeded, distinct from the nav tick, lang pop and CTA chime.
  function playCopyClickSound(){
    try {
      var ctx = getUiAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;

      var notes = [880, 1320];
      for (var i = 0; i < notes.length; i++){
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        var startAt = now + i * 0.07;
        osc.frequency.setValueAtTime(notes[i], startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.13, startAt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18);

        osc.start(startAt);
        osc.stop(startAt + 0.2);
      }
    } catch (e) { /* Web Audio unavailable — silently skip the sound */ }
  }

  var langButtons = document.querySelectorAll(".lang-switch button");
  for (var k = 0; k < langButtons.length; k++){
    langButtons[k].addEventListener("click", function(){
      playLangClickSound();
      applyLanguage(this.getAttribute("data-lang"));
      closeMobilePanel();
      trackEvent("language_view");
    });
  }

  var ctaButtons = document.querySelectorAll(".cta-btn");
  for (var c = 0; c < ctaButtons.length; c++){
    ctaButtons[c].addEventListener("click", playCtaClickSound);
  }

  var navLinkButtons = document.querySelectorAll(".nav-links a");
  for (var n = 0; n < navLinkButtons.length; n++){
    navLinkButtons[n].addEventListener("click", playNavClickSound);
  }

  applyLanguage(getInitialLanguage());

  /* ========================================================
     MOBILE NAV
     ======================================================== */
  var navToggle = document.getElementById("navToggle");
  var mobilePanel = document.getElementById("mobilePanel");

  function closeMobilePanel(){
    mobilePanel.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  navToggle.addEventListener("click", function(){
    var isOpen = mobilePanel.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  var mobileLinks = mobilePanel.querySelectorAll("a");
  for (var m = 0; m < mobileLinks.length; m++){
    mobileLinks[m].addEventListener("click", closeMobilePanel);
  }

  /* ========================================================
     DEMO CALCULATOR 1 — Auto Service
     ======================================================== */
  var calc1Vehicle = document.getElementById("calc1Vehicle");
  var calc1Service = document.getElementById("calc1Service");
  var calc1Total = document.getElementById("calc1Total");

  function updateCalc1(){
    var total = Number(calc1Vehicle.value) + Number(calc1Service.value);
    calc1Total.textContent = total;
  }
  if (calc1Vehicle && calc1Service){
    calc1Vehicle.addEventListener("change", updateCalc1);
    calc1Service.addEventListener("change", updateCalc1);
    updateCalc1();
  }

  /* ========================================================
     DEMO CONFIGURATOR — Electronics / Arduino / ESP32
     ======================================================== */
  var calc3Board = document.getElementById("calc3Board");
  var calc3Display = document.getElementById("calc3Display");
  var calc3Modules = document.querySelectorAll(".calc3module");
  var calc3Total = document.getElementById("calc3Total");

  function updateCalc3(){
    var total = Number(calc3Board.value) + Number(calc3Display.value);
    for (var n = 0; n < calc3Modules.length; n++){
      if (calc3Modules[n].checked) total += Number(calc3Modules[n].value);
    }
    calc3Total.textContent = total;
  }
  if (calc3Board && calc3Display){
    calc3Board.addEventListener("change", updateCalc3);
    calc3Display.addEventListener("change", updateCalc3);
    for (var p = 0; p < calc3Modules.length; p++){
      calc3Modules[p].addEventListener("change", updateCalc3);
    }
    updateCalc3();
  }

  /* ========================================================
     ORDER FORM DEMO — Project 5 "Clear Contact Form"
     Client-side only: validates Name / Email / Phone live using
     the same checks as my other order forms (realistic-email
     check against a list of real TLDs, phone checked against
     the expected digit count for the selected country) and
     shows a "demo" confirmation note on submit. No data is sent
     anywhere — to wire this up to a real backend, replace the
     body of the submit handler below with a fetch() call to a
     Google Apps Script Web App / Formspree endpoint / etc.
     ======================================================== */

  // Format-only check — any domain/TLD is accepted as long as the
  // address looks like a real email (name@domain.tld).
  function isRealisticEmail(email){
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email);
  }

  // Countries most relevant for advertising across Europe (Poland,
  // Germany and the rest of the EU/EEA), plus a couple of neighbours.
  // "digits" = expected phone digits AFTER the dial code.
  var COUNTRY_CODES = [
    { name:"Poland",          code:"+48",  iso2:"pl", digits:9  },
    { name:"Germany",         code:"+49",  iso2:"de", digits:10 },
    { name:"United Kingdom",  code:"+44",  iso2:"gb", digits:10 },
    { name:"France",          code:"+33",  iso2:"fr", digits:9  },
    { name:"Italy",           code:"+39",  iso2:"it", digits:10 },
    { name:"Spain",           code:"+34",  iso2:"es", digits:9  },
    { name:"Netherlands",     code:"+31",  iso2:"nl", digits:9  },
    { name:"Belgium",         code:"+32",  iso2:"be", digits:9  },
    { name:"Austria",         code:"+43",  iso2:"at", digits:10 },
    { name:"Switzerland",     code:"+41",  iso2:"ch", digits:9  },
    { name:"Czechia",         code:"+420", iso2:"cz", digits:9  },
    { name:"Slovakia",        code:"+421", iso2:"sk", digits:9  },
    { name:"Portugal",        code:"+351", iso2:"pt", digits:9  },
    { name:"Denmark",         code:"+45",  iso2:"dk", digits:8  },
    { name:"Norway",          code:"+47",  iso2:"no", digits:8  },
    { name:"Sweden",          code:"+46",  iso2:"se", digits:9  },
    { name:"Finland",         code:"+358", iso2:"fi", digits:9  },
    { name:"Ireland",         code:"+353", iso2:"ie", digits:9  },
    { name:"Greece",          code:"+30",  iso2:"gr", digits:10 },
    { name:"Hungary",         code:"+36",  iso2:"hu", digits:9  },
    { name:"Romania",         code:"+40",  iso2:"ro", digits:9  },
    { name:"Bulgaria",        code:"+359", iso2:"bg", digits:9  },
    { name:"Ukraine",         code:"+380", iso2:"ua", digits:9  },
    { name:"Russia",          code:"+7",   iso2:"ru", digits:10 }
  ];

  var orderNameInput = document.getElementById("orderName");
  var orderEmailInput = document.getElementById("orderEmail");
  var orderPhoneNumberInput = document.getElementById("orderPhoneNumber");
  var orderDemoSubmit = document.getElementById("orderDemoSubmit");
  var orderDemoStatus = document.getElementById("orderDemoStatus");

  // Reusable country/dial-code picker (flag + code + digit count),
  // shared by the Project 5 demo form and the real inquiry form below
  // — same behavior, own instance per set of element IDs.
  function createCountrySelect(ids, onSelect){
    var btn = document.getElementById(ids.btn);
    var box = document.getElementById(ids.box);
    var dropdown = document.getElementById(ids.dropdown);
    var flagImg = document.getElementById(ids.flagImg);
    var codeText = document.getElementById(ids.codeText);

    var selected = COUNTRY_CODES[0];
    var api = { getSelectedCountry: function(){ return selected; } };

    if (!btn || !dropdown) return api;

    dropdown.innerHTML = COUNTRY_CODES.map(function(c, i){
      return '<div class="country-option" role="option" data-index="' + i + '" tabindex="-1">' +
        '<img class="country-flag-img" src="https://flagcdn.com/24x18/' + c.iso2 + '.png" alt="' + c.iso2 + '" loading="lazy">' +
        '<span class="country-option-code">' + c.code + '</span>' +
        '<span class="country-option-name">' + c.name + '</span>' +
        '</div>';
    }).join("");

    function selectCountry(country){
      selected = country;
      codeText.textContent = country.code;
      flagImg.src = "https://flagcdn.com/24x18/" + country.iso2 + ".png";
      flagImg.alt = country.iso2;
      btn.title = country.name;
      if (onSelect){ onSelect(country); }
    }

    selectCountry(COUNTRY_CODES[0]);

    function closeDropdown(){
      dropdown.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
    function openDropdown(){
      dropdown.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    }

    btn.addEventListener("click", function(e){
      e.stopPropagation();
      if (dropdown.classList.contains("open")){ closeDropdown(); } else { openDropdown(); }
    });

    var options = dropdown.querySelectorAll(".country-option");
    for (var oi = 0; oi < options.length; oi++){
      options[oi].addEventListener("click", function(){
        selectCountry(COUNTRY_CODES[Number(this.getAttribute("data-index"))]);
        closeDropdown();
      });
    }

    document.addEventListener("click", function(e){
      if (box && !box.contains(e.target)){ closeDropdown(); }
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape"){ closeDropdown(); }
    });

    return api;
  }

  var orderCountrySelect = null;

  function validateOrderField(input, isValid){
    var field = input.closest(".order-field");
    if (field){ field.classList.toggle("is-valid", isValid); }
    return isValid;
  }

  function checkOrderName(){ return validateOrderField(orderNameInput, orderNameInput.value.trim().length >= 2); }

  // Same rule as my other order forms: only Latin letters, digits and
  // standard email symbols (. _ % + - @) are allowed. Anything else —
  // Cyrillic, emoji, stray characters like "*" or "/" — is stripped out
  // as the visitor types/pastes, so something like "ddj@djd.ig*/.co"
  // gets auto-corrected to "ddj@djd.ig.co" and a warning appears.
  var orderEmailInlineError = document.getElementById("orderEmailInlineError");
  var emailHadInvalidChars = false;

  function updateEmailInlineError(){
    if (!orderEmailInlineError) return;
    orderEmailInlineError.classList.toggle("visible", emailHadInvalidChars);
  }

  function sanitizeOrderEmail(){
    var cleaned = orderEmailInput.value.replace(/[^a-zA-Z0-9._%+\-@]/g, "");
    emailHadInvalidChars = cleaned !== orderEmailInput.value;
    if (emailHadInvalidChars){ orderEmailInput.value = cleaned; }
    updateEmailInlineError();
  }

  function checkOrderEmail(){
    return validateOrderField(orderEmailInput, !emailHadInvalidChars && isRealisticEmail(orderEmailInput.value.trim()));
  }

  function checkOrderPhone(){
    var digits = orderPhoneNumberInput.value.replace(/\D/g, "").length;
    var country = orderCountrySelect ? orderCountrySelect.getSelectedCountry() : null;
    var expected = country ? country.digits : 6;
    return validateOrderField(orderPhoneNumberInput, digits === expected);
  }

  if (orderNameInput && orderEmailInput && orderPhoneNumberInput && orderDemoSubmit){
    orderCountrySelect = createCountrySelect({
      btn: "countrySelectBtn", box: "countrySelectBox", dropdown: "countrySelectDropdown",
      flagImg: "countrySelectFlagImg", codeText: "countrySelectCodeText"
    }, function(){ checkOrderPhone(); });

    orderNameInput.addEventListener("input", checkOrderName);

    orderEmailInput.addEventListener("input", function(){
      sanitizeOrderEmail();
      checkOrderEmail();
    });
    orderEmailInput.addEventListener("paste", function(){
      setTimeout(function(){
        sanitizeOrderEmail();
        checkOrderEmail();
      }, 0);
    });

    orderPhoneNumberInput.addEventListener("input", checkOrderPhone);

    orderDemoSubmit.addEventListener("click", function(){
      var nameOk = checkOrderName();
      var emailOk = checkOrderEmail();
      var phoneOk = checkOrderPhone();
      if (nameOk && emailOk && phoneOk){
        orderDemoStatus.classList.add("is-shown");
      }
    });
  }

  /* ========================================================
     PROJECT INQUIRY FORM — Contact section
     Real, working submission — no backend. Lets a client describe
     what they want in their own language, in writing, instead of
     a phone call. Building a mailto: from the filled-in fields and
     opening it sends everything straight to my inbox via the
     visitor's own email client.
     ======================================================== */
  // Same backend approach as the Arduino/ESP32 Firmware Studio site:
  // POST a "data" field (JSON string) to a Google Apps Script Web App,
  // which appends a row to a Google Sheet and emails a notification.
  // See google-apps-script/Code.gs for the script to deploy. Until a
  // real URL is set here, submissions fall back to mailto: (still a
  // real, working send — just via the visitor's own email app).
  var WEBWORKS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcdVTHhxzfBV_wGtIFaM089sVgyTaMsQl_28nspfn6khEd59jac_ONeplNrmmbtZFY8g/exec";

  /* ========================================================
     VISIT TRACKING — same approach as the Arduino/ESP32 site:
     light "beacons" to the same Apps Script (type: "visit"),
     logged to a separate "Visits" sheet — no IP/geolocation,
     just what the browser already exposes (language, timezone,
     referrer, device). A failed beacon never affects the site.
     ======================================================== */
  function buildVisitorContext(){
    var params = new URLSearchParams(location.search);
    return {
      siteLang: document.documentElement.getAttribute("lang") || "en",
      browserLang: navigator.language || navigator.userLanguage || "",
      referrer: document.referrer || "",
      pageUrl: location.href,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || "",
      screen: screen.width + "x" + screen.height,
      device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop",
      userAgent: navigator.userAgent
    };
  }

  function sendVisitBeacon(eventName){
    if (WEBWORKS_SCRIPT_URL.indexOf("REPLACE_WITH") !== -1) return;
    try {
      var payload = Object.assign({ type: "visit", event: eventName }, buildVisitorContext());
      var formData = new URLSearchParams();
      formData.append("data", JSON.stringify(payload));
      fetch(WEBWORKS_SCRIPT_URL, { method: "POST", body: formData }).catch(function(){});
    } catch (err) { /* statistics must never break the site */ }
  }

  var sentFunnelEvents = {};
  function trackEvent(eventName){
    if (sentFunnelEvents[eventName]) return;
    sentFunnelEvents[eventName] = true;
    sendVisitBeacon(eventName);
  }

  sendVisitBeacon("pageview");

  var inquiryNameInput = document.getElementById("inquiryName");
  var inquiryEmailInput = document.getElementById("inquiryEmail");
  var inquiryMessageInput = document.getElementById("inquiryMessage");
  var inquirySubmitBtn = document.getElementById("inquirySubmit");
  var inquiryStatus = document.getElementById("inquiryStatus");
  var contactCtaBtn = document.getElementById("contactCtaBtn");

  function checkInquiryField(input, isValid){
    var field = input.closest(".order-field");
    if (field){ field.classList.toggle("is-valid", isValid); }
    return isValid;
  }

  // Same behavior as the Arduino/ESP32 order form: the green
  // checkmark never flickers while typing — it's hidden on every
  // keystroke and only reappears once the visitor leaves the field
  // (blur) with a valid value.
  function hideInquiryCheck(input){ checkInquiryField(input, false); }

  var inquiryPhoneNumberInput = document.getElementById("inquiryPhoneNumber");
  var inquiryWhatsappCheck = document.getElementById("inquiryWhatsapp");
  var inquiryViberCheck = document.getElementById("inquiryViber");
  var inquiryTelegramCheck = document.getElementById("inquiryTelegram");
  var inquiryFormError = document.getElementById("inquiryFormError");
  var inquiryNameField = document.getElementById("inquiryNameField");
  var inquiryEmailField = document.getElementById("inquiryEmailField");
  var inquiryPhoneField = document.getElementById("inquiryPhoneField");
  var inquiryMessageField = document.getElementById("inquiryMessageField");

  var inquiryCountrySelect = createCountrySelect({
    btn: "inquiryCountrySelectBtn", box: "inquiryCountrySelectBox", dropdown: "inquiryCountrySelectDropdown",
    flagImg: "inquiryCountrySelectFlagImg", codeText: "inquiryCountrySelectCodeText"
  }, function(){
    checkInquiryField(inquiryPhoneNumberInput, isInquiryPhoneValid());
    updateInquiryMessengerVisibility();
  });

  var inquiryAlreadySent = false;

  /* --------------------------------------------------------
     VALIDATION — same approach as the Arduino/ESP32 order form:
     one combined error line above the button (always showing
     the FIRST problem, top-to-bottom in field order), a red
     border+tint on every invalid field, a short shake + scroll
     on the first invalid field when the visitor actually presses
     Send, and a short "buzz" sound — but only once per distinct
     message, so it doesn't beep on every keystroke.
     -------------------------------------------------------- */
  var lastShownInquiryError = "";

  function inquiryErrorText(key){
    var lang = document.documentElement.getAttribute("lang") || "en";
    var dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return (dict && dict[key]) || (TRANSLATIONS.en && TRANSLATIONS.en[key]) || "";
  }

  function playInquiryErrorSound(){
    try {
      var ctx = getUiAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var tones = [{ f1: 300, f2: 220, delay: 0 }, { f1: 260, f2: 180, delay: 0.1 }];
      for (var ti = 0; ti < tones.length; ti++){
        var t = tones[ti];
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        var startAt = now + t.delay;
        var dur = 0.09;
        osc.frequency.setValueAtTime(t.f1, startAt);
        osc.frequency.exponentialRampToValueAtTime(t.f2, startAt + dur * 0.7);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.06, startAt + dur * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
        osc.start(startAt);
        osc.stop(startAt + dur + 0.03);
      }
    } catch (e) { /* Web Audio unavailable — silently skip the sound */ }
  }

  function clearInquiryErrorMarks(){
    var marked = document.querySelectorAll("#projectForm .error-field");
    for (var mi = 0; mi < marked.length; mi++){ marked[mi].classList.remove("error-field"); }
    var shaken = document.querySelectorAll("#projectForm .error-scroll");
    for (var si = 0; si < shaken.length; si++){ shaken[si].classList.remove("error-scroll"); }
  }

  function validateInquiryForm(scrollToError){
    var name = inquiryNameInput.value.trim();
    var email = inquiryEmailInput.value.trim();
    var message = inquiryMessageInput.value.trim();
    var phoneDigitsRaw = inquiryPhoneNumberInput ? inquiryPhoneNumberInput.value.trim() : "";

    var errors = [];

    if (!name){
      errors.push({ msg: inquiryErrorText("inquiry_err_name"), el: inquiryNameField });
    }

    if (inquiryEmailHadInvalidChars){
      errors.push({ msg: inquiryErrorText("p5_email_latin_only"), el: inquiryEmailField, playSound: true });
    } else if (!email){
      errors.push({ msg: inquiryErrorText("inquiry_err_email_required"), el: inquiryEmailField });
    } else if (!isRealisticEmail(email)){
      errors.push({ msg: inquiryErrorText("inquiry_err_email_invalid"), el: inquiryEmailField, playSound: true });
    }

    // Phone is optional — only validated once the visitor actually
    // starts typing a number.
    if (phoneDigitsRaw){
      var digitCount = phoneDigitsRaw.replace(/\D/g, "").length;
      var country = inquiryCountrySelect.getSelectedCountry();
      var expectedDigits = country ? country.digits : 6;
      if (digitCount !== expectedDigits){
        errors.push({ msg: inquiryErrorText("inquiry_err_phone_invalid"), el: inquiryPhoneField, playSound: true });
      }
    }

    if (!message){
      errors.push({ msg: inquiryErrorText("inquiry_err_message"), el: inquiryMessageField });
    }

    clearInquiryErrorMarks();

    if (errors.length > 0){
      if (inquiryFormError){ inquiryFormError.textContent = errors[0].msg; }

      for (var ei = 0; ei < errors.length; ei++){
        if (errors[ei].el){ errors[ei].el.classList.add("error-field"); }
      }

      if (errors[0].playSound){
        if (errors[0].msg !== lastShownInquiryError){
          playInquiryErrorSound();
          lastShownInquiryError = errors[0].msg;
        }
      } else {
        lastShownInquiryError = "";
      }

      if (scrollToError && errors[0].el){
        errors[0].el.scrollIntoView({ behavior: "smooth", block: "center" });
        errors[0].el.classList.add("error-scroll");
      }

      return false;
    }

    if (inquiryFormError){ inquiryFormError.textContent = ""; }
    lastShownInquiryError = "";
    return true;
  }

  // Same rule as everywhere else on the site: only Latin letters,
  // digits and standard email symbols (. _ % + - @) are allowed —
  // Cyrillic and stray characters are stripped as you type/paste,
  // with a warning shown right under the field.
  var inquiryEmailInlineError = document.getElementById("inquiryEmailInlineError");
  var inquiryEmailHadInvalidChars = false;

  function updateInquiryEmailInlineError(){
    if (!inquiryEmailInlineError) return;
    inquiryEmailInlineError.classList.toggle("visible", inquiryEmailHadInvalidChars);
  }

  function sanitizeInquiryEmail(){
    var cleaned = inquiryEmailInput.value.replace(/[^a-zA-Z0-9._%+\-@]/g, "");
    inquiryEmailHadInvalidChars = cleaned !== inquiryEmailInput.value;
    if (inquiryEmailHadInvalidChars){ inquiryEmailInput.value = cleaned; }
    updateInquiryEmailInlineError();
  }

  function isInquiryPhoneValid(){
    if (!inquiryPhoneNumberInput) return true;
    var digits = inquiryPhoneNumberInput.value.replace(/\D/g, "").length;
    if (!digits) return true; // optional field — empty counts as "fine"
    var country = inquiryCountrySelect ? inquiryCountrySelect.getSelectedCountry() : null;
    var expected = country ? country.digits : 6;
    return digits === expected;
  }

  var inquiryMessengerField = document.getElementById("inquiryMessengerField");

  // Same behavior as the Arduino/ESP32 order form: the "This number
  // also has: WhatsApp/Viber/Telegram" box stays hidden until the
  // phone number is fully and correctly typed in, then appears
  // highlighted. If the number becomes incomplete/invalid again,
  // any previously checked messenger is cleared so it can't stay
  // "invisibly" checked.
  function updateInquiryMessengerVisibility(){
    if (!inquiryMessengerField || !inquiryPhoneNumberInput) return;
    var digits = inquiryPhoneNumberInput.value.replace(/\D/g, "").length;
    var country = inquiryCountrySelect ? inquiryCountrySelect.getSelectedCountry() : null;
    var expected = country ? country.digits : 6;
    var phoneIsValid = digits === expected;

    inquiryMessengerField.classList.toggle("visible", phoneIsValid);

    if (!phoneIsValid){
      if (inquiryWhatsappCheck) inquiryWhatsappCheck.checked = false;
      if (inquiryViberCheck) inquiryViberCheck.checked = false;
      if (inquiryTelegramCheck) inquiryTelegramCheck.checked = false;
    }
  }

  if (inquiryNameInput && inquiryEmailInput && inquiryMessageInput && inquirySubmitBtn){
    inquiryNameInput.addEventListener("input", function(){
      validateInquiryForm(false);
      hideInquiryCheck(inquiryNameInput);
    });
    inquiryNameInput.addEventListener("blur", function(){
      checkInquiryField(inquiryNameInput, !!inquiryNameInput.value.trim());
    });

    inquiryEmailInput.addEventListener("input", function(){
      sanitizeInquiryEmail();
      validateInquiryForm(false);
      hideInquiryCheck(inquiryEmailInput);
    });
    inquiryEmailInput.addEventListener("paste", function(){
      setTimeout(function(){
        sanitizeInquiryEmail();
        validateInquiryForm(false);
      }, 0);
    });
    inquiryEmailInput.addEventListener("blur", function(){
      var email = inquiryEmailInput.value.trim();
      checkInquiryField(inquiryEmailInput, !inquiryEmailHadInvalidChars && !!email && isRealisticEmail(email));
    });

    if (inquiryPhoneNumberInput){
      inquiryPhoneNumberInput.addEventListener("input", function(){
        var cursorPos = inquiryPhoneNumberInput.selectionStart;
        var cleaned = inquiryPhoneNumberInput.value.replace(/[^0-9\-\s()]/g, "");

        var digitsBeforeCursor = inquiryPhoneNumberInput.value
          .slice(0, cursorPos)
          .replace(/\D/g, "").length;

        // Auto-format in groups of 3 with a space: "789 946 055"
        var digitsOnly = cleaned.replace(/\D/g, "").slice(0, 12);
        var formatted = digitsOnly.replace(/(\d{3})(?=\d)/g, "$1 ");

        inquiryPhoneNumberInput.value = formatted;

        // Put the cursor back after the same number of digits, so
        // the inserted spaces don't shove it to the end.
        var pos = 0, seen = 0;
        while (pos < formatted.length && seen < digitsBeforeCursor){
          if (/\d/.test(formatted[pos])) seen++;
          pos++;
        }
        inquiryPhoneNumberInput.setSelectionRange(pos, pos);

        validateInquiryForm(false);
        hideInquiryCheck(inquiryPhoneNumberInput);
        updateInquiryMessengerVisibility();
      });
      inquiryPhoneNumberInput.addEventListener("blur", function(){
        checkInquiryField(inquiryPhoneNumberInput, isInquiryPhoneValid());
      });
    }

    inquiryMessageInput.addEventListener("input", function(){ validateInquiryForm(false); });

    inquirySubmitBtn.addEventListener("click", function(){
      // One inquiry per page load — stops accidental double-sends
      // from extra clicks while a request is in flight or after it
      // already went through.
      if (inquiryAlreadySent || inquirySubmitBtn.disabled) return;

      if (!validateInquiryForm(true)) return;

      var name = inquiryNameInput.value.trim();
      var email = inquiryEmailInput.value.trim();
      var message = inquiryMessageInput.value.trim();
      var lang = document.documentElement.getAttribute("lang") || "en";

      // Phone is optional — only include a dial code if a number was
      // actually typed.
      var phoneDigits = inquiryPhoneNumberInput ? inquiryPhoneNumberInput.value.trim() : "";
      var phone = "";
      if (phoneDigits){
        var country = inquiryCountrySelect.getSelectedCountry();
        phone = (country ? country.code : "") + " " + phoneDigits;
      }
      var whatsapp = !!(inquiryWhatsappCheck && inquiryWhatsappCheck.checked);
      var viber = !!(inquiryViberCheck && inquiryViberCheck.checked);
      var telegram = !!(inquiryTelegramCheck && inquiryTelegramCheck.checked);

      function markAsSent(){
        inquiryAlreadySent = true;
        inquirySubmitBtn.disabled = true;
        var lang2 = document.documentElement.getAttribute("lang") || "en";
        inquirySubmitBtn.textContent = (TRANSLATIONS[lang2] && TRANSLATIONS[lang2].inquiry_sent_btn) || "Sent ✓";
        if (inquiryStatus){ inquiryStatus.classList.add("is-shown"); }
      }

      function sendByEmailInstead(){
        var subject = "New project inquiry from " + name;
        var body =
          "Name: " + name + "\n" +
          "Email: " + email + "\n" +
          (phone ? "Phone: " + phone + "\n" : "") +
          (whatsapp ? "WhatsApp: yes\n" : "") +
          (viber ? "Viber: yes\n" : "") +
          (telegram ? "Telegram: yes\n" : "") +
          "\n" + message;
        window.location.href =
          "mailto:s.i.pauchak@gmail.com" +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body);
        markAsSent();
      }

      playCtaClickSound();

      if (WEBWORKS_SCRIPT_URL.indexOf("REPLACE_WITH") !== -1){
        // Script not deployed yet — mailto still works right now.
        sendByEmailInstead();
        return;
      }

      var formData = new URLSearchParams();
      formData.append("data", JSON.stringify({
        name: name, email: email, phone: phone,
        whatsapp: whatsapp, viber: viber, telegram: telegram,
        message: message, language: lang
      }));

      inquirySubmitBtn.disabled = true;
      fetch(WEBWORKS_SCRIPT_URL, { method: "POST", body: formData })
        .then(function(){
          markAsSent();
        })
        .catch(function(){
          inquirySubmitBtn.disabled = false;
          sendByEmailInstead();
        });
    });
  }

  // "Написать мне" toggles the inquiry form open/closed, instead of
  // jumping to it or opening a blank mailto: immediately.
  var projectFormEl = document.getElementById("projectForm");
  if (contactCtaBtn && projectFormEl && inquiryNameInput){
    contactCtaBtn.addEventListener("click", function(){
      var isOpen = projectFormEl.classList.toggle("is-open");
      contactCtaBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (isOpen){
        projectFormEl.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(function(){ inquiryNameInput.focus(); }, 350);
        trackEvent("inquiry_form_opened");
      }
    });
  }

  // "Начали заполнять заявку" — первый ввод в любое из полей формы
  ["inquiryName", "inquiryEmail", "inquiryPhoneNumber"].forEach(function(id){
    var el = document.getElementById(id);
    if (el){ el.addEventListener("input", function(){ trackEvent("inquiry_started"); }, { once: true }); }
  });

  /* ========================================================
     SHARE THIS SITE — Copy Link + Share menu (Contact section)
     Fixed to the real public GitHub Pages URL so it's always the
     correct link to share, even when this page is opened locally
     from disk during editing/testing.
     ======================================================== */
  var SITE_URL = "https://vpauk81.github.io/WEBWORKS/";

  var copyLinkBtn = document.getElementById("copyLinkBtn");
  var shareWrap = document.getElementById("shareWrap");
  var shareToggleBtn = document.getElementById("shareToggleBtn");
  var shareMenu = document.getElementById("shareMenu");

  if (copyLinkBtn){
    copyLinkBtn.addEventListener("click", function(){
      var label = copyLinkBtn.querySelector("span");
      var originalKey = label ? label.getAttribute("data-i18n") : null;

      function showCopied(){
        playCopyClickSound();
        copyLinkBtn.classList.add("is-copied");
        if (label){
          var lang = document.documentElement.getAttribute("lang") || "en";
          label.textContent = (TRANSLATIONS[lang] && TRANSLATIONS[lang].share_copied) || "Copied!";
        }
        setTimeout(function(){
          copyLinkBtn.classList.remove("is-copied");
          if (label && originalKey){
            var lang2 = document.documentElement.getAttribute("lang") || "en";
            label.textContent = (TRANSLATIONS[lang2] && TRANSLATIONS[lang2][originalKey]) || "Copy Link";
          }
        }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(SITE_URL).then(showCopied, function(){
          fallbackCopyText(SITE_URL);
          showCopied();
        });
      } else {
        fallbackCopyText(SITE_URL);
        showCopied();
      }
    });
  }

  function fallbackCopyText(text){
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  if (shareToggleBtn && shareMenu && shareWrap){
    shareToggleBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var isOpen = shareMenu.classList.toggle("is-open");
      shareToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function(e){
      if (!shareWrap.contains(e.target)){
        shareMenu.classList.remove("is-open");
        shareToggleBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape"){
        shareMenu.classList.remove("is-open");
        shareToggleBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Share only the bare link — no page title/caption attached, on any
    // platform or in any site language. Where a platform requires some
    // kind of label (email's subject line), it's a fixed Russian string
    // rather than the visitor's currently selected site language.
    var SHARE_EMAIL_SUBJECT = "Ссылка на сайт WEBWORKS";

    var shareItems = shareMenu.querySelectorAll(".share-menu-item");
    for (var shi = 0; shi < shareItems.length; shi++){
      shareItems[shi].addEventListener("click", function(){
        var platform = this.getAttribute("data-share");
        var target = "";

        if (platform === "whatsapp"){
          target = "https://wa.me/?text=" + encodeURIComponent(SITE_URL);
        } else if (platform === "telegram"){
          target = "https://t.me/share/url?url=" + encodeURIComponent(SITE_URL);
        } else if (platform === "viber"){
          target = "viber://forward?text=" + encodeURIComponent(SITE_URL);
        } else if (platform === "email"){
          window.location.href = "mailto:?subject=" + encodeURIComponent(SHARE_EMAIL_SUBJECT) + "&body=" + encodeURIComponent(SITE_URL);
        }

        if (target){ window.open(target, "_blank", "noopener"); }

        shareMenu.classList.remove("is-open");
        shareToggleBtn.setAttribute("aria-expanded", "false");
      });
    }
  }

})();
