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

// ── Reusable Unsplash photo IDs (already used across the app) ──
const IMAGES = [
  "photo-1517248135467-4c7edcad34c4",
  "photo-1512621776951-a57141f2eefd",
  "photo-1552566626-52f8b828add9",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1551024506-0bccd828d307",
  "photo-1563379091339-03b21ab4a4f8",
  "photo-1579871494447-9811cf80d66c",
  "photo-1568901346375-23c9450c58cd",
  "photo-1630383249896-424e482df921",
  "photo-1585032226651-759b368d7246",
  "photo-1513104890138-7c749659a591",
  "photo-1574071318508-1cdbab80d002",
  "photo-1555396273-367ea4eb4db5",
  "photo-1551183053-bf91a1d81141",
  "photo-1589302168068-964664d93dc0",
  "photo-1567188040759-fb8a883dc6d8",
  "photo-1563245372-f21724e3856d",
  "photo-1547592180-85f173990554",
  "photo-1563805042-7684c019e1cb",
  "photo-1578985545062-69928b1d9587",
  "photo-1549931319-a545dcf3bc73",
  "photo-1558642452-9d2a7deb7f62",
  "photo-1497034825429-c343d7c6a68f",
  "photo-1546069901-ba9599a7e63c",
  "photo-1490645935967-10de6ba17061",
  "photo-1540420773420-3366772f4999",
  "photo-1567620905732-2d1ec7ab7445",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1600891964092-4316c288032e",
  "photo-1615361625778-5eec63c6a115",
  "photo-1625937284759-b25d4252cfed",
  "photo-1601050690597-df0568f70950",
];
const img = (idx) => `https://images.unsplash.com/${IMAGES[idx % IMAGES.length]}?w=500`;
const menuImg = (idx) =>
  Math.random() < 0.5 ? `https://images.unsplash.com/${IMAGES[idx % IMAGES.length]}?w=400` : undefined;

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
      image: menuImg(idx + i),
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
      image: img(restIdx),
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