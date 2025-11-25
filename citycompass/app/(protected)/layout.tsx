import SideBar from "./components/SideBar"; // adjust path as needed
import React from "react";
import { UserLocationProvider } from "@/lib/contexts/UserLocationContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserLocationProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <SideBar />
        <main className="flex-1 ml-60 h-full overflow-y-auto p-8">{children}</main>
      </div>
    </UserLocationProvider>
  );
}
