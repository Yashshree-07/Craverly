import { Link } from "react-router-dom";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-ivory-50 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Craverly
          </Link>
          <h1 className="text-xl font-bold mt-4 text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>

        <div className="bg-lavender-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          {children}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {footerText}{" "}
          <Link to={footerLinkTo} className="text-primary-600 font-medium hover:underline">
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}