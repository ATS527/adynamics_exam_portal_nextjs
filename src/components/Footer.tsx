'use client'

import React from "react";
import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const links = {
    useful: ["Home", "About", "Contact", "Terms & Conditions", "Refund Policy"],
    social: [
      { icon: <Facebook className="w-5 h-5" />, href: "#" },
      { icon: <Twitter className="w-5 h-5" />, href: "#" },
      { icon: <Instagram className="w-5 h-5" />, href: "#" },
      { icon: <Linkedin className="w-5 h-5" />, href: "#" },
    ],
  };

  return (
    <div className=" text-black">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div className="space-y-4">
            <img
              src="/images/adynamicsLogoOg.png"
              alt="Logo"
              className="h-24 w-auto"
            />
            <p className="text-sm opacity-90 text-muted-foreground">
                Empowering your aviation journey with advanced solutions. From pilot training to examination support, we provide innovative tools and resources to help you soar higher. Your success, our mission.
            </p>
          </div>

          {/* Useful Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Useful Links</h3>
            <ul className="space-y-2">
              {links.useful.map((link) => (
                <li key={link} className="hover:translate-x-1 transition-all duration-300 ease-in-out">
                  <a
                    href="#"
                    className="text-sm opacity-90 hover:opacity-100 hover:underline hover:text-main transition-all duration-300 ease-in-out"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Us</h3>
            <div className="space-y-2">
              <a
                href="mailto:contact@example.com"
                className="flex items-center space-x-2 text-sm opacity-90 hover:text-main transition-colors ease-in-out"
              >
                <Mail className="w-4 h-4" />
                <span>contact@example.com</span>
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center space-x-2 text-sm opacity-90 hover:text-main transition-colors ease-in-out"
              >
                <Phone className="w-4 h-4" />
                <span>+91 98765 43210</span>
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Follow Us</h3>
            <div className="flex space-x-4">
              {links.social.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="hover:bg-main hover:text-white p-2 rounded-full transition-all duration-300 ease-in-out"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />

        <div className="text-center text-sm opacity-50">
          <p>© {new Date().getFullYear()} ADynamics. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Footer;