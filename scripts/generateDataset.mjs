// Deterministic synthetic restaurant dataset generator for Craverly.
// Run with: node scripts/generateDataset.mjs
// Writes two files:
//   src/data/generatedDataset.ts  -> generatedRestaurants, generatedMenuItems, generatedReviews
//   src/data/menuBanks.ts         -> shared cuisine menu banks + builder (used by live OSM gap-fill)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DATA = join(ROOT, "src", "data");
mkdirSync(OUT_DATA, { recursive: true });

// Deterministic PRNG so output is reproducible across runs.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260921);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length > 0) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
};
const intBetween = (min, max) => min + Math.floor(rand() * (max - min + 1));
const round1 = (n) => Math.round(n * 10) / 10;

// ── Deterministic, varied Unsplash image pools ──
// Restaurants pick a header photo from their primary cuisine's pool; menu items
// pick from their category's pool keyed on id+name. Stable hash → same output
// every run, and adjacent cards/items never share the same photo.
const hash = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
};

const RESTAURANT_IMAGES = {
  "South Indian": [
    "photo-1630383249896-424e482df921",
    "photo-1585032226651-759b368d7246",
    "photo-1601050690597-df0568f70950",
    "photo-1565557623262-b51c2513a641",
    "photo-1596797038530-2c107229654b",
    "photo-1631452180519-c014fe946bc7",
    "photo-1668236543090-82eba5ee5976",
    "photo-1519676867240-f03562e64548",
  ],
  Chettinad: [
    "photo-1585937421612-70a008356fbe",
    "photo-1589302168068-964664d93dc0",
    "photo-1555396273-367ea4eb4db5",
    "photo-1541518763669-27fef04b14ea",
    "photo-1601050690597-df0568f70950",
    "photo-1512058564366-18510be2db19",
    "photo-1569729394086-37c55d50fb0a",
    "photo-1596797038530-2c107229654b",
  ],
  Biryani: [
    "photo-1585937421612-70a008356fbe",
    "photo-1601050690597-df0568f70950",
    "photo-1589302168068-964664d93dc0",
    "photo-1565557623262-b51c2513a641",
    "photo-1631452180519-c014fe946bc7",
    "photo-1541518763669-27fef04b14ea",
    "photo-1596797038530-2c107229654b",
    "photo-1600891964092-4316c288032e",
  ],
  "North Indian": [
    "photo-1541518763669-27fef04b14ea",
    "photo-1555396273-367ea4eb4db5",
    "photo-1601050690597-df0568f70950",
    "photo-1589302168068-964664d93dc0",
    "photo-1596797038530-2c107229654b",
    "photo-1631452180519-c014fe946bc7",
    "photo-1547592180-85f173990554",
    "photo-1551183053-bf91a1d81141",
  ],
  Mughlai: [
    "photo-1601050690597-df0568f70950",
    "photo-1585937421612-70a008356fbe",
    "photo-1541518763669-27fef04b14ea",
    "photo-1555396273-367ea4eb4db5",
    "photo-1606491956689-2ea866880c84",
    "photo-1631452180519-c014fe946bc7",
    "photo-1585032226651-759b368d7246",
    "photo-1600891964092-4316c288032e",
  ],
  Chinese: [
    "photo-1563245372-f21724e3856d",
    "photo-1569718212165-3a8278d5f624",
    "photo-1512058564366-18510be2db19",
    "photo-1582878826629-29b7ad1cdc43",
    "photo-1526318896980-cf78c088247c",
    "photo-1548940740-204726a19be3",
    "photo-1512621776951-a57141f2eefd",
    "photo-1569058242253-92a9c755a0ec",
  ],
  Seafood: [
    "photo-1519708227418-c8fd9a32b7a2",
    "photo-1580476262798-bddd9f4b7369",
    "photo-1615141982883-c7ad0e69fd62",
    "photo-1626776755763-74b1a70262ab",
    "photo-1600028068383-ea11a7a101f3",
    "photo-1544551763-46a013bb70d5",
    "photo-1534008757030-27299c4371b6",
    "photo-1467003909585-2f8a72700288",
  ],
  "Maharashtrian": [
    "photo-1601050690597-df0568f70950",
    "photo-1589302168068-964664d93dc0",
    "photo-1596797038530-2c107229654b",
    "photo-1565557623262-b51c2513a641",
    "photo-1631452180519-c014fe946bc7",
    "photo-1555396273-367ea4eb4db5",
    "photo-1567620905732-2d1ec7ab7445",
    "photo-1541518763669-27fef04b14ea",
  ],
  "Street Food": [
    "photo-1551024506-0bccd828d307",
    "photo-1565299507177-b0ac66763828",
    "photo-1546069901-ba9599a7e63c",
    "photo-1568901346375-23c9450c58cd",
    "photo-1553979459-d2229ba7433b",
    "photo-1529042410759-befb1204b468",
    "photo-1569074187119-c87815b476da",
    "photo-1626082927389-6cd097cec6d9",
  ],
  Pizza: [
    "photo-1513104890138-7c749659a591",
    "photo-1574071318508-1cdbab80d002",
    "photo-1593560708920-61dd98c46a4e",
    "photo-1604382354936-07c5d9983bd3",
    "photo-1517248135467-4c7edcad34c4",
    "photo-1565299624946-b28f40a0ae38",
    "photo-1552566626-52f8b828add9",
    "photo-1414235077428-338989a2e8c0",
  ],
  "Fast Food": [
    "photo-1568901346375-23c9450c58cd",
    "photo-1571091718767-18b5b1457add",
    "photo-1553979459-d2229ba7433b",
    "photo-1586190848861-99aa4a171e90",
    "photo-1565299507177-b0ac66763828",
    "photo-1594212699903-ec8a3eca50f5",
    "photo-1529042410759-befb1204b468",
    "photo-1551024506-0bccd828d307",
  ],
  Desserts: [
    "photo-1578985545062-69928b1d9587",
    "photo-1568901346010-59a936fe2b92",
    "photo-1587314168485-3236d6710814",
    "photo-1606313564200-e75d5e30476c",
    "photo-1551024601-bec78aea704b",
    "photo-1624353365286-3f8d62daad51",
    "photo-1488477181946-6428a0291777",
    "photo-1563805042-7684c019e1cb",
  ],
  Bakery: [
    "photo-1509440159596-0249088772ff",
    "photo-1549931319-a545dcf3bc73",
    "photo-1555507036-ab1f4038808a",
    "photo-1517433670267-08bbd4be890f",
    "photo-1568254183919-78a4f43a2877",
    "photo-1578985545062-69928b1d9587",
    "photo-1608198093002-ad4e005484ec",
    "photo-1546069901-ba9599a7e63c",
  ],
  Healthy: [
    "photo-1512621776951-a57141f2eefd",
    "photo-1546069901-ba9599a7e63c",
    "photo-1540420773420-3366772f4999",
    "photo-1490645935967-10de6ba17061",
    "photo-1511690743698-d9d85f2fbf38",
    "photo-1607532941433-304659e8198a",
    "photo-1553909489-cd47e0907980",
    "photo-1467003909585-2f8a72700288",
  ],
  Cafe: [
    "photo-1509042239860-f550ce710b93",
    "photo-1495474472287-4d71bcdd2085",
    "photo-1544787219-7f47ccb76574",
    "photo-1541167760496-1628856ab772",
    "photo-1554118811-1e0d58224f24",
    "photo-1521017432531-fbd92d768814",
    "photo-1537047902294-62a40c20a6ae",
    "photo-1554118811-1e0d58224f24",
  ],
  default: [
    "photo-1517248135467-4c7edcad34c4",
    "photo-1552566626-52f8b828add9",
    "photo-1414235077428-338989a2e8c0",
    "photo-1514933651103-005eec06c04b",
    "photo-1550966871-3ed3cdb5ed0c",
    "photo-1587244625632-9dbab6639940",
    "photo-1558830233-415cdfa7257e",
    "photo-1551218808-94e220e084d2",
  ],
};
const img = (cuisine, seed) => {
  const pool = RESTAURANT_IMAGES[cuisine] ?? RESTAURANT_IMAGES.default;
  return `https://images.unsplash.com/${pool[hash(seed) % pool.length]}?w=500`;
};

