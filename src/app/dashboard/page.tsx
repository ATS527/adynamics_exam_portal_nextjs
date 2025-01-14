'use client'

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

// Breadcrumb configuration map
const breadcrumbConfig: Record<
  string,
  {
    label: string;
    path: string;
    hidden?: boolean;
  }
> = {
  app: { label: "Application", path: "/app" },
  "building-your-application": {
    label: "Building Your Application",
    path: "/building-your-application",
  },
  "data-fetching": {
    label: "Data Fetching",
    path: "/building-your-application/data-fetching",
  },
  "dashboard":{
    label: "Dashboard",
    path: "#",
  }
  // Add more routes as needed
};

export default function Page() {
  const pathname = usePathname();

  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];
    let currentPath = "";

    for (const segment of paths) {
      currentPath += `/${segment}`;

      if (breadcrumbConfig[segment]?.hidden) continue;

      const label =
        breadcrumbConfig[segment]?.label ||
        segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

      breadcrumbs.push({
        label,
        path: currentPath,
        isLast: currentPath === pathname,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <BreadcrumbItem
                    key={crumb.path}
                    className={index === 0 ? "hidden md:block" : ""}
                  >
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink href={crumb.path}>
                          {crumb.label}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator className="hidden md:block" />
                      </>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
          Testing
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
