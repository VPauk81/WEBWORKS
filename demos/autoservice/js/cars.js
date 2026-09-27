// Марки и модели для формы записи (модели примерно с 1990 года по сегодня).
// Чтобы добавить марку — добавьте строку "Марка": ["Модель 1", "Модель 2"].
// Чтобы добавить модель — допишите её в массив нужной марки.
// Марки и модели сортируются автоматически, порядок в файле не важен.
window.CAR_MODELS = {
  "Alfa Romeo": [
    "33", "145", "146", "147", "155", "156", "159", "164", "166", "4C", "Brera", "Giulia", "Giulietta",
    "GT", "GTV", "Junior", "MiTo", "Spider", "Stelvio", "Tonale",
  ],
  Audi: [
    "80", "90", "100", "200", "A1", "A2", "A3", "A4", "A4 allroad", "A5", "A6", "A6 allroad", "A7", "A8",
    "Cabriolet", "Coupe", "e-tron", "e-tron GT", "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8",
    "Q8 e-tron", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5", "S6", "S8", "SQ5", "TT", "V8",
  ],
  BMW: [
    "1 Series", "2 Series", "2 Series Active Tourer", "2 Series Gran Coupe", "3 Series", "3 Series GT",
    "4 Series", "5 Series", "5 Series GT", "6 Series", "7 Series", "8 Series", "i3", "i4", "i5", "i7", "i8",
    "iX", "iX1", "iX3", "M2", "M3", "M4", "M5", "M8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM",
    "Z3", "Z4", "Z8",
  ],
  BYD: ["Atto 2", "Atto 3", "Dolphin", "Han", "Seal", "Seal U", "Sealion 7", "Tang"],
  Chevrolet: [
    "Aveo", "Camaro", "Captiva", "Cruze", "Epica", "Evanda", "Kalos", "Lacetti", "Matiz", "Nubira",
    "Orlando", "Rezzo", "Spark", "Tacuma", "Trax", "Volt",
  ],
  Chrysler: ["300C", "Crossfire", "Grand Voyager", "Neon", "PT Cruiser", "Sebring", "Stratus", "Voyager"],
  "Citroën": [
    "AX", "Berlingo", "BX", "C-Crosser", "C-Elysée", "C-Zero", "C1", "C2", "C3", "C3 Aircross",
    "C3 Picasso", "C4", "C4 Aircross", "C4 Cactus", "C4 Picasso", "C4 SpaceTourer", "C4 X", "C5",
    "C5 Aircross", "C5 X", "C6", "C8", "DS3", "DS4", "DS5", "ë-C4", "Evasion", "Jumper", "Jumpy", "Nemo",
    "Saxo", "SpaceTourer", "Xantia", "XM", "Xsara", "Xsara Picasso", "ZX",
  ],
  Cupra: ["Ateca", "Born", "Formentor", "Leon", "Tavascan", "Terramar"],
  Dacia: ["Bigster", "Dokker", "Duster", "Jogger", "Lodgy", "Logan", "Logan MCV", "Sandero", "Sandero Stepway", "Spring"],
  Daewoo: ["Espero", "Kalos", "Lacetti", "Lanos", "Leganza", "Matiz", "Nexia", "Nubira", "Tacuma"],
  DS: ["DS 3", "DS 3 Crossback", "DS 4", "DS 5", "DS 7", "DS 9"],
  Fiat: [
    "124 Spider", "500", "500e", "500L", "500X", "600", "Barchetta", "Brava", "Bravo", "Cinquecento",
    "Croma", "Doblo", "Ducato", "Fiorino", "Freemont", "Grande Punto", "Idea", "Linea", "Marea", "Multipla",
    "Palio", "Panda", "Punto", "Punto Evo", "Qubo", "Scudo", "Sedici", "Seicento", "Stilo", "Talento",
    "Tempra", "Tipo", "Ulysse", "Uno",
  ],
  Ford: [
    "B-Max", "C-Max", "Cougar", "Courier", "EcoSport", "Edge", "Escort", "Explorer", "Fiesta", "Focus",
    "Fusion", "Galaxy", "Grand C-Max", "Ka", "Ka+", "Kuga", "Maverick", "Mondeo", "Mustang",
    "Mustang Mach-E", "Orion", "Probe", "Puma", "Ranger", "S-Max", "Scorpio", "Sierra", "Tourneo Connect",
    "Tourneo Courier", "Tourneo Custom", "Transit", "Transit Connect", "Transit Custom",
  ],
  Honda: [
    "Accord", "City", "Civic", "Concerto", "CR-V", "CR-Z", "CRX", "e", "e:Ny1", "FR-V", "HR-V", "Insight",
    "Integra", "Jazz", "Legend", "Logo", "NSX", "Prelude", "S2000", "Shuttle", "Stream", "ZR-V",
  ],
  Hyundai: [
    "Accent", "Atos", "Bayon", "Coupe", "Elantra", "Galloper", "Genesis", "Getz", "Grandeur", "H-1",
    "i10", "i20", "i30", "i40", "Inster", "Ioniq", "Ioniq 5", "Ioniq 6", "ix20", "ix35", "ix55", "Kona",
    "Lantra", "Matrix", "Pony", "Santa Fe", "Sonata", "Terracan", "Trajet", "Tucson", "Veloster",
  ],
  Infiniti: ["EX", "FX", "G", "M", "Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX70"],
  Jaguar: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "X-Type", "XE", "XF", "XJ", "XK"],
  Jeep: ["Avenger", "Cherokee", "Commander", "Compass", "Grand Cherokee", "Patriot", "Renegade", "Wrangler"],
  Kia: [
    "Carens", "Carnival", "Ceed", "Cerato", "EV3", "EV6", "EV9", "Magentis", "Niro", "Opirus", "Optima",
    "Picanto", "ProCeed", "Pride", "Rio", "Sephia", "Shuma", "Sorento", "Soul", "Sportage", "Stinger",
    "Stonic", "Venga", "XCeed",
  ],
  Lada: ["2107", "4x4 (Niva)", "Granta", "Kalina", "Largus", "Priora", "Samara", "Vesta", "XRay"],
  Lancia: ["Dedra", "Delta", "Kappa", "Lybra", "Musa", "Phedra", "Thema", "Thesis", "Voyager", "Ypsilon", "Zeta"],
  "Land Rover": [
    "Defender", "Discovery", "Discovery Sport", "Freelander", "Freelander 2", "Range Rover",
    "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar",
  ],
  Lexus: ["CT", "ES", "GS", "IS", "LBX", "LC", "LS", "NX", "RC", "RX", "RZ", "SC", "UX"],
  Mazda: [
    "121", "2", "3", "323", "5", "6", "626", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-80", "CX-9",
    "Demio", "MPV", "MX-3", "MX-30", "MX-5", "MX-6", "Premacy", "RX-7", "RX-8", "Tribute", "Xedos 6",
    "Xedos 9",
  ],
  "Mercedes-Benz": [
    "190", "A-Class", "AMG GT", "B-Class", "C-Class", "Citan", "CL", "CLA", "CLC", "CLK", "CLS",
    "E-Class", "EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQV", "G-Class", "GL", "GLA",
    "GLB", "GLC", "GLE", "GLK", "GLS", "M-Class (ML)", "R-Class", "S-Class", "SL", "SLC", "SLK",
    "Sprinter", "T-Class", "V-Class", "Vaneo", "Viano", "Vito", "W124", "X-Class",
  ],
  MG: ["Cyberster", "HS", "Marvel R", "MG3", "MG4", "MG5", "MGF", "TF", "ZR", "ZS", "ZT"],
  Mini: ["Aceman", "Cabrio", "Clubman", "Cooper", "Countryman", "Coupe", "Paceman", "Roadster"],
  Mitsubishi: [
    "3000GT", "ASX", "Carisma", "Colt", "Eclipse", "Eclipse Cross", "Galant", "Grandis", "i-MiEV", "L200",
    "Lancer", "Lancer Evolution", "Outlander", "Pajero", "Pajero Pinin", "Sigma", "Space Runner",
    "Space Star", "Space Wagon",
  ],
  Nissan: [
    "100NX", "200SX", "350Z", "370Z", "Almera", "Almera Tino", "Ariya", "Cube", "e-NV200", "GT-R", "Juke",
    "Leaf", "Maxima", "Micra", "Murano", "Navara", "Note", "NV200", "Pathfinder", "Patrol", "Pixo",
    "Primastar", "Primera", "Pulsar", "Qashqai", "Qashqai+2", "Serena", "Sunny", "Terrano", "Townstar",
    "X-Trail",
  ],
  Opel: [
    "Adam", "Agila", "Ampera", "Antara", "Astra", "Calibra", "Cascada", "Combo", "Corsa", "Crossland",
    "Frontera", "Grandland", "GT", "Insignia", "Kadett", "Karl", "Meriva", "Mokka", "Monterey", "Movano",
    "Omega", "Signum", "Sintra", "Tigra", "Vectra", "Vivaro", "Zafira", "Zafira Life",
  ],
  Peugeot: [
    "106", "107", "108", "205", "206", "207", "208", "306", "307", "308", "405", "406", "407", "408",
    "508", "605", "607", "806", "807", "1007", "2008", "3008", "4007", "4008", "5008", "Bipper", "Boxer",
    "e-208", "e-2008", "Expert", "iOn", "Partner", "RCZ", "Rifter", "Traveller",
  ],
  Polestar: ["1", "2", "3", "4"],
  Porsche: ["911", "918 Spyder", "928", "944", "968", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
  Renault: [
    "5 E-Tech", "19", "21", "25", "Alaskan", "Arkana", "Austral", "Avantime", "Captur", "Clio", "Espace",
    "Fluence", "Grand Scénic", "Kadjar", "Kangoo", "Koleos", "Laguna", "Latitude", "Master", "Mégane",
    "Modus", "Rafale", "Safrane", "Scénic", "Symbol", "Talisman", "Thalia", "Trafic", "Twingo", "Twizy",
    "Vel Satis", "Wind", "Zoe",
  ],
  Rover: ["25", "45", "75", "100", "200", "400", "600", "800", "Streetwise"],
  Saab: ["900", "9000", "9-3", "9-5"],
  Seat: [
    "Alhambra", "Altea", "Altea XL", "Arona", "Arosa", "Ateca", "Cordoba", "Exeo", "Ibiza", "Inca", "Leon",
    "Marbella", "Mii", "Tarraco", "Toledo",
  ],
  "Škoda": [
    "Citigo", "Elroq", "Enyaq", "Fabia", "Favorit", "Felicia", "Kamiq", "Karoq", "Kodiaq", "Octavia",
    "Praktik", "Rapid", "Roomster", "Scala", "Superb", "Yeti",
  ],
  Smart: ["#1", "#3", "ForFour", "ForTwo", "Roadster"],
  SsangYong: ["Actyon", "Korando", "Kyron", "Musso", "Rexton", "Rodius", "Tivoli", "Torres", "XLV"],
  Subaru: [
    "BRZ", "Crosstrek", "Forester", "Impreza", "Justy", "Legacy", "Levorg", "Outback", "Solterra", "SVX",
    "Trezia", "Tribeca", "WRX STI", "XV",
  ],
  Suzuki: [
    "Across", "Alto", "Baleno", "Celerio", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "S-Cross",
    "Samurai", "Splash", "Swace", "Swift", "SX4", "Vitara", "Wagon R+",
  ],
  Tesla: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y", "Roadster"],
  Toyota: [
    "4Runner", "Auris", "Avensis", "Avensis Verso", "Aygo", "Aygo X", "bZ4X", "C-HR", "Camry", "Carina",
    "Carina E", "Celica", "Corolla", "Corolla Cross", "Corolla Verso", "Corona", "FJ Cruiser", "GR86",
    "GR Yaris", "GT86", "Hiace", "Highlander", "Hilux", "iQ", "Land Cruiser", "Mirai", "MR2", "Paseo",
    "Picnic", "Previa", "Prius", "Prius+", "Proace", "Proace City", "RAV4", "Starlet", "Supra",
    "Urban Cruiser", "Verso", "Verso-S", "Yaris", "Yaris Cross", "Yaris Verso",
  ],
  Volkswagen: [
    "Amarok", "Arteon", "Beetle", "Bora", "Caddy", "California", "Caravelle", "CC", "Corrado", "Crafter",
    "Eos", "Fox", "Golf", "Golf Plus", "Golf Sportsvan", "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz",
    "Jetta", "LT", "Lupo", "Multivan", "New Beetle", "Passat", "Passat CC", "Phaeton", "Polo", "Scirocco",
    "Sharan", "T-Cross", "T-Roc", "Taigo", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Transporter",
    "up!", "Vento",
  ],
  Volvo: [
    "240", "440", "460", "480", "740", "850", "940", "960", "C30", "C40", "C70", "EX30", "EX40", "EX90",
    "S40", "S60", "S70", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90",
  ],
};