const DISH_IMAGES = {
  Starters: [
    "photo-1541014741259-de529411b96a",
    "photo-1529042410759-befb1204b468",
    "photo-1569058242253-92a9c755a0ec",
    "photo-1599487488170-d11ec9c172f0",
    "photo-1553621042-f6e147245754",
    "photo-1568901346375-23c9450c58cd",
    "photo-1555939594-58d7cb561ad1",
    "photo-1544025162-d76694265947",
  ],
  Soup: [
    "photo-1547592166-23ac45744acd",
    "photo-1476718406336-bb5a9690ee2a",
    "photo-1603105037880-880cd4edfb0d",
    "photo-1569718212165-3a8278d5f624",
    "photo-1600850053665-c9a2f3595eae",
    "photo-1628573041582-7498d53a159c",
  ],
  Chats: [
    "photo-1565299507177-b0ac66763828",
    "photo-1551024506-0bccd828d307",
    "photo-1606491956689-2ea866880c84",
    "photo-1596797038530-2c107229654b",
    "photo-1546069901-ba9599a7e63c",
    "photo-1565557623262-b51c2513a641",
  ],
  Snacks: [
    "photo-1565299507177-b0ac66763828",
    "photo-1568901346375-23c9450c58cd",
    "photo-1553979459-d2229ba7433b",
    "photo-1551024506-0bccd828d307",
    "photo-1546069901-ba9599a7e63c",
    "photo-1594212699903-ec8a3eca50f5",
    "photo-1567620905732-2d1ec7ab7445",
  ],
  Tiffins: [
    "photo-1630383249896-424e482df921",
    "photo-1585032226651-759b368d7246",
    "photo-1601050690597-df0568f70950",
    "photo-1565557623262-b51c2513a641",
    "photo-1631452180519-c014fe946bc7",
    "photo-1596797038530-2c107229654b",
    "photo-1519676867240-f03562e64548",
    "photo-1668236543090-82eba5ee5976",
  ],
  "Main Course": [
    "photo-1541518763669-27fef04b14ea",
    "photo-1555396273-367ea4eb4db5",
    "photo-1589302168068-964664d93dc0",
    "photo-1601050690597-df0568f70950",
    "photo-1596797038530-2c107229654b",
    "photo-1631452180519-c014fe946bc7",
    "photo-1565557623262-b51c2513a641",
    "photo-1574482620812-9edfadefc252",
  ],
  Biryani: [
    "photo-1585937421612-70a008356fbe",
    "photo-1601050690597-df0568f70950",
    "photo-1589302168068-964664d93dc0",
    "photo-1565557623262-b51c2513a641",
    "photo-1606491956689-2ea866880c84",
    "photo-1596797038530-2c107229654b",
    "photo-1541518763669-27fef04b14ea",
  ],
  Rice: [
    "photo-1512058564366-18510be2db19",
    "photo-1569718212165-3a8278d5f624",
    "photo-1541518763669-27fef04b14ea",
    "photo-1565557623262-b51c2513a641",
    "photo-1601050690597-df0568f70950",
    "photo-1631452180519-c014fe946bc7",
  ],
  Noodles: [
    "photo-1569718212165-3a8278d5f624",
    "photo-1563245372-f21724e3856d",
    "photo-1512058564366-18510be2db19",
    "photo-1582878826629-29b7ad1cdc43",
    "photo-1548940740-204726a19be3",
    "photo-1526318896980-cf78c088247c",
  ],
  Pasta: [
    "photo-1473093295043-cdd812d0e601",
    "photo-1563379929298-7635d7f71c64",
    "photo-1495195134817-aeb325a55b65",
    "photo-1603105037880-880cd4edfb0d",
    "photo-1579684947550-22e945225d9a",
    "photo-1598866594230-a7c12756260f",
  ],
  Pizza: [
    "photo-1513104890138-7c749659a591",
    "photo-1574071318508-1cdbab80d002",
    "photo-1593560708920-61dd98c46a4e",
    "photo-1604382354936-07c5d9983bd3",
    "photo-1565299624946-b28f40a0ae38",
    "photo-1548369937-47519962c11a",
  ],
  Burgers: [
    "photo-1568901346375-23c9450c58cd",
    "photo-1571091718767-18b5b1457add",
    "photo-1553979459-d2229ba7433b",
    "photo-1586190848861-99aa4a171e90",
    "photo-1565299507177-b0ac66763828",
    "photo-1594212699903-ec8a3eca50f5",
  ],
  Bowls: [
    "photo-1512621776951-a57141f2eefd",
    "photo-1546069901-ba9599a7e63c",
    "photo-1540420773420-3366772f4999",
    "photo-1511690743698-d9d85f2fbf38",
    "photo-1540189549336-e6e99c3679fe",
    "photo-1476224203421-9ac39bcb3327",
  ],
  Salads: [
    "photo-1512621776951-a57141f2eefd",
    "photo-1540420773420-3366772f4999",
    "photo-1511690743698-d9d85f2fbf38",
    "photo-1607532941433-304659e8198a",
    "photo-1553909489-cd47e0907980",
    "photo-1490645935967-10de6ba17061",
  ],
  Toasts: [
    "photo-1509440159596-0249088772ff",
    "photo-1557200134-90327ee9fafa",
    "photo-1525351484163-7529414344d8",
    "photo-1484723091739-30a097e8f929",
    "photo-1533089860892-a7c6f0a88666",
    "photo-1567620905732-2d1ec7ab7445",
  ],
  Breads: [
    "photo-1509440159596-0249088772ff",
    "photo-1549931319-a545dcf3bc73",
    "photo-1555507036-ab1f4038808a",
    "photo-1509365465985-25d11c17e812",
    "photo-1481070414801-51fd732d7184",
    "photo-1557925923-cd4648e211a0",
  ],
  Sides: [
    "photo-1568901346375-23c9450c58cd",
    "photo-1546069901-ba9599a7e63c",
    "photo-1551024506-0bccd828d307",
    "photo-1540420773420-3366772f4999",
    "photo-1569058242253-92a9c755a0ec",
    "photo-1599487488170-d11ec9c172f0",
  ],
  Cakes: [
    "photo-1578985545062-69928b1d9587",
    "photo-1568901346010-59a936fe2b92",
    "photo-1587314168485-3236d6710814",
    "photo-1606313564200-e75d5e30476c",
    "photo-1551024601-bec78aea704b",
    "photo-1624353365286-3f8d62daad51",
  ],
  Desserts: [
    "photo-1578985545062-69928b1d9587",
    "photo-1568901346010-59a936fe2b92",
    "photo-1587314168485-3236d6710814",
    "photo-1606313564200-e75d5e30476c",
    "photo-1551024601-bec78aea704b",
    "photo-1563805042-7684c019e1cb",
    "photo-1488477181946-6428a0291777",
  ],
  Bakery: [
    "photo-1509440159596-0249088772ff",
    "photo-1549931319-a545dcf3bc73",
    "photo-1555507036-ab1f4038808a",
    "photo-1517433670267-08bbd4be890f",
    "photo-1568254183919-78a4f43a2877",
    "photo-1509365465985-25d11c17e812",
  ],
  Beverages: [
    "photo-1509042239860-f550ce710b93",
    "photo-1495474472287-4d71bcdd2085",
    "photo-1544787219-7f47ccb76574",
    "photo-1541167760496-1628856ab772",
    "photo-1554118811-1e0d58224f24",
    "photo-1521017432531-fbd92d768814",
  ],
  default: [
    "photo-1565299624946-b28f40a0ae38",
    "photo-1546069901-ba9599a7e63c",
    "photo-1540189549336-e6e99c3679fe",
    "photo-1551024506-0bccd828d307",
    "photo-1467003909585-2f8a72700288",
  ],
};
const menuImg = (category, seed) => {
  const pool = DISH_IMAGES[category] ?? DISH_IMAGES.default;
  return `https://images.unsplash.com/${pool[hash(seed) % pool.length]}?w=400`;
};

