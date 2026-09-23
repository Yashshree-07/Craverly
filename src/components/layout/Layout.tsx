import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ChatWidget } from "../chat/ChatWidget";
import { Toaster } from "sonner";

export default function Layout() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("craverly-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("craverly-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("craverly-theme", "light");
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
      <Toaster position="top-center" richColors />
    </div>
  );
}