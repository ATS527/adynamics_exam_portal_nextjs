"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const LandinNav = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleScroll = () => {
    if (window.scrollY > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <nav className={`fixed top-0 w-full ${ isScrolled ? "bg-white shadow-md" : "bg-transparent md:shadow-md" } flex items-center justify-center z-50`}>
        <div className="w-full px-4 py-4 sm:py-0 flex items-center justify-between xl:max-w-7xl">
          <div>
            <Link href={"/"}>
              <div className="relative w-10 h-10 sm:hidden">
                <Image
                  src={"/images/adynamicsLogo.png"}
                  alt="adynamics logo"
                  fill
                  className="object-contain w-full"
                />
              </div>
              <div className="relative w-40 h-20 hidden sm:block">
                <Image
                  src={"/images/horizontal_logo.png"}
                  alt="adynamics logo"
                  fill
                  className="object-contain w-full"
                />
              </div>
            </Link>
          </div>

          <div className="hidden md:flex gap-2">
            <Link href={"/login"}>
              <Button variant={"outline"}>Login</Button>
            </Link>
            <Link href={"/register"}>
              <Button className="bg-main text-white hover:bg-mainDark">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <Button variant="ghost" onClick={toggleSidebar}>
            <Menu className={`w-5 h-5  ${isScrolled ? "text-black" : "text-white"}`} />
          </Button>
        </div>
      </nav>

      <div
        className={`fixed top-0 right-0 z-50 bg-white shadow-lg h-full w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden z-50`}
      >
        <div className="flex justify-end  pt-2 pr-2">
          <Button
            className="text-black"
            variant={"ghost"}
            onClick={toggleSidebar}
          >
            <X />
          </Button>
        </div>
        <div className="p-6">
          <ul className="space-y-4">
            <li>
              <a href="#home" className="text-lg font-semibold">
                Home
              </a>
            </li>
            <li>
              <a href="#contact" className="text-lg font-semibold">
                Contact
              </a>
            </li>
            <li>
              <a href="#about" className="text-lg font-semibold">
                About Us
              </a>
            </li>
          </ul>
        </div>

        <div className="absolute bottom-6 w-full px-6 flex gap-2 justify-end">
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="w-full text-white bg-main">Sign Up</Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default LandinNav;