// ── Menu banks (shared at runtime with live OSM gap-fill) ──
// Each entry: [name, description, basePrice, category, vegType]
const MENU_BANKS = {
  "South Indian": [
    ["Masala Dosa", "Crispy golden dosa filled with spiced potato masala", 110, "Tiffins", "veg"],
    ["Ghee Roast Dosa", "Buttery dosa roasted to a deep golden crisp", 140, "Tiffins", "veg"],
    ["Mysore Masala Dosa", "Spicy red chutney spread with potato masala", 150, "Tiffins", "veg"],
    ["Idli Sambar", "Steamed rice cakes with lentil sambar and chutney", 90, "Tiffins", "veg"],
    ["Medu Vada", "Crispy lentil doughnuts with sambar", 100, "Tiffins", "veg"],
    ["Pongal", "Savory rice-lentil porridge with ghee tempering", 120, "Tiffins", "veg"],
    ["Rava Upma", "Creamy semolina with mustard, curry leaf and cashews", 110, "Tiffins", "veg"],
    ["Poori Bhaji", "Fluffy pooris with potato bhaji and chutney", 130, "Tiffins", "veg"],
    ["Filter Coffee", "Frothy South Indian filter coffee", 40, "Beverages", "veg"],
    ["Sweet Lassi", "Thick creamy yogurt drink", 100, "Beverages", "veg"],
    ["Curd Rice", "Cool yogurt rice with pomegranate", 140, "Main Course", "veg"],
    ["Sambar Rice", "Steamed rice mixed with spicy sambar", 160, "Main Course", "veg"],
  ],
  Chettinad: [
    ["Chettinad Chicken", "Fiery Chettinad chicken curry with robust masala", 320, "Main Course", "non-veg"],
    ["Chettinad Mutton Sukka", "Dry roasted mutton with coconut and fennel", 380, "Main Course", "non-veg"],
    ["Kuzhi Paniyaram", "Crisp dumplings in tangy sauce", 180, "Starters", "veg"],
    ["Prawn Chettinad", "Prawns simmered in freshly ground masala", 420, "Main Course", "non-veg"],
    ["Chicken 65", "Crispy deep-fried chicken with curry leaf tempering", 260, "Starters", "non-veg"],
    ["Seeraga Samba Biryani", "Fragrant short-grain rice dum biryani", 340, "Biryani", "non-veg"],
    ["Vepudu Platter", "Mixed vegetable saute with curry leaves", 200, "Main Course", "veg"],
    ["Aappam with Vegetable Stew", "Lacy fermented rice pancakes", 220, "Main Course", "veg"],
    ["Lemon Rice", "Turmeric rice with lemon and peanuts", 130, "Main Course", "veg"],
  ],
  Biryani: [
    ["Hyderabadi Chicken Biryani", "Basmati layered with spiced chicken, dum cooked", 340, "Biryani", "non-veg"],
    ["Mutton Dum Biryani", "Tender mutton slow-cooked under sealed dough", 420, "Biryani", "non-veg"],
    ["Veg Dum Biryani", "Seasonal vegetables layered with fragrant rice", 250, "Biryani", "veg"],
    ["Egg Biryani", "Masala eggs over jeera rice", 230, "Biryani", "non-veg"],
    ["Chicken 65", "Fiery fried chicken starter", 260, "Starters", "non-veg"],
    ["Mirchi Ka Salan", "Tangy peanut-chilli gravy for biryani", 90, "Side", "veg"],
    ["Raita", "Cool yogurt with cucumber and mint", 70, "Side", "veg"],
    ["Double Ka Meetha", "Indian bread pudding with saffron", 140, "Desserts", "veg"],
    ["Gulab Jamun", "Warm milk dumplings in sugar syrup", 110, "Desserts", "veg"],
    ["Iranian Chai", "Milk tea brewed with cardamom", 60, "Beverages", "veg"],
  ],
  "North Indian": [
    ["Butter Chicken", "Tandoori chicken in a rich, creamy tomato gravy", 340, "Main Course", "non-veg"],
    ["Paneer Butter Masala", "Soft paneer cubes in a silky tomato-butter gravy", 280, "Main Course", "veg"],
    ["Dal Makhani", "Black lentils simmered overnight with butter", 250, "Main Course", "veg"],
    ["Palak Paneer", "Creamy spinach with cottage cheese", 270, "Main Course", "veg"],
    ["Chole Bhature", "Punjabi chickpeas with fluffy fried bread", 220, "Main Course", "veg"],
    ["Kadhai Chicken", "Wok-tossed chicken with peppers and onions", 330, "Main Course", "non-veg"],
    ["Tandoori Chicken", "Smoky clay-oven roasted chicken", 320, "Starters", "non-veg"],
    ["Paneer Tikka", "Chargrilled cottage cheese in spiced yogurt", 260, "Starters", "veg"],
    ["Garlic Naan", "Leavened bread with garlic and butter", 70, "Breads", "veg"],
    ["Butter Naan", "Soft pull-apart naan brushed with butter", 60, "Breads", "veg"],
    ["Roti", "Whole wheat flatbread from the tandoor", 30, "Breads", "veg"],
    ["Shahi Paneer", "Rich cashew-cream gravy with paneer", 290, "Main Course", "veg"],
    ["Chicken Tikka", "Yogurt-marinated chargrilled chicken", 310, "Starters", "non-veg"],
    ["Matar Paneer", "Green peas with paneer in onion-tomato gravy", 260, "Main Course", "veg"],
    ["Kulfi Falooda", "Creamy kulfi with vermicelli and rose syrup", 150, "Desserts", "veg"],
    ["Gajar Ka Halwa", "Slow-cooked carrot pudding with ghee", 160, "Desserts", "veg"],
  ],
  Mughlai: [
    ["Mutton Rogan Josh", "Slow-braised mutton in a rich Kashmiri gravy", 420, "Main Course", "non-veg"],
    ["Chicken Korma", "Creamy almond-posy curry", 320, "Main Course", "non-veg"],
    ["Nihari with Naan", "Overnight slow-cooked meat stew", 380, "Main Course", "non-veg"],
    ["Seekh Kebab", "Minced meat skewers with mint chutney", 300, "Starters", "non-veg"],
    ["Sheermal", "Sweet saffron milk bread", 90, "Breads", "veg"],
    ["Lucknowi Biryani", "Awadhi style fragrant biryani", 360, "Biryani", "non-veg"],
    ["Shahi Tukda", "Bread slices in saffron rabri", 150, "Desserts", "veg"],
    ["Sheer Khurma", "Saffron milk with dates and nuts", 130, "Desserts", "veg"],
  ],
  Chinese: [
    ["Chilli Chicken", "Crispy chicken tossed in fiery soy-garlic sauce", 300, "Starters", "non-veg"],
    ["Veg Manchurian", "Crisp veggie balls in soy-garlic glaze", 240, "Starters", "veg"],
    ["Chilli Paneer", "Bell peppers and soft paneer in hot sauce", 280, "Starters", "veg"],
    ["Hakka Noodles", "Smoky wok-fried noodles with julienned veggies", 260, "Noodles", "veg"],
    ["Chicken Fried Rice", "Wok-fried rice with chicken and scallions", 280, "Rice", "non-veg"],
    ["Veg Fried Rice", "Classic fried rice with scallions", 230, "Rice", "veg"],
    ["Kung Pao Chicken", "Dried chillies, peanuts and wok-tossed chicken", 330, "Main Course", "non-veg"],
    ["Schezwan Noodles", "Spicy schezwan noodles with veggies", 280, "Noodles", "veg"],
    ["Spring Rolls", "Crispy rolls with glass noodles and vegetables", 220, "Starters", "veg"],
    ["Chicken Wonton Soup", "Delicate dumplings in clear broth", 240, "Soup", "non-veg"],
    ["Manchow Soup", "Hot and tangy Indo-Chinese soup", 180, "Soup", "veg"],
    ["Mango Pudding", "Silky chilled mango dessert", 140, "Desserts", "veg"],
  ],
  Burgers: [
    ["Classic Cheese Burger", "Patties, melted cheddar and special sauce", 220, "Burgers", "non-veg"],
    ["Crispy Chicken Burger", "Fried chicken, slaw and sriracha mayo", 240, "Burgers", "non-veg"],
    ["Veggie Burger", "Grilled veggie patty, cheese and greens", 190, "Burgers", "veg"],
    ["Paneer Burger", "Crispy paneer patty with mint mayo", 210, "Burgers", "veg"],
    ["Loaded Fries", "Fries with cheese sauce and herbs", 150, "Sides", "veg"],
    ["Chicken Nuggets", "Golden crumbed chicken bites", 180, "Sides", "non-veg"],
    ["Peri Peri Fries", "Fries dusted with peri peri spice", 160, "Sides", "veg"],
    ["Cold Coffee", "Frothy chilled coffee", 140, "Beverages", "veg"],
    ["Chocolate Thick Shake", "Blended thick chocolate shake", 190, "Beverages", "veg"],
  ],
  Pizza: [
    ["Margherita Pizza", "Classic tomato, mozzarella and basil", 320, "Pizza", "veg"],
    ["Farmhouse Pizza", "Bell peppers, onion, corn and mushroom", 380, "Pizza", "veg"],
    ["Pepperoni Pizza", "Loaded with pepperoni and extra cheese", 420, "Pizza", "non-veg"],
    ["BBQ Chicken Pizza", "Smoky BBQ chicken with red onions", 400, "Pizza", "non-veg"],
    ["Paneer Tikka Pizza", "Tandoori paneer on a spiced base", 390, "Pizza", "veg"],
    ["Garlic Breadsticks", "Oven-baked sticks brushed with garlic butter", 180, "Sides", "veg"],
    ["Cheesy Nachos", "Crisp nachos with cheese sauce", 190, "Sides", "veg"],
    ["Chocolate Lava Cake", "Molten-center chocolate cake", 160, "Desserts", "veg"],
  ],
  "Fast Food": [
    ["Masala Maggi", "Street-style masala noodles", 90, "Main Course", "veg"],
    ["Vada Pav", "Mumbai's favorite spiced potato fritter bun", 50, "Snacks", "veg"],
    ["Pav Bhaji", "Buttery mashed vegetables with soft pav", 180, "Main Course", "veg"],
    ["Frankie Roll", "Wrapped paratha with spiced filling", 150, "Snacks", "veg"],
    ["Chicken Frankie", "Chicken tikka wrapped in paratha", 190, "Snacks", "non-veg"],
    ["French Fries", "Crispy golden fries", 120, "Sides", "veg"],
    ["Pani Puri", "Crisp shells with spiced potato and tangy water", 80, "Chats", "veg"],
    ["Cold Coffee", "Frothy chilled coffee", 130, "Beverages", "veg"],
  ],
  Desserts: [
    ["Belgian Chocolate Cake", "Rich, moist chocolate cake with ganache", 180, "Cakes", "veg"],
    ["Red Velvet Slice", "Classic with cream cheese frosting", 230, "Cakes", "veg"],
    ["New York Cheesecake", "Baked classic with berry compote", 240, "Desserts", "veg"],
    ["Brownie Sundae", "Warm brownie with vanilla ice cream", 220, "Desserts", "veg"],
    ["Blueberry Muffin", "Bursting with wild blueberries", 110, "Bakery", "veg"],
    ["Butter Croissant", "Flaky laminated French classic", 130, "Bakery", "veg"],
    ["Choc Chip Cookies", "Chewy cookies with dark chocolate", 120, "Bakery", "veg"],
    ["Mango Mousse Cup", "Alphonso mango mousse", 170, "Desserts", "veg"],
    ["Tiramisu", "Espresso-soaked layers with mascarpone", 240, "Desserts", "veg"],
    ["Gulab Jamun", "Warm milk dumplings in sugar syrup", 110, "Desserts", "veg"],
  ],
  Bakery: [
    ["Blueberry Muffin", "Bursting with wild blueberries", 110, "Bakery", "veg"],
    ["Double Choc Muffin", "Dark chocolate studded crumb", 120, "Bakery", "veg"],
    ["Butter Croissant", "Flaky laminated French classic", 130, "Bakery", "veg"],
    ["Cinnamon Roll", "Swirled brioche with cream cheese glaze", 160, "Bakery", "veg"],
    ["Banana Walnut Loaf", "Melted banana loaf with toasted walnuts", 140, "Bakery", "veg"],
    ["Chocolate Éclair", "Choux pastry with chocolate ganache", 210, "Bakery", "veg"],
    ["Artisan Sourdough", "Wild-fermented crusty loaf", 180, "Bakery", "veg"],
    ["Vanilla Bean Tart", "Silky custard in a buttery shell", 200, "Desserts", "veg"],
  ],
  Healthy: [
    ["Quinoa Buddha Bowl", "Quinoa, roasted veggies and avocado", 320, "Bowls", "vegan"],
    ["Greek Salad", "Cucumber, tomato, feta and olives", 260, "Salads", "veg"],
    ["Kale Caesar", "Massaged kale with cashew dressing", 280, "Salads", "vegan"],
    ["Avocado Toast", "Sourdough with smashed avocado", 240, "Toasts", "vegan"],
    ["Cold Pressed Detox", "5-ingredient cold-pressed juice", 160, "Beverages", "vegan"],
    ["Grilled Chicken Bowl", "Lemongrass chicken over brown rice", 340, "Bowls", "non-veg"],
    ["Paneer Salad Platter", "Grilled paneer over garden leaves", 260, "Salads", "veg"],
    ["Protein Smoothie Bowl", "Plant protein, berries and coconut", 290, "Bowls", "vegan"],
    ["Iced Hibiscus Tea", "House-infused, lightly sweetened", 90, "Beverages", "vegan"],
  ],
  Seafood: [
    ["Meen Pollichathu", "Banana leaf-wrapped spiced fish", 380, "Main Course", "non-veg"],
    ["Prawn Ghee Roast", "Butter-roasted prawns with spices", 420, "Main Course", "non-veg"],
    ["Chilli Garlic Prawns", "Juicy prawns in sticky chilli garlic glaze", 400, "Starters", "non-veg"],
    ["Fish Curry with Rice", "Tangy coastal fish curry", 300, "Main Course", "non-veg"],
    ["Crab Pepper Fry", "Cracked crab roasted with pepper", 450, "Starters", "non-veg"],
    ["Appam & Fish Molee", "Lacy appams with coconut fish stew", 330, "Main Course", "non-veg"],
    ["Kerala Fish Fry", "Crisp pan-fried pearl spot", 280, "Starters", "non-veg"],
  ],
  Continental: [
    ["Grilled Chicken Steak", "Herb-butter chicken with mashed potatoes", 420, "Main Course", "non-veg"],
    ["Penne Alfredo", "Fettuccine tossed in creamy parmesan", 380, "Pasta", "veg"],
    ["Spaghetti Aglio Olio", "Garlic, chilli and olive oil", 320, "Pasta", "vegan"],
    ["Farmhouse Flatbread", "Wood-fired with seasonal toppings", 360, "Pizza", "veg"],
    ["Cream of Mushroom Soup", "Silky button mushroom soup", 200, "Soup", "veg"],
    ["Tiramisu", "Espresso-soaked layers with mascarpone", 240, "Desserts", "veg"],
  ],
  "Street Food": [
    ["Pav Bhaji", "Buttery mashed vegetables with soft pav", 160, "Main Course", "veg"],
    ["Vada Pav", "Mumbai's favorite spiced potato bun", 50, "Snacks", "veg"],
    ["Pani Puri", "Crisp shells with spiced potato and tangy water", 70, "Chats", "veg"],
    ["Bhel Puri", "Puffed rice with tamarind and sev", 90, "Chats", "veg"],
    ["Samosa Chaat", "Crisp samosa with chole and chutneys", 120, "Chats", "veg"],
    ["Kathi Roll", "Wrapped paratha with egg and veggies", 130, "Snacks", "veg"],
    ["Chicken Kathi Roll", "Chicken tikka wrapped in paratha", 180, "Snacks", "non-veg"],
    ["Ras Malai", "Soft cheese discs in saffron milk", 140, "Desserts", "veg"],
  ],
};

