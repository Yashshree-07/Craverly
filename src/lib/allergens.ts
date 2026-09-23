export const ALLERGENS = [
  "Dairy",
  "Gluten",
  "Nuts",
  "Peanuts",
  "Soy",
  "Egg",
  "Shellfish",
] as const;

export type Allergen = (typeof ALLERGENS)[number];

export const CALORIE_FILTERS = [
  { label: "Under 300 cal", value: 300 },
  { label: "Under 600 cal", value: 600 },
] as const;