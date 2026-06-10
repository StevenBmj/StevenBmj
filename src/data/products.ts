/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Review } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "La Royale Chronographe Or",
    nameEn: "The Royale Chronograph Gold",
    description: "Chronographe d'exception en or rose 18 carats avec mouvement automatique suisse de haute précision. Cadran en émail noir profond, réserve de marche de 72 heures, verre saphir inrayable traité antireflet.",
    descriptionEn: "Exceptional 18-karat rose gold chronograph with high-precision Swiss automatic movement. Deep black enamel dial, 72-hour power reserve, scratch-resistant sapphire crystal with anti-reflective coating.",
    category: "watches",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 34500,
    promoPrice: 29900,
    stock: 5,
    rating: 4.9,
    isExclu: true,
    isNew: true,
    badge: "Édition Limitée",
    badgeEn: "Limited Edition",
    specs: [
      { key: "Mouvement / Movement", value: "Automatique Calibre SB-09 / Automatic Caliber SB-09" },
      { key: "Boîtier / Case", value: "Or rose 18k / 18k Rose Gold (41mm)" },
      { key: "Réserve / Power Reserve", value: "72 Heures / 72 Hours" },
      { key: "Étanchéité / Water Resistance", value: "100m (10 ATM)" }
    ],
    seoTitle: "La Royale Chronographe Or - StevenBmj",
    seoDescription: "Découvrez notre chronographe d'exception en or rose avec mouvement automatique suisse."
  },
  {
    id: "prod-2",
    name: "L'Obsidian Ceramic Noir",
    nameEn: "The Obsidian Black Ceramic",
    description: "Montre de luxe futuriste dotée d'un boîtier monobloc en céramique noire mate haute technologie. Lunette octogonale polie, aiguilles dorées luminescentes et bracelet technopolymère haute résistance.",
    descriptionEn: "Futuristic luxury watch featuring a hyper-engineered matte black ceramic monobloc case. Polished octagonal bezel, gold luminescent hands, and high-resistance technopolymer strap.",
    category: "watches",
    images: [
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 18900,
    stock: 8,
    rating: 4.8,
    isNew: true,
    badge: "Futuriste",
    badgeEn: "Futuristic",
    specs: [
      { key: "Boîtier / Case", value: "Céramique Noire / Black Ceramic (42mm)" },
      { key: "Verre / Glass", value: "Saphir Double Antireflet / Double AR Sapphire" },
      { key: "Cadran / Dial", value: "Fibre de Carbone / Carbon Fiber" },
      { key: "Mouvement / Movement", value: "Mouvement Quartz Haute Fréquence / HF Quartz" }
    ],
    seoTitle: "L'Obsidian Ceramic Noir - Montre de Luxe StevenBmj",
    seoDescription: "Une montre de luxe au design futuriste en céramique noire mate texturée."
  },
  {
    id: "prod-3",
    name: "Chaîne Impériale Or Cubaine",
    nameEn: "Imperial Gold Cuban Chain",
    description: "Chaîne maillon cubain exclusive forgée en or jaune massif 18 carats. Entièrement sculptée à la main avec fermoir sécurisé serti de diamants de synthèse VVS1 d'une clarté absolue.",
    descriptionEn: "Exclusive Cuban link chain forged in solid 18-karat yellow gold. Entirely hand-sculpted with a secure lock clasp set with absolute clarity VVS1 lab-grown diamonds.",
    category: "chains",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 12500,
    promoPrice: 10900,
    stock: 12,
    rating: 5.0,
    isExclu: true,
    badge: "Best Seller",
    badgeEn: "Best Seller",
    specs: [
      { key: "Matériau / Material", value: "Or Jaune Massif 18k / Solid 18k Yellow Gold" },
      { key: "Largeur / Width", value: "14 mm" },
      { key: "Poids / Weight", value: "245g (Longueur 55cm)" },
      { key: "Pierres / Stones", value: "Diamants VVS1 Certifiés / Certified VVS1 Diamonds" }
    ]
  },
  {
    id: "prod-4",
    name: "Gourmette Royal Diamond",
    nameEn: "Royal Diamond Bracelet",
    description: "Bracelet gourmette prestige en or blanc 18 carats pavé d'un alignement millimétrique de diamants brillants. Un chef-d'œuvre de joaillerie moderne alliant force géométrique et éclats captivants.",
    descriptionEn: "Prestige curb chain bracelet in 18-karat white gold paved with a millimetric alignment of brilliant-cut diamonds. A masterpiece of modern jewelry combining geometric strength and raw brilliance.",
    category: "chains",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 8900,
    stock: 4,
    rating: 4.7,
    specs: [
      { key: "Métal / Metal", value: "Or Blanc 18k / 18k White Gold" },
      { key: "Carats Diamants", value: "4.5 Carats (Pavé complet)" },
      { key: "Fermoir / Clasp", value: "Double Sécurité / Double Lock" }
    ]
  },
  {
    id: "prod-5",
    name: "Costume Midnight Chelsea",
    nameEn: "Midnight Chelsea Suit",
    description: "Costume croisé deux pièces d'une élégance absolue, taillé dans une laine vierge mérinos italienne. Lignes architecturales épurées, revers en pointe d'une précision chirurgicale, doublure satin Jacquard noire monogrammée.",
    descriptionEn: "Absolutely elegant two-piece double-breasted suit, tailored from virgin Italian merino wool. Sleek architectural lines, surgical peak lapels, and custom monogrammed black Jacquard satin lining.",
    category: "suits",
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 4800,
    promoPrice: 3950,
    stock: 14,
    rating: 4.9,
    isExclu: true,
    badge: "Haute Couture",
    badgeEn: "Haute Couture",
    specs: [
      { key: "Composition", value: "100% Laine Mérinos Super 150s / 100% Super 150s Merino Wool" },
      { key: "Coupe / Fit", value: "Slim Fit Ajustée Italienne / Slim Adjusted Italian" },
      { key: "Fermeture / Buttons", value: "Croisé 6 Boutons Corne / Double Breasted 6 Horn Buttons" },
      { key: "Origine / Origin", value: "Fait main en Italie / Handmade in Italy" }
    ]
  },
  {
    id: "prod-6",
    name: "Smoking Obsidian Velours",
    nameEn: "Obsidian Velvet Dinner Jacket",
    description: "Veste de smoking haut de gamme en velours de coton premium noir impérial avec revers châle satinés. Coupe structurée avec épaulettes nettes. Une pièce iconique conçue pour sublimer vos soirées de prestige.",
    descriptionEn: "High-end dinner jacket in imperial black premium cotton velvet featuring satin shawl lapels. Symmetrically structured fit with crisp shoulders. An iconic piece meant for prestigious events.",
    category: "suits",
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 3200,
    stock: 10,
    rating: 4.8,
    isNew: true,
    badge: "Nouveau",
    badgeEn: "New In",
    specs: [
      { key: "Tissu / Fabric", value: "Velours de Coton de Gênes / Genoa Cotton Velvet" },
      { key: "Revers / Lapel", value: "Col Châle Soie Royale / Royal Silk Shawl Collar" },
      { key: "Boutons / Buttons", value: "Recouverts de Satin de Soie / Silk Satin Covered" }
    ]
  },
  {
    id: "prod-7",
    name: "Mocassin Crêpe Suédé",
    nameEn: "Premium Suede Crepe Loafer",
    description: "Mocassin pour homme haut de gamme fabriqué en daim de veau italien d'une souplesse absolue. Semelle en crêpe naturelle authentique offrant un amorti incomparable et un style décontracté raffiné.",
    descriptionEn: "High-end mens loafer crafted from deeply supple Italian calf suede. Authentic natural crepe sole delivering unmatched cushioning and a highly refined casual style.",
    category: "shoes",
    images: [
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1614252329309-8d76d65be6dc?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 1450,
    stock: 22,
    rating: 4.6,
    badge: "Matière Noble",
    badgeEn: "Premium Material",
    specs: [
      { key: "Tige / Upper", value: "100% Cuir de Veau Velours / 100% Calf Suede Leather" },
      { key: "Semelle / Sole", value: "Crêpe Naturelle Organique / Organic Natural Crepe" },
      { key: "Cousu / Stitching", value: "Cousu Blake Artisanal / Blake Stitched" }
    ]
  },
  {
    id: "prod-8",
    name: "Derby Obsidian Glacé",
    nameEn: "Glazed Obsidian Derby",
    description: "Souliers Derby classiques dotés d'une finition en cuir verni noir miroir obsidian glacé. Cousu Goodyear d'une robustesse suprême, parfaits alliés d'un costume formel ou d'un smoking majestueux.",
    descriptionEn: "Classic Derby shoes sporting an obsidian glazed mirror-smooth black patent leather finish. Supremely robust Goodyear welted stitching, perfect match for formal suits or majestic tuxedos.",
    category: "shoes",
    images: [
      "https://images.unsplash.com/photo-1614252329309-8d76d65be6dc?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 2100,
    promoPrice: 1750,
    stock: 12,
    rating: 4.9,
    specs: [
      { key: "Cuir / Leather", value: "Veau pleine fleur glacé / Full Grain Glazed Calfskin" },
      { key: "Cousu / Montage", value: "Goodyear sous gravure / Goodyear Welted" },
      { key: "Doublure / Lining", value: "Cuir naturel respirant / Natural Breathable Leather" }
    ]
  },
  {
    id: "prod-9",
    name: "Bague Chevalière Solaris 24K",
    nameEn: "Solaris Signet Ring 24K",
    description: "Bague chevalière géométrique contemporaine forgée en or pur et sertie d'un bloc d'onyx noir de jais sculpté au laser. Polie individuellement à la main, portant la signature de notre maison en watermark interne.",
    descriptionEn: "Contemporary geometric signet ring forged in pure gold and crowned with a laser-sculpted jet-black onyx block. Individually hand-polished, stamped with our fashion house signature watermark inside.",
    category: "accessories",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1624222247344-550fb8ecf7db?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 4900,
    stock: 7,
    rating: 4.8,
    isNew: true,
    specs: [
      { key: "Métal / Metal", value: "Or Vert 24k d'origine éthique / Ethically Sourced 24k Green Gold" },
      { key: "Plateau / Top", value: "Onyx Naturel de Qualité AAA / Natural AAA-Grade Onyx" },
      { key: "Finition / Finish", value: "Brossée satinée et polie miroir / Satin brushed & mirror polished" }
    ]
  },
  {
    id: "prod-10",
    name: "Ceinture Impériale Croco Doré",
    nameEn: "Imperial Gold Croc Belt",
    description: "Ceinture d'un raffinement rare confectionnée en cuir véritable embossé façon crocodile avec boucle automatique sculptée en or brossé poli. Ajustable à la perfection pour rehausser une silhouette sophistiquée.",
    descriptionEn: "Rarely refined belt fashioned from genuine crocodile embossed leather coupled with an automated buckle sculpted in brushed-polished gold. Perfectly adjustable to heighten a sophisticated silhouette.",
    category: "accessories",
    images: [
      "https://images.unsplash.com/photo-1624222247344-550fb8ecf7db?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 1850,
    stock: 15,
    rating: 4.5,
    specs: [
      { key: "Cuir / Strap Leather", value: "Cuir pleine fleur tannage végétal / Vegetable Tanned Full Grain Leather" },
      { key: "Boucle / Buckle", value: "Plaqué or 24K hypoallergénique / 24K Gold-Plated Hypoallergenic" },
      { key: "Largeur / Width", value: "3.5 cm" }
    ]
  },
  {
    id: "prod-11",
    name: "SBMJ Tourbillon Horizon",
    nameEn: "SBMJ Tourbillon Horizon",
    description: "Une prouesse horlogère d'avant-garde dotée d'une cage de tourbillon volante squelettée effectuant une rotation complète toutes les 60 secondes. Boîtier en titane grade 5 et inserts en saphir fumé.",
    descriptionEn: "An avant-garde horological feat featuring a skeletonized flying tourbillon cage completing a full rotation every 60 seconds. Grade 5 titanium case and smoked sapphire inserts.",
    category: "watches",
    images: [
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 165000,
    promoPrice: 148000,
    stock: 2,
    rating: 5.0,
    isExclu: true,
    isNew: true,
    badge: "Souveraineté",
    badgeEn: "Sovereignty Group",
    specs: [
      { key: "Complication", value: "Tourbillon Volant Suralimenté / Supercharged Flying Tourbillon" },
      { key: "Fréquence / Frequency", value: "21,600 Alt/h" },
      { key: "Matériau / Case", value: "Titane Grade/Ti-5 & Carbone / Grade 5 Titanium & Carbon" },
      { key: "Exclusivité / Limit", value: "Limité à 7 pièces mondiales / 7 Pieces Worldwide Only" }
    ]
  },
  {
    id: "prod-12",
    name: "Chaîne Royale Royal Diamonds 24k",
    nameEn: "Royal 24k Diamond Cuban Chain",
    description: "Le summum du prestige masculin de la Maison. Chaîne à maillons épais coulée en or 24 carats pur et sertie de 1800 diamants rutilants de pureté exceptionnelle VVS1. Conçue pour briller divinement de jour comme de nuit.",
    descriptionEn: "The pinnacle of masculine prestige. Heavy linked chain cast in pure 24-karat gold, encrusted with 1,800 shining diamonds of exceptional VVS1 purity. Crafted to glow divinely.",
    category: "chains",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 42000,
    promoPrice: 38000,
    stock: 3,
    rating: 5.0,
    isExclu: true,
    badge: "Unique",
    badgeEn: "Masterpiece",
    specs: [
      { key: "Composition", value: "Or Jaune Brut 24K Pur / Pure Raw 24K Gold" },
      { key: "Pierres / Diamonds", value: "1,800 Brilliants VVS1 (18.5 Carats)" },
      { key: "Fermoir / Clasp", value: "Fermoir Coffre Gravé StevenBmj / Custom Engraved Box Clasp" }
    ]
  },
  {
    id: "prod-13",
    name: "Manteau Impérial en Cachemire",
    nameEn: "Imperial Cashmere Overcoat",
    description: "Manteau long ceinturé double face entièrement cousu main dans les ateliers milanais. Confectionné dans un précieux cachemire blanc neige de Mongolie d'une douceur divine, doté d'un col tailleur généreux et d'une doublure satin.",
    descriptionEn: "Long double-faced belted overcoat fully hand-stitched in Milanese workshops. Tailored in Mongolian snow-white cashmere of divine softness, complete with comfortable lapels and silk lining.",
    category: "suits",
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 6200,
    stock: 6,
    rating: 4.8,
    isNew: true,
    badge: "Prestige",
    badgeEn: "Prestige Piece",
    specs: [
      { key: "Matière / Fiber", value: "100% Cachemire Mongolie double face / 100% Mongolian Cashmere" },
      { key: "Coupe / Tailoring", value: "Coupe Droite Déstructurée / Unstructured Straight Overcoat" },
      { key: "Boutons / Buttons", value: "Corne de Buffle Sauvage / Buffalo Horn Buttons" }
    ]
  },
  {
    id: "prod-14",
    name: "Mocassins de Conduite Orfèvre",
    nameEn: "Goldsmith Driving Loafers",
    description: "Souliers de conduite souples nés pour l'élégance sans effort. Confectionnés en cuir nubuck bleu marine au tannage minéral avec picots en caoutchouc noir et boucle royale SBMJ ornée de dorures d'orfèvre.",
    descriptionEn: "Supple driving loafers born for effortless elegance. Crafted from mineral-tanned navy blue suede nubuck, complete with black rubber pebbles and SBMJ gold-toned metal detailing.",
    category: "shoes",
    images: [
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1614252329309-8d76d65be6dc?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 1200,
    stock: 15,
    rating: 4.7,
    specs: [
      { key: "Tige / Upper", value: "Nubuck de Veau Velours / Suede Nubuck Leather" },
      { key: "Boucle / Trim", value: "Léton brossé plaqué Or 18k / 18k Gold-Plated Brass buckle" },
      { key: "Montage / Assemble", value: "Cousu main intégral / Hand-Stitched tubular assembly" }
    ]
  },
  {
    id: "prod-15",
    name: "Pendentif Monarque Émeraude",
    nameEn: "Emerald Monarch Pendant",
    description: "Pendentif d'apparat au design souverain mettant en scène une émeraude de Colombie de 8 carats certifiée d'un vert forêt d'une profondeur mystique, cerclée d'or brossé 18k et suspendue à sa maille fine assortie.",
    descriptionEn: "Regal pendant showcasing an authenticated 8-carat Colombian emerald of mystical deep forest green hue, bordered with 18k brushed gold and hanging from a matches chain.",
    category: "chains",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 15400,
    stock: 4,
    rating: 4.9,
    isExclu: true,
    badge: "Haute Orfèvrerie",
    badgeEn: "Masterwork Jewelry",
    specs: [
      { key: "Gemme / Gem", value: "Émeraude Naturelle Colombie AAA / 8-Carat Colombian Emerald" },
      { key: "Monture / Setting", value: "Or Jaune 18K brossé / 18K Yellow Gold Satin-Finish" },
      { key: "Poids / Weight", value: "18.5g" }
    ]
  },
  {
    id: "prod-16",
    name: "Lunettes Pilote SBMJ Or",
    nameEn: "Gold SBMJ Pilot Sunglasses",
    description: "Une réinterprétation futuriste des célèbres lunettes d'aviateur. Monture ultra fine plaquée or blanc, verres polarisés d'un dégradé ambré inrayable et branches ornées de carbone tressé.",
    descriptionEn: "A futuristic reinterpretation of the iconic aviator. Ultra-thin white gold-plated frame, polarized scratch-resistant amber gradient lenses, and woven carbon temples.",
    category: "accessories",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1624222247344-550fb8ecf7db?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 950,
    stock: 30,
    rating: 4.9,
    badge: "Nouveauté",
    badgeEn: "New Luxury",
    specs: [
      { key: "Monture / Frame", value: "Acier chirurgical plaqué Or blanc / White Gold-Plated Surgical Steel" },
      { key: "Verres / Lenses", value: "Polarisés Haute Clarté UV400 / Clear Polarized UV400 Protect" },
      { key: "Poids / Weight", value: "19g" }
    ]
  },
  {
    id: "prod-17",
    name: "Tissu de Prestige 'Good Luck'",
    nameEn: "Prestige 'Good Luck' Silk Fabric",
    description: "Étoffe impériale légendaire 'Good Luck' plébiscitée par l'élite d'Afrique de l'Est et de l'Ouest. Tissage jacquard de soie et coton d'une brillance inégalée avec motifs filigranés incrustés de fils d'or brossé, idéal pour les grands boubous et tenues d'apparat.",
    descriptionEn: "Legendary 'Good Luck' imperial fabric revered by West & East African elites. Rich silk-cotton jacquard weaving with pure gold thread filigree, ideal for grand ceremonial wear.",
    category: "suits",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 1800,
    promoPrice: 1500,
    stock: 25,
    rating: 5.0,
    isExclu: true,
    badge: "Souveraineté",
    badgeEn: "Sovereign Tier",
    specs: [
      { key: "Matière / Fiber", value: "70% Soie Royale, 30% Coton d'Égypte / 70% Royal Silk, 30% Egyptian Cotton" },
      { key: "Longueur / Pack Size", value: "6 Yards de Noblesse Pure / 6 Yards Premium Pack" },
      { key: "Ornements / Detail", value: "Fils d'or brossé certifiés / Certified brushed gold threads" },
      { key: "Origine / Origin", value: "Atelier Haute façon SBMJ / SBMJ Premium Weaving" }
    ]
  },
  {
    id: "prod-18",
    name: "Véritable Super-Wax Hollandais Vlisco",
    nameEn: "Authentic Vlisco Dutch Super-Wax",
    description: "Le chef-d'œuvre originel de la maison Vlisco. Un coton double face d'une densité suprême aux coloris vibrants, imprimé selon la méthode ancestrale du wax hollandais authentique à la cire. Fini légèrement satiné d'une résistance éternelle.",
    descriptionEn: "The ultimate masterpiece from Vlisco. High-density double-faced signature cotton with intensely vibrant shades, wax printed using authentic Dutch ancestral techniques. Eternal wear resistance.",
    category: "suits",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 1100,
    stock: 40,
    rating: 4.9,
    badge: "Authentique",
    badgeEn: "100% Genuine",
    specs: [
      { key: "Marque / Brand", value: "L'authentique Super-Wax Vlisco / Genuine Vlisco Holland" },
      { key: "Longueur / Dimensions", value: "6 Yards (Env. 5.48m)" },
      { key: "Impression / Print", value: "Blocs de cira double-face d'excellence / Double-sided wax wax-block" },
      { key: "Toucher / Feel", value: "Épais, structuré et frais / Structured, crisp & cooling" }
    ]
  },
  {
    id: "prod-19",
    name: "Brocart Souverain de Soie Suisse",
    nameEn: "Sovereign Swiss Silk Brocade",
    description: "Tissu d'apparat exclusif importé de Suisse. Texture brocart robuste avec reliefs métalliques dorés fins représentant les symboles impériaux de notre Maison. Un drapé royal d'une tenue sublime.",
    descriptionEn: "Exclusive ceremonial brocade fabric imported directly from Switzerland. Solid textured weave featuring gold relief patterns depicting SBMJ majestic symbols. Perfect weight.",
    category: "suits",
    images: [
      "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 2400,
    stock: 15,
    rating: 5.0,
    isNew: true,
    badge: "Prestige Suisse",
    badgeEn: "Swiss Prestige",
    specs: [
      { key: "Origine / Sourced", value: "Textiles fins de Saint-Gall, Suisse / St. Gallen Swiss Weavers" },
      { key: "Longueur / Pack", value: "6 Yards d'Exception / 6 Yards Executive Cut" },
      { key: "Réf / Ref Code", value: "SBMJ-BR-09" }
    ]
  },
  {
    id: "prod-20",
    name: "Robe de Bal Impériale en Brocart Doré",
    nameEn: "Imperial Gold Brocade SBMJ Gown",
    description: "Un chef d'œuvre absolu d'atelier d'art. Robe de bal sculptée pour femme d'influence dans un brocart de soie italienne brossé fils d'or brossé 18K. Épaules structurées géométriques et traîne de soie monumentale.",
    descriptionEn: "True masterpiece of our design atelier. SBMJ women's ball gown structured with Italian silk brocade woven with genuine 18K gold threads. Bold shoulders and monumental train.",
    category: "women",
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 3800,
    stock: 8,
    rating: 5.0,
    isExclu: true,
    badge: "Haute Miniature Femme",
    badgeEn: "Women Haute Couture",
    specs: [
      { key: "Collection / Vibe", value: "Souveraineté Féminine Acte I / Iconic Sovereign Act I" },
      { key: "Matériaux / Trim", value: "Brocart de Soie, fils d'Or 18k / Silk Brocade, 18k Gold filament" },
      { key: "Garniture / Back", value: "Doublure satinée douce de France / French silk-satin inner lining" }
    ]
  },
  {
    id: "prod-21",
    name: "Robe Drapée Divine Reine de Sabbat",
    nameEn: "Divine Draped Silk Queen Gown",
    description: "Robe drapée d'une fluidité extraordinaire réalisée en pure soie de mûrier naturelle d'une teinte noir onyx hypnotique. Échancrure dorée asymétrique ornée d'une chaîne fine biseautée et finitions faites main.",
    descriptionEn: "Extraordinarily fluid draped gown handcrafted out of premium organic mulberry silk in deep onyx black. Asymmetric neckline trimmed with a gold bevel chain detail.",
    category: "women",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 3100,
    stock: 12,
    rating: 4.9,
    badge: "Exclusivité Femme",
    badgeEn: "SBMJ Elle",
    specs: [
      { key: "Composition / Body", value: "100% Pure Soie Organique 19 Momme / 100% Raw Mulberry Organic Silk" },
      { key: "Sertissage / Jewel", value: "Fermeture fine biseauté platine / Platinum-gilt custom clasp" },
      { key: "Ajustement / Outline", value: "Coutures invisibles sculptantes / Invisible silhouette shaping" }
    ]
  },
  {
    id: "prod-22",
    name: "StevenBmj L'Absolu - Parfum d'Élite",
    nameEn: "StevenBmj L'Absolu - Elite Extrait de Parfum",
    description: "Le parfum de signature de notre Maison. Un extrait à haute concentration (30%) conjuguant des notes intenses d'Ecorce d'Oud Sauvage du Cambodge, safran précieux de perse, et une larme de champagne ambré de prestige.",
    descriptionEn: "The definitive signature fragrance of Maison StevenBmj. High concentration extract (30%) pairing wild Cambodian Oud Wood, precious Persian Saffron, and notes of vintage champagne.",
    category: "perfumes",
    images: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 450,
    promoPrice: 380,
    stock: 50,
    rating: 5.0,
    isNew: true,
    badge: "Élixir d'Or",
    badgeEn: "Gold Sillage",
    specs: [
      { key: "Concentration / Type", value: "Extrait de Parfum Absolu (30% d'Huiles Nobles)" },
      { key: "Sillage / Duration", value: "Tenue éternelle (+24 h cliniques / Eternal dry down)" },
      { key: "Boîte / Presentation", value: "Flacon en cristal baccarat taillé main / Baccarat hand-cut crystal vase" }
    ]
  },
  {
    id: "prod-23",
    name: "Nuit d'Ombre Souveraine - Parfum d'Or",
    nameEn: "Sovereign Shadow Night - Gold Elixir",
    description: "Une fragrance mystique et envoûtante d'ombres, mariant l'encens impérial d'Oman à la sensualité d'un cuir épicé vanillé fève tonka grillé. Le parfum idéal de l'influenceur secret de la nuit.",
    descriptionEn: "Mystical sovereign evening fragrance combining Oman's sacred white frankincense with deep spiced leather, and roasted tonka bean vanilla extract.",
    category: "perfumes",
    images: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&auto=format&fit=crop"
    ],
    price: 390,
    stock: 35,
    rating: 4.8,
    badge: "Parfum d'Exception",
    badgeEn: "Royal Mist",
    specs: [
      { key: "Notes de tête / Top", value: "Encens blanc, Poivre de Sichuan / White Incense, Sichuan pepper" },
      { key: "Notes de cœur / Heart", value: "Cuir impérial de Toscane, Oud / Tuscan leather, Ambergris" },
      { key: "Notes de fond / Dry", value: "Fève de Tonka brûlée, Vanille bourbon / Rich roasted Tonka, Bourbon vanilla" }
    ]
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Alexander von Bismarck",
    rating: 5,
    comment: "La montre La Royale dépasse toutes les espérances. Le mouvement est incroyablement silencieux et le fini or rose capte la lumière d'une façon divine.",
    commentEn: "The Royale watch exceeds all expectations. The movement is incredibly silent and the rose gold capture has a divine glow.",
    date: "2026-05-18",
    verified: true
  },
  {
    id: "rev-2",
    author: "Jean-Louis G.",
    rating: 5,
    comment: "Le costume Midnight Chelsea s'adapte comme une seconde peau. Les finitions intérieures confirment le niveau haute couture.",
    commentEn: "The Midnight Chelsea suit fits like a second skin. Internal masteries verify the high fashion classification.",
    date: "2026-05-12",
    verified: true
  },
  {
    id: "rev-3",
    author: "Marcus Aurelius K.",
    rating: 4,
    comment: "Excellent service client de luxe. Reçu en 48h par porteur privé avec la facture PDF dorée.",
    commentEn: "Excellent luxury client service. Received in 48h via private courier packaging along with the gold-themed PDF invoice.",
    date: "2026-05-01",
    verified: true
  }
];