const BANK_ORDER = [
  "Starters",
  "Soup",
  "Chats",
  "Snacks",
  "Tiffins",
  "Main Course",
  "Biryani",
  "Rice",
  "Noodles",
  "Pasta",
  "Pizza",
  "Burgers",
  "Bowls",
  "Salads",
  "Toasts",
  "Breads",
  "Sides",
  "Cakes",
  "Desserts",
  "Bakery",
  "Beverages",
];

// Map one or two cuisines to a menu built from the banks.
function buildMenuFor(restaurantId, cuisines, idx) {
  const usable = cuisines.filter((c) => MENU_BANKS[c]);
  if (usable.length === 0) usable.push("North Indian");
  const pool = new Map();
  for (const cuisine of usable) {
    for (const item of MENU_BANKS[cuisine]) {
      if (!pool.has(item[0])) pool.set(item[0], [...item, cuisine]);
    }
  }
  const items = [...pool.values()];
  // Pick 15-20 unique items.
  const count = intBetween(15, 20);
  const chosen = pickN(items, Math.min(count, items.length)).sort(
    (a, b) => BANK_ORDER.indexOf(a[3]) - BANK_ORDER.indexOf(b[3])
  );
  return chosen.map((entry, i) => {
    const [name, desc, price, category, vegType, cuisine] = entry;
    const bestsellerBlocks = ["Butter Chicken", "Masala Dosa", "Hyderabadi Chicken Biryani", "Margherita Pizza", "Chettinad Chicken", "Quinoa Buddha Bowl", "Classic Cheese Burger", "Vada Pav"];
    const isBestseller = bestsellerBlocks.includes(name) || rand() < 0.18;
    return {
      id: `m${100000 + idx * 1000 + i}`,
      restaurantId,
      name,
      description: desc,
      price,
      image: rand() < 0.92 ? menuImg(category, `${restaurantId}|${i}|${name}`) : undefined,
      vegType,
      category,
      isBestseller,
      isAvailable: rand() < 0.97,
      rating: isBestseller ? round1(4.2 + rand() * 0.6) : undefined,
      ratingCount: isBestseller ? intBetween(150, 1200) : undefined,
      nutrition: {
        calories: intBetween(120, 900),
        allergens: rand() < 0.7 ? ["Dairy", "Gluten", "Soy", "Peanuts"].slice(0, intBetween(1, 2)) : [],
      },
      ...(cuisine === "Snacks" || cuisine === "Chats"
        ? {}
        : { customizations: undefined }),
    };
  });
}

