import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold text-primary-600">404</h1>
      <p className="text-gray-500 mt-4">Page not found.</p>
      <Link to="/" className="text-primary-600 underline mt-4 inline-block">
        Go back home
      </Link>
    </div>
  );
}