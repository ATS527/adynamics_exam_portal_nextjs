import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <Image
                  src="/adynamics_logo.png"
                  alt="Adynamics Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="ml-3 text-xl font-bold text-gray-900">
                  Adynamics
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