// ── City configs ──
const CITIES = [
  {
    name: "Chennai",
    target: 36,
    lat: 13.0827,
    lng: 80.2707,
    jitterKm: 9,
    areas: ["Anna Salai", "T Nagar", "Mylapore", "Besant Nagar", "Velachery", "Nungambakkam", "Adyar", "Egmore", "OMR"],
    cuisines: ["South Indian", "Chettinad", "Biryani", "North Indian", "Chinese", "Seafood", "Fast Food", "Desserts", "Healthy"],
  },
  {
    name: "Bengaluru",
    target: 54,
    lat: 12.9716,
    lng: 77.5946,
    jitterKm: 12,
    areas: ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "MG Road", "HSR Layout", "BTM"],
    cuisines: ["South Indian", "North Indian", "Chinese", "Biryani", "Fast Food", "Healthy", "Pizza", "Cafe"],
  },
  {
    name: "Mumbai",
    target: 54,
    lat: 19.076,
    lng: 72.8777,
    jitterKm: 10,
    areas: ["Andheri", "Bandra", "Colaba", "Dadar", "Powai", "Juhu", "Borivali"],
    cuisines: ["North Indian", "Maharashtrian", "Street Food", "Chinese", "Pizza", "Fast Food", "Desserts", "Seafood"],
  },
  {
    name: "Delhi",
    target: 56,
    lat: 28.6139,
    lng: 77.209,
    jitterKm: 12,
    areas: ["Connaught Place", "Karol Bagh", "Hauz Khas", "Lajpat Nagar", "Rajouri Garden", "Chandni Chowk"],
    cuisines: ["North Indian", "Mughlai", "Street Food", "Chinese", "Biryani", "Fast Food", "Bakery", "South Indian"],
  },
  {
    name: "Hyderabad",
    target: 54,
    lat: 17.385,
    lng: 78.4867,
    jitterKm: 10,
    areas: ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Hitec City", "Kukatpally", "Ameerpet"],
    cuisines: ["Biryani", "Mughlai", "North Indian", "South Indian", "Chinese", "Fast Food", "Desserts"],
  },
  {
    name: "Pune",
    target: 54,
    lat: 18.5204,
    lng: 73.8567,
    jitterKm: 9,
    areas: ["Koregaon Park", "Hinjewadi", "Viman Nagar", "Baner", "Kothrud"],
    cuisines: ["Maharashtrian", "North Indian", "South Indian", "Street Food", "Chinese", "Pizza", "Fast Food", "Cafe"],
  },
];

