"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function UserNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/user/dashboard" className="text-xl font-bold">
              Exam Portal
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link
                  href="/user/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/user/dashboard"
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/user/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/user/profile"
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={() => {
                /* Add logout functionality */
              }}
            >
              Logout
            </Button>
          </div>
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/user/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === "/user/dashboard"
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/user/profile"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === "/user/profile"
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              Profile
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                /* Add logout functionality */
              }}
              className="w-full mt-4 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
