import { Link } from "react-router-dom";
import { FaInstagram, FaTwitter, FaFacebook } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white text-lg font-bold mb-3">Craverly</h3>
          <p className="text-sm text-gray-400">
            Discover the best food & drinks in your city, delivered fast.
          </p>
          <div className="flex gap-3 mt-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram size={18} className="hover:text-primary-500 cursor-pointer" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter size={18} className="hover:text-primary-500 cursor-pointer" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebook size={18} className="hover:text-primary-500 cursor-pointer" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">About us</Link></li>
            <li><Link to="/" className="hover:text-white">Careers</Link></li>
            <li><Link to="/" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">For Restaurants</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">Partner with us</Link></li>
            <li><Link to="/" className="hover:text-white">Apps for you</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">Help & FAQs</Link></li>
            <li><Link to="/" className="hover:text-white">Contact us</Link></li>
            <li><Link to="/" className="hover:text-white">Privacy policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {currentYear} Craverly. Built as a portfolio project — not affiliated with any real food delivery service.
      </div>
    </footer>
  );
}