const EXTRA_BANK = {
  Maharashtrian: [
    ["Misal Pav", "Spicy sprouted lentils with crispy pav", 160, "Main Course", "veg"],
    ["Thalipeeth", "Multigrain savoury pancake with butter", 150, "Tiffins", "veg"],
    ["Sabudana Khichdi", "Tapioca pearls with peanuts and lemon", 140, "Tiffins", "veg"],
    ["Puran Poli", "Sweet stuffed flatbread with ghee", 130, "Desserts", "veg"],
    ["Kothimbir Vadi", "Coriander fritters, Maharashtrian-style", 120, "Starters", "veg"],
    ["Bhakri & Thecha", "Jowar roti with green chilli chutney", 110, "Breads", "veg"],
    ["Kolhapuri Chicken", "Earthy red-chilli chicken curry", 330, "Main Course", "non-veg"],
    ["Pandhra Rassa", "White coconut-peanut chicken curry", 310, "Main Course", "non-veg"],
  ],
};

for (const [k, v] of Object.entries(EXTRA_BANK)) {
  MENU_BANKS[k] = v;
}

// ── Restaurant name generators ──
const NAME_PREFIX = [
  "Madras", "Chennai", "Bangalore", "Bombay", "Delhi", "Hyderabadi", "Andhra", "Punjabi", "Lucknowi", "Udupi", "Mangalorean", "Kerala", "Marathi", "Ambur", "Dindigul", "Coastal", "MS", "VR", "Sri", "Anand", "Raja", "Annapoorna", "Sangeetha", "The Grand", "Royal", "Golden", "New", "Classic", "Urban", "Bombay", "Chennai",
];
const NAME_CORE = [
  "Kitchen", "Eatery", "Dhaba", "Bhavan", "Mess", "Cafe", "House", "Grill", "Corner", "Junction", "Point", "Bhojan", "Nook", "Lounge", "Canteen", "Hotel", "Restaurant", "Express", "Paradise", "Fusion", "Spice", "Tandoor", "Rasoi", "Kadai", "Wok", "Bowl", "Sweets", "Ice Cream", "Biryanis", "Foods", "Caterers", "Sizzlers", "Roast", "Thali", "Curry House",
];
const NAME_SUFFIX = ["", "", "", " & Co.", " Family", " Express", " Deluxe", " Restaurant", ".", " 24/7", " Multi Cuisine", ""];

