import { useNavigate } from "react-router-dom";
import { useFilterStore } from "../../store/filterStore";

const categories = [
  { name: "Pizza", emoji: "🍕" },
  { name: "Biryani", emoji: "🍛" },
  { name: "Chinese", emoji: "🥡" },
  { name: "Desserts", emoji: "🍰" },
  { name: "Healthy", emoji: "🥗" },
  { name: "Italian", emoji: "🍝" },
  { name: "North Indian", emoji: "🍲" },
  { name: "Bakery", emoji: "🥐" },
];

export function CategoryTiles() {
  const navigate = useNavigate();
  const toggleCuisine = useFilterStore((state) => state.toggleCuisine);

  const handleCategoryClick = (category: string) => {
    toggleCuisine(category);
    navigate("/restaurants");
  };

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => handleCategoryClick(cat.name)}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary-500 hover:shadow-md transition-all bg-white dark:bg-gray-900"
        >
          <span className="text-3xl">{cat.emoji}</span>
          <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}