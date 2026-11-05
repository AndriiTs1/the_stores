/**
 * Demo product photos from Unsplash (https://unsplash.com/license), chosen by hand: plain garments, light
 * backgrounds, no brand logos, no recognisable faces. Only the photos' raw URLs are stored (no files in the repository):
 * demoImageUrl() adds a 3:4 crop. The photographers are credited on the product page and in docs/demo-photo-credits.md.
 * Each photo's download_location was triggered once when it was chosen (an Unsplash API rule).
 */
export type DemoPhoto = { raw: string; author: string; authorUrl: string; photoUrl: string };

/** 3:4 crop at 1200×1600 (Unsplash's image CDN does the crop; next/image sizes it further). */
export const demoImageUrl = (raw: string) => `${raw}&w=1200&h=1600&fit=crop&crop=entropy&auto=format&q=75`;

export const demoPhotos: Record<string, DemoPhoto[]> = {
  "t-shirt-classic": [
    {
      raw: "https://images.unsplash.com/photo-1759572095384-1a7e646d0d4f?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8Nnx8YmxhY2slMjB0LXNoaXJ0JTIwZmxhdCUyMGxheSUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwxfDF8fHwxNzkzODk3NzA4fDA&ixlib=rb-4.1.0",
      author: "tian dayong",
      authorUrl: "https://unsplash.com/@tonnnyj",
      photoUrl: "https://unsplash.com/photos/two-t-shirts-black-and-light-green-with-cotton-sprigs-EFCpLBQbxIU",
    },
    {
      raw: "https://images.unsplash.com/photo-1666358068315-b8de653a0f58?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTN8fGJsYWNrJTIwdC1zaGlydCUyMGZsYXQlMjBsYXklMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MXwxfHx8MTc5Mzg5NzcwOHww&ixlib=rb-4.1.0",
      author: "Or Hakim",
      authorUrl: "https://unsplash.com/@orhakim",
      photoUrl: "https://unsplash.com/photos/a-black-tie-with-a-black-band-q_RL3dk_j9Y",
    },
  ],
  "windjacke-ridge": [
    {
      raw: "https://images.unsplash.com/photo-1673712060934-34358642511b?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8M3x8Z3JlZW4lMjByYWluJTIwamFja2V0JTIwaGFuZ2luZ3xlbnwxfHx8fDE3OTM4OTc4MjV8MA&ixlib=rb-4.1.0",
      author: "Deyan Sight",
      authorUrl: "https://unsplash.com/@deyansight",
      photoUrl: "https://unsplash.com/photos/a-row-of-green-suits-hanging-on-a-rail-OhjG66NrPqk",
    },
    {
      raw: "https://images.unsplash.com/photo-1785844670705-81f8428bea35?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8N3x8Z3JlZW4lMjBhbm9yYWslMjBqYWNrZXR8ZW58MXx8fHwxNzkzODk3OTk3fDA&ixlib=rb-4.1.0",
      author: "Gabriel H.",
      authorUrl: "https://unsplash.com/@graberel",
      photoUrl: "https://unsplash.com/photos/a-person-in-a-green-raincoat-stands-in-shallow-water-mEcGpnSk7GY",
    },
  ],
  "leggings-flow": [
    {
      raw: "https://images.unsplash.com/photo-1789110853564-23a6b1d206e7?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8NXx8YmxhY2slMjBsZWdnaW5ncyUyMGZsYXQlMjBsYXl8ZW58MXwxfHx8MTc5Mzg5NzczNnww&ixlib=rb-4.1.0",
      author: "engin akyurt",
      authorUrl: "https://unsplash.com/@enginakyurt",
      photoUrl: "https://unsplash.com/photos/person-in-black-leggings-and-sneakers-oLBDdtWYUEo",
    },
    {
      raw: "https://images.unsplash.com/photo-1789111161057-90c5ce12dc21?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTF8fGJsYWNrJTIwbGVnZ2luZ3MlMjBmbGF0JTIwbGF5fGVufDF8MXx8fDE3OTM4OTc3MzZ8MA&ixlib=rb-4.1.0",
      author: "engin akyurt",
      authorUrl: "https://unsplash.com/@enginakyurt",
      photoUrl: "https://unsplash.com/photos/person-wearing-black-leggings-and-sneakers-izuoZijZ7yQ",
    },
    {
      raw: "https://images.unsplash.com/photo-1789111161024-14711920a5b0?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MXx8YmxhY2slMjBsZWdnaW5ncyUyMGZsYXQlMjBsYXl8ZW58MXwxfHx8MTc5Mzg5NzczNnww&ixlib=rb-4.1.0",
      author: "engin akyurt",
      authorUrl: "https://unsplash.com/@enginakyurt",
      photoUrl: "https://unsplash.com/photos/woman-wearing-black-activewear-outfit-Str8IYrWG0U",
    },
  ],
  "kinder-hoodie": [
    {
      raw: "https://images.unsplash.com/photo-1621344581337-f64296f2f4bc?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTB8fHJlZCUyMGhvb2RpZSUyMGhhbmdpbmd8ZW58MXx8fHwxNzkzODk3ODI2fDA&ixlib=rb-4.1.0",
      author: "David Dvo\u0159\u00e1\u010dek",
      authorUrl: "https://unsplash.com/@dafidvor",
      photoUrl: "https://unsplash.com/photos/red-textile-on-white-wall-gH-_mSYszuw",
    },
    {
      raw: "https://images.unsplash.com/photo-1604644401890-0bd678c83788?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTd8fHJlZCUyMGhvb2RpZSUyMGhhbmdpbmd8ZW58MXx8fHwxNzkzODk3ODI2fDA&ixlib=rb-4.1.0",
      author: "Markus Spiske",
      authorUrl: "https://unsplash.com/@markusspiske",
      photoUrl: "https://unsplash.com/photos/blue-red-and-orange-textiles-jddw6iA31sE",
    },
  ],
  "hoodie-hilltop": [
    {
      raw: "https://images.unsplash.com/photo-1742392133846-a8b416e81661?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTB8fGdyZXklMjBob29kaWUlMjBmbGF0JTIwbGF5fGVufDF8MXx8fDE3OTM4OTc3Mzd8MA&ixlib=rb-4.1.0",
      author: "Anastasiia Polishchuk",
      authorUrl: "https://unsplash.com/@polishuchka",
      photoUrl: "https://unsplash.com/photos/a-hoodie-is-hanging-on-a-closed-door-VXEca6MPGKk",
    },
    {
      raw: "https://images.unsplash.com/photo-1591890169748-c036561865cd?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MjN8fGdyZXklMjBob29kaWUlMjBmbGF0JTIwbGF5fGVufDF8MXx8fDE3OTM4OTc3Mzd8MA&ixlib=rb-4.1.0",
      author: "LOGAN WEAVER | @LGNWVR",
      authorUrl: "https://unsplash.com/@lgnwvr",
      photoUrl: "https://unsplash.com/photos/person-in-gray-hoodie-sitting-on-rock-C6wdZgOrIPs",
    },
  ],
  "sport-top-move": [
    {
      raw: "https://images.unsplash.com/photo-1706550631754-d121fd4840be?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8NHx8Ymx1ZSUyMHNwb3J0cyUyMGJyYSUyMGZsYXQlMjBsYXl8ZW58MXwxfHx8MTc5Mzg5NzczOHww&ixlib=rb-4.1.0",
      author: "Joshua D\u00edaz",
      authorUrl: "https://unsplash.com/@joshudiaz",
      photoUrl: "https://unsplash.com/photos/a-woman-in-a-blue-sports-bra-top-and-leggings-SplIVRhqta8",
    },
  ],
  trainingsjacke: [
    {
      raw: "https://images.unsplash.com/photo-1555529733-d1bc3c140ca8?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8NXx8Ymx1ZSUyMHppcCUyMGphY2tldCUyMGhhbmdlcnxlbnwxfHx8fDE3OTM4OTc4Mjh8MA&ixlib=rb-4.1.0",
      author: "charlesdeluvio",
      authorUrl: "https://unsplash.com/@charlesdeluvio",
      photoUrl: "https://unsplash.com/photos/assorted-color-shirt-on-rack-kPKFdPQTz9Y",
    },
  ],
  "kinder-t-shirt": [
    {
      raw: "https://images.unsplash.com/photo-1792566370756-2bd1fe7d15a1?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8OHx8Ymx1ZSUyMHQtc2hpcnQlMjBoYW5nZXJ8ZW58MXx8fHwxNzkzODk3ODI5fDA&ixlib=rb-4.1.0",
      author: "AZUKI .V",
      authorUrl: "https://unsplash.com/@azukiv",
      photoUrl: "https://unsplash.com/photos/blue-shirts-hanging-on-hangers-FicoNs1EhcQ",
    },
    {
      raw: "https://images.unsplash.com/photo-1666358062946-c05cbbcf5686?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTR8fGJsdWUlMjB0LXNoaXJ0JTIwaGFuZ2VyfGVufDF8fHx8MTc5Mzg5NzgyOXww&ixlib=rb-4.1.0",
      author: "Or Hakim",
      authorUrl: "https://unsplash.com/@orhakim",
      photoUrl: "https://unsplash.com/photos/a-blue-and-black-dress-on-a-swinger-AqCfQOLAFVM",
    },
  ],
  "rashguard-langarm": [
    {
      raw: "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8N3x8cmVkJTIwbG9uZyUyMHNsZWV2ZSUyMHNoaXJ0JTIwaGFuZ2VyfGVufDF8fHx8MTc5Mzg5NzkwMnww&ixlib=rb-4.1.0",
      author: "Giovanna Karla",
      authorUrl: "https://unsplash.com/@giviok",
      photoUrl: "https://unsplash.com/photos/a-rack-of-shirts-hanging-on-a-rail--fiB9jZe93w",
    },
  ],
  "jogginghose-basic": [
    {
      raw: "https://images.unsplash.com/photo-1656991483595-8a11da8d2bde?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8NXx8Z3JleSUyMHN3ZWF0cGFudHMlMjBmbGF0JTIwbGF5fGVufDF8MXx8fDE3OTM4OTc3NDF8MA&ixlib=rb-4.1.0",
      author: "Federico Faccipieri",
      authorUrl: "https://unsplash.com/@efecubo",
      photoUrl: "https://unsplash.com/photos/a-pair-of-grey-pants-gu7_nO9C7_8",
    },
    {
      raw: "https://images.unsplash.com/photo-1776186432015-9258ba5ea4c7?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MjV8fGdyZXklMjBzd2VhdHBhbnRzJTIwZmxhdCUyMGxheXxlbnwxfDF8fHwxNzkzODk3NzQxfDA&ixlib=rb-4.1.0",
      author: "\u0414\u0430\u0440\u044c\u044f \u0428\u043a\u0430\u0440\u0443\u0431\u0430",
      authorUrl: "https://unsplash.com/@223103d",
      photoUrl: "https://unsplash.com/photos/person-wearing-grey-sweatpants-and-black-boots-_V41KmkWlEQ",
    },
  ],
  "laufshirt-damen": [
    {
      raw: "https://images.unsplash.com/photo-1792566370845-f0ea450f2028?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8N3x8cmVkJTIwdC1zaGlydCUyMGhhbmdlcnxlbnwxfHx8fDE3OTM4OTc4MzB8MA&ixlib=rb-4.1.0",
      author: "AZUKI .V",
      authorUrl: "https://unsplash.com/@azukiv",
      photoUrl: "https://unsplash.com/photos/folded-t-shirts-in-red-gradient-VmiX2a10-Tw",
    },
    {
      raw: "https://images.unsplash.com/photo-1789110520061-107e1c6057fa?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MXx8cmVkJTIwdC1zaGlydCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3OTM4OTgwMDB8MA&ixlib=rb-4.1.0",
      author: "engin akyurt",
      authorUrl: "https://unsplash.com/@enginakyurt",
      photoUrl: "https://unsplash.com/photos/person-in-red-shirt-and-jeans-ged-bT_BToY",
    },
  ],
  "softshell-jacke": [
    {
      raw: "https://images.unsplash.com/photo-1658418818804-adc6dc129ac2?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8OHx8YmxhY2slMjBqYWNrZXQlMjBoYW5naW5nfGVufDF8fHx8MTc5Mzg5NzkwM3ww&ixlib=rb-4.1.0",
      author: "nkosie MAPHUMULO",
      authorUrl: "https://unsplash.com/@nkosi_nuz",
      photoUrl: "https://unsplash.com/photos/a-black-jacket-on-a-white-wall-kNVl-jxS_X0",
    },
    {
      raw: "https://images.unsplash.com/photo-1564386506169-130519bf4dc9?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTB8fGJsYWNrJTIwamFja2V0JTIwaGFuZ2luZ3xlbnwxfHx8fDE3OTM4OTc5MDN8MA&ixlib=rb-4.1.0",
      author: "Chintya Akemi Keirayuki",
      authorUrl: "https://unsplash.com/@keirayukiii",
      photoUrl: "https://unsplash.com/photos/three-black-coats-CXs8vyTGGpM",
    },
  ],
  "kapuzenjacke-damen": [
    {
      raw: "https://images.unsplash.com/photo-1658527311766-890dfd2eda9f?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8Nnx8YmVpZ2UlMjBob29kaWUlMjBoYW5nZXJ8ZW58MXx8fHwxNzkzODk3ODMyfDA&ixlib=rb-4.1.0",
      author: "David Mendoza",
      authorUrl: "https://unsplash.com/@mendoza_nz",
      photoUrl: "https://unsplash.com/photos/a-person-holding-a-large-bag-6ieSwpDKw8g",
    },
  ],
  "kinder-trainerhose": [
    {
      raw: "https://images.unsplash.com/photo-1789110520164-2389992e5d0f?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8M3x8Z3JleSUyMGpvZ2dlcnN8ZW58MXx8fHwxNzkzODk3ODMyfDA&ixlib=rb-4.1.0",
      author: "engin akyurt",
      authorUrl: "https://unsplash.com/@enginakyurt",
      photoUrl: "https://unsplash.com/photos/person-wearing-grey-sweatpants-and-sneakers-D0eeGzigQ2k",
    },
    {
      raw: "https://images.unsplash.com/photo-1789110854262-ec66f0648ec7?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8NHx8Z3JleSUyMGpvZ2dlcnN8ZW58MXx8fHwxNzkzODk3ODMyfDA&ixlib=rb-4.1.0",
      author: "engin akyurt",
      authorUrl: "https://unsplash.com/@enginakyurt",
      photoUrl: "https://unsplash.com/photos/person-in-sweatpants-and-crop-top-q7HfJHayc18",
    },
  ],
  "shorts-training": [
    {
      raw: "https://images.unsplash.com/photo-1789110519888-758d7ab3908e?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8NXx8YmxhY2slMjBhdGhsZXRpYyUyMHNob3J0cyUyMGZsYXQlMjBsYXl8ZW58MXwxfHx8MTc5Mzg5Nzc0NXww&ixlib=rb-4.1.0",
      author: "engin akyurt",
      authorUrl: "https://unsplash.com/@enginakyurt",
      photoUrl: "https://unsplash.com/photos/person-wearing-black-shorts-and-sneakers-3IBjM04tA50",
    },
    {
      raw: "https://images.unsplash.com/photo-1719473442915-016f3ebda79a?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTB8fGJsYWNrJTIwYXRobGV0aWMlMjBzaG9ydHMlMjBmbGF0JTIwbGF5fGVufDF8MXx8fDE3OTM4OTc3NDV8MA&ixlib=rb-4.1.0",
      author: "TuanAnh Blue",
      authorUrl: "https://unsplash.com/@blueeyeaa",
      photoUrl: "https://unsplash.com/photos/a-group-of-three-shorts-sitting-next-to-each-other-ZgDpz1A9-U4",
    },
  ],
  "beanie-alpin": [
    {
      raw: "https://images.unsplash.com/photo-1649315461860-c2be63c1c2c6?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MTJ8fGJlYW5pZSUyMGZsYXQlMjBsYXl8ZW58MXx8fHwxNzkzODk3OTAzfDA&ixlib=rb-4.1.0",
      author: "Andrew Romanov",
      authorUrl: "https://unsplash.com/@romanovandrew",
      photoUrl: "https://unsplash.com/photos/a-cup-of-coffee-and-a-book-on-a-bed-j8hHV3rWb88",
    },
    {
      raw: "https://images.unsplash.com/photo-1584371632528-60e154034672?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MXx8cmVkJTIwYmVhbmllfGVufDF8fHx8MTc5Mzg5ODAwMnww&ixlib=rb-4.1.0",
      author: "engin akyurt",
      authorUrl: "https://unsplash.com/@enginakyurt",
      photoUrl: "https://unsplash.com/photos/red-textile-in-close-up-photography-VWclpOWJp6c",
    },
  ],
  "jeansjacke-anna": [
    {
      raw: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MXx8ZGVuaW0lMjBqYWNrZXQlMjBmbGF0JTIwbGF5fGVufDF8fHx8MTc5MzkxMjI5Mnww&ixlib=rb-4.1.0",
      author: "kemal alkan",
      authorUrl: "https://unsplash.com/@kemalalkan",
      photoUrl: "https://unsplash.com/photos/blue-washed-jacket-hanging-on-white-door-_BDBEP0ePQc",
    },
    {
      raw: "https://images.unsplash.com/photo-1700929979587-ac76c57c5ee1?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MzB8fGRlbmltJTIwamFja2V0JTIwZmxhdCUyMGxheXxlbnwxfHx8fDE3OTM5MTIyOTJ8MA&ixlib=rb-4.1.0",
      author: "Omar Roque",
      authorUrl: "https://unsplash.com/@olroque",
      photoUrl: "https://unsplash.com/photos/a-denim-jacket-with-a-fur-collar-hanging-on-a-wall-ahXm5bvYIuU",
    },
  ],
  "hoodie-anna": [
    {
      raw: "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MXx8aG9vZGllJTIwZmxhdCUyMGxheXxlbnwxfHx8fDE3OTM5MTIyOTN8MA&ixlib=rb-4.1.0",
      author: "Mediamodifier",
      authorUrl: "https://unsplash.com/@mediamodifier",
      photoUrl: "https://unsplash.com/photos/white-hoodie-and-distressed-jeans-kJXGTOY1wLQ",
    },
  ],
  "jeans-anna": [
    {
      raw: "https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8Mnx8amVhbnMlMjBmbGF0JTIwbGF5fGVufDF8fHx8MTc5MzkxMjI5NHww&ixlib=rb-4.1.0",
      author: "TuanAnh Blue",
      authorUrl: "https://unsplash.com/@blueeyeaa",
      photoUrl: "https://unsplash.com/photos/a-pair-of-blue-jeans-on-a-white-background-9yoXrG6Er_g",
    },
    {
      raw: "https://images.unsplash.com/photo-1714143136367-7bb68f3f0669?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8NXx8amVhbnMlMjBmbGF0JTIwbGF5fGVufDF8fHx8MTc5MzkxMjI5NHww&ixlib=rb-4.1.0",
      author: "TuanAnh Blue",
      authorUrl: "https://unsplash.com/@blueeyeaa",
      photoUrl: "https://unsplash.com/photos/the-back-of-a-pair-of-blue-jeans-UinXCaBz44A",
    },
  ],
  "ledertasche-anna": [
    {
      raw: "https://images.unsplash.com/photo-1691480150204-66dd1eb77391?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8MXx8bGVhdGhlciUyMGJhZyUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3OTM5MTIyOTV8MA&ixlib=rb-4.1.0",
      author: "personalgraphic.com",
      authorUrl: "https://unsplash.com/@personal_graphic",
      photoUrl: "https://unsplash.com/photos/a-brown-leather-handbag-on-a-white-background-IFlg3kFbR0E",
    },
    {
      raw: "https://images.unsplash.com/photo-1691480250099-a63081ecfcb8?ixid=M3wxMTI0NTAzfDB8MXxzZWFyY2h8Mnx8bGVhdGhlciUyMGJhZyUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3OTM5MTIyOTV8MA&ixlib=rb-4.1.0",
      author: "personalgraphic.com",
      authorUrl: "https://unsplash.com/@personal_graphic",
      photoUrl: "https://unsplash.com/photos/a-brown-leather-handbag-on-a-white-background-zxPo13geJ5U",
    },
  ],
};

/** A demo product's images (3:4 URLs) and their credits, for the seed and db:update-demo. */
export function demoProductImages(slug: string) {
  const photos = demoPhotos[slug] ?? [];
  return {
    images: photos.map((p) => demoImageUrl(p.raw)),
    imageCredits: photos.map(({ author, authorUrl, photoUrl }) => ({ author, authorUrl, photoUrl, source: "Unsplash" })),
  };
}