function restaurantName(city, cuisine) {
  const suffix = cuisine === "Biryani" ? " Biryani" : "";
  const useSuffix = rand() < 0.5;
  const core = useSuffix ? pick(NAME_SUFFIX).trim() : " " + pick(NAME_CORE);
  const personalized = rand() < 0.4 ? pick(["Mehta", "Sharma", "Iyer", "Reddy", "Nair", "Menon", "Desai", "Patel", "Singh", "Khan", "Fernandes", "Kulkarni", "Pillai", "Naidu"]) : "";
  const body = personalized ? ` ${personalized}'s${core}` : `${suffix}${core}`;
  const prefix = pick(NAME_PREFIX);
  return `${prefix}${body}`.replace(/\s+/g, " ").trim();
}

const OPENING_HOURS = [
  "11:00 AM - 11:00 PM",
  "12:00 PM - 11:30 PM",
  "7:00 AM - 10:00 PM",
  "8:00 AM - 9:00 PM",
  "9:00 AM - 10:30 PM",
  "10:00 AM - 12:00 AM",
  "11:30 AM - 11:30 PM",
  "11:00 AM - 12:00 AM",
];

const OFFER_TEMPLATES = [
  { code: "FIRST50", description: "50% off up to ₹100 on your first order", type: "percentage", value: 50, min: 199, max: 100 },
  { code: "FLAT100", description: "Flat ₹100 off on orders above ₹499", type: "flat", value: 100, min: 499 },
  { code: "BIRYANI50", description: "₹50 off biryani orders above ₹299", type: "flat", value: 50, min: 299 },
  { code: "BURGERFREE", description: "Buy 1 get 1 free on select burgers", type: "flat", value: 120, min: 299 },
  { code: "SLICE2X", description: "Buy 1 get 1 free on any pizza", type: "flat", value: 150, min: 299 },
  { code: "SAVE20", description: "20% off up to ₹80", type: "percentage", value: 20, min: 149, max: 80 },
  { code: "NAWAB40", description: "40% off up to ₹120 on biryani", type: "percentage", value: 40, min: 249, max: 120 },
];

const REVIEW_NAMES = [
  "Priya Sharma", "Arjun Reddy", "Sneha Iyer", "Rahul Verma", "Ananya Singh", "Karthik Nair",
  "Divya Menon", "Vikram Patel", "Meera Desai", "Rohan Mehta", "Nisha Kulkarni", "Aditya Pillai",
  "Pooja Naidu", "Sanjay Khan", "Lakshmi Chandran", "Farhan Sheikh", "Deepika Rao", "Amit Joshi",
  "Kavya Krishnan", "Siddharth Bose", "Ishaan Kapoor", "Ritika Malhotra",
];

const REVIEW_COMMENTS = [
  "Absolutely delicious! The {dish} was outstanding and delivery was quick.",
  "Great portion sizes and really flavorful. {dish} is a must-order!",
  "Solid experience overall. Packaging was neat and the food stayed hot.",
  "Ordered the {dish} — honestly the best I've had in a while.",
  "Good value for money. Will definitely order again.",
  "The {dish} arrived fresh and the spice level was just right.",
  "Prompt delivery and generous servings. Highly recommended.",
  "Nice place for a quick bite. Loved the {dish}.",
  "Tasty, well-priced and the staff were courteous.",
];

function fmtComment(dish) {
  const base = pick(REVIEW_COMMENTS).replace("{dish}", dish ?? "food");
  return base;
}
function pickDish(menu) {
  const best = menu.find((m) => m.isBestseller);
  return best?.name ?? menu[0]?.name ?? "";
}

// ── Generate ──
const now = Date.now();
const DAY = 86400000;
const recentDays = (offset) => new Date(now - intBetween(0, 30) * DAY - offset).toISOString();

let restIdx = 32; // continue after curated r32
let menuSeed = 0;
const [generatedRestaurants, generatedMenuItems, generatedReviews] = [[], [], []];

