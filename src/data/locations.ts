export interface CityArea {
  city: string;
  areas: string[];
}

export const CITIES: CityArea[] = [
  {
    city: "Chennai",
    areas: ["Anna Salai", "Besant Nagar", "MG Road", "OMR", "T Nagar"],
  },
  {
    city: "Mumbai",
    areas: ["Andheri", "Bandra", "Colaba", "Dadar"],
  },
  {
    city: "Bengaluru",
    areas: ["Indiranagar", "Koramangala", "Whitefield"],
  },
];

export const TRENDING_SEARCHES = [
  "Pizza",
  "Biryani",
  "Buddha Bowl",
  "Chocolate Cake",
  "Noodles",
];