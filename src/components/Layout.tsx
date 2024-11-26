import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { UserNavbar } from "./UserNavbar";

interface LayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export default function Layout({ children, isAdmin = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {isAdmin ? <Navbar /> : <UserNavbar />}
      <main className="flex-grow">{children}</main>
      {/* Add footer if needed */}
    </div>
  );
}
