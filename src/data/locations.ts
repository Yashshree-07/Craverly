export interface CityArea {
  city: string;
  areas: string[];
}

export const CITIES: CityArea[] = [
  {
    city: "Chennai",
    areas: ["Anna Salai", "Besant Nagar", "MG Road", "OMR", "T Nagar", "Mylapore", "Velachery", "Nungambakkam"],
  },
  {
    city: "Mumbai",
    areas: ["Andheri", "Bandra", "Colaba", "Dadar", "Powai", "Juhu"],
  },
  {
    city: "Bengaluru",
    areas: ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "HSR Layout"],
  },
  {
    city: "Delhi",
    areas: ["Connaught Place", "Karol Bagh", "Hauz Khas", "Lajpat Nagar", "Rajouri Garden"],
  },
  {
    city: "Hyderabad",
    areas: ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Hitec City", "Kukatpally"],
  },
  {
    city: "Pune",
    areas: ["Koregaon Park", "Hinjewadi", "Viman Nagar", "Baner", "Kothrud"],
  },
];

export const TRENDING_SEARCHES = [
  "Pizza",
  "Biryani",
  "Buddha Bowl",
  "Chocolate Cake",
  "Noodles",
];