"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileQuestion,
  GraduationCap,
  Settings,
  MenuIcon,
  X,
  LogOut,
  BarChart,
  User,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import Image from "next/image";

const navItems = [
  { name: "Dashboard", href: "#", icon: LayoutDashboard },
  { name: "Exams", href: "#", icon: FileQuestion },
  { name: "Results", href: "#", icon: BarChart },
  { name: "Courses", href: "#", icon: GraduationCap },
  { name: "Settings", href: "#", icon: Settings },
];

export default function DashboardNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const NavContent = ({ collapsed = false }) => (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-xl"
          >
            {!collapsed?(
                <Image src={'/images/horizontal_logo.png'} alt="Logo" width={120} height={20} />
            ):(
                <Image src={'/images/adynamicsLogo.png'} alt="Logo" width={20} height={20} className="ml-3"/>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
                "hidden md:flex md:ml-3",
                isCollapsed ? "px-1" : ""
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed ? "" : "rotate-180"
              )}
            />
          </Button>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return collapsed ? (
              <TooltipProvider key={item.href}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-[#49aaaa] text-white"
                          : "hover:bg-[#49aaaa]/10 hover:text-[#49aaaa]"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="border-[#49aaaa]">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[#49aaaa] text-white"
                    : "hover:bg-[#49aaaa]/10 hover:text-[#49aaaa]"
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "h-screen border-r bg-background transition-all duration-300",
        isCollapsed ? "md:w-[80px]" : "md:w-[240px]" 
      )}
    >
      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-xl"
        >
            <Image src={'/images/horizontal_logo.png'} alt="Logo" width={120} height={20} />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#49aaaa]" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatar.png" alt="User" /> 
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Nav */}
      <div className="hidden md:flex flex-col h-full">
        <div className="flex-1">
          <NavContent collapsed={isCollapsed} />
        </div>
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="/avatar.png" alt="User" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
                {!isCollapsed && <span>John Doe</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