for (const city of CITIES) {
  // Deterministic per-city count centered on the target (+/- 4) so every city
  // carries a believable inventory once the 32 curated (Chennai) entries merge in.
  const count = city.target + intBetween(-4, 4);
  for (let i = 0; i < count; i++) {
    restIdx += 1;
    const id = `r${restIdx}`;
    const cuisines = pickN(city.cuisines, intBetween(2, 3));
    const menu = buildMenuFor(id, cuisines, menuSeed);
    menuSeed += 1;

    // Coordinates: jitter around city center (~km = deg/111).
    const lat = city.lat + (rand() - 0.5) * (2 * city.jitterKm) / 111;
    const lng = city.lng + (rand() - 0.5) * (2 * city.jitterKm) / (111 * Math.cos((city.lat * Math.PI) / 180));
    const area = pick(city.areas);
    const rating = round1(3.6 + rand() * 1.2);
    const ratingCount = intBetween(180, 8400);
    const costForTwo = intBetween(
      Math.max(150, Math.round((Math.min(...menu.map((m) => m.price)) + Math.max(...menu.map((m) => m.price))) * 1.1)),
      350
    );
    const isOpen = rand() < 0.88;
    const isPromoted = rand() < 0.12;
    const vegOnly = cuisines.every((c) => ["Desserts", "South Indian", "Bakery", "Healthy", "Street Food"].includes(c)) && rand() < 0.6;
    const distanceKm = round1(rand() * 7 + 0.4);
    const deliveryTimeMinutes = intBetween(15, 48);
    const offers =
      rand() < 0.34
        ? [pick(OFFER_TEMPLATES)].map((t, ti) => ({
            id: `off${id.slice(1)}_${ti}`,
            code: t.code,
            description: t.description,
            discountType: t.type,
            discountValue: t.value,
            minOrderValue: t.min,
            ...(t.max ? { maxDiscount: t.max } : {}),
          }))
        : undefined;

    generatedRestaurants.push({
      id,
      name: restaurantName(city.name, cuisines.join(" ")),
      image: img(cuisines[0], id),
      cuisines,
      rating,
      ratingCount,
      costForTwo: Math.max(150, costForTwo),
      deliveryTimeMinutes,
      distanceKm,
      address: `${intBetween(1, 240)} ${area} Main Road`,
      area,
      city: city.name,
      isOpen,
      openingHours: pick(OPENING_HOURS),
      contact: `+91 ${intBetween(70000, 99999)}${intBetween(10000, 99999)}`,
      fssaiLicense: String(intBetween(1e13, 1e14)),
      isPromoted,
      vegOnly,
      latitude: round1(lat),
      longitude: round1(lng),
      offers,
    });

    for (const item of menu) generatedMenuItems.push(item);

    // 2-4 reviews per restaurant.
    const reviews = intBetween(2, 4);
    for (let r = 0; r < reviews; r++) {
      const rv = round1(Math.max(1, Math.min(5, rating + (rand() - 0.5))));
      generatedReviews.push({
        id: `rev${generatedReviews.length + 4}`,
        restaurantId: id,
        userId: `u${1000 + generatedReviews.length}`,
        userName: pick(REVIEW_NAMES),
        rating: rv,
        comment: fmtComment(pickDish(menu)),
        createdAt: recentDays(r * 3),
        helpfulCount: intBetween(0, 60),
        ...(rand() < 0.22
          ? {
              ownerReply: {
                text: "Thanks for your kind words! We always aim for the best.",
                repliedAt: recentDays(r * 3 - 1),
              },
            }
          : {}),
      });
    }
  }
}

const cuisineList = [
  ...new Set(CITIES.flatMap((c) => c.cuisines)),
].sort();

// ── Write generated dataset ──
const header = `// AUTO-GENERATED by scripts/generateDataset.mjs — do not edit by hand.\nimport type { Restaurant, MenuItem, Review } from "../types/restaurant";\n`;

writeFileSync(
  join(OUT_DATA, "generatedDataset.ts"),
  header +
    `\nexport const generatedCuisines: string[] = ${JSON.stringify(cuisineList, null, 2)};\n\n` +
    `export const generatedRestaurants: Restaurant[] = ${JSON.stringify(generatedRestaurants, null, 2)};\n\n` +
    `export const generatedMenuItems: MenuItem[] = ${JSON.stringify(generatedMenuItems, null, 2)};\n\n` +
    `export const generatedReviews: Review[] = ${JSON.stringify(generatedReviews, null, 2)};\n`
);

// ── Write menu banks (shared with live OSM gap-fill at runtime) ──
const menuBankHeader = `// AUTO-GENERATED by scripts/generateDataset.mjs — do not edit by hand.\nimport type { MenuItem } from "../types/restaurant";\n`;
writeFileSync(
  join(OUT_DATA, "menuBanks.ts"),
  menuBankHeader +
    `\nexport type MenuBankItem = [name: string, description: string, price: number, category: string, vegType: "veg" | "non-veg" | "vegan"];\n\n` +
    `export const MENU_BANKS: Record<string, MenuBankItem[]> = ${JSON.stringify(MENU_BANKS, null, 2)};\n\n` +
    `const BANK_ORDER = ${JSON.stringify(BANK_ORDER, null, 2)};\n\n` +
    `function mulberry32(seed: number) {\n  let a = seed >>> 0;\n  return function () {\n    a |= 0;\n    a = (a + 0x6d2b79f5) | 0;\n    let t = Math.imul(a ^ (a >>> 15), 1 | a);\n    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;\n    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;\n  };\n}\n\n` +
    `// Build a deterministic 15-item menu for a restaurant from its cuisine list.\n` +
    `export function buildMenuForCuisines(restaurantId: string, cuisines: string[]): MenuItem[] {\n` +
    `  const rng = mulberry32(restaurantId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0));\n` +
    `  const rand = () => rng();\n` +
    `  const intBetween = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));\n` +
    `  const pickN = <T,>(arr: T[], n: number): T[] => {\n    const copy = [...arr];\n    const out: T[] = [];\n    while (out.length < n && copy.length > 0) {\n      out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);\n    }\n    return out;\n  };\n` +
    `  const usable = cuisines.filter((c) => MENU_BANKS[c]);\n  if (usable.length === 0) usable.push("North Indian");\n` +
    `  const pool = new Map<string, MenuBankItem>();\n` +
    `  for (const cuisine of usable) {\n    for (const item of MENU_BANKS[cuisine]) {\n      if (!pool.has(item[0])) pool.set(item[0], item);\n    }\n  }\n` +
    `  const items = [...pool.values()];\n  const count = intBetween(15, 20);\n` +
    `  const chosen = pickN(items, Math.min(count, items.length)).sort(\n    (a, b) => BANK_ORDER.indexOf(a[3]) - BANK_ORDER.indexOf(b[3])\n  );\n` +
    `  const bestsellers = ["Butter Chicken", "Masala Dosa", "Hyderabadi Chicken Biryani", "Margherita Pizza", "Chettinad Chicken", "Quinoa Buddha Bowl", "Classic Cheese Burger", "Vada Pav"];\n` +
    `  return chosen.map(([name, description, price, category, vegType], i) => {\n` +
    `    const isBestseller = bestsellers.includes(name) || rand() < 0.18;\n` +
    `    return {\n      id: \`m\${restaurantId.replace(/[^0-9]/g, "")}0\${i}_\${restaurantId}\`,\n      restaurantId,\n      name,\n      description,\n      price,\n      vegType,\n      category,\n      isBestseller,\n      isAvailable: rand() < 0.97,\n      rating: isBestseller ? Math.round((4.2 + rand() * 0.6) * 10) / 10 : undefined,\n      ratingCount: isBestseller ? intBetween(150, 1200) : undefined,\n      nutrition: {\n        calories: intBetween(120, 900),\n        allergens: rand() < 0.7 ? ["Dairy", "Gluten", "Soy", "Peanuts"].slice(0, intBetween(1, 2)) : [],\n      },\n    };\n  });\n}\n`
);

console.log(
  `Generated ${generatedRestaurants.length} restaurants, ${generatedMenuItems.length} menu items, ${generatedReviews.length} reviews across ${CITIES.length} cities.`
);