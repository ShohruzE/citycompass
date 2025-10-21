import SideBar from "./components/SideBar"; // adjust path as needed
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SideBar />
      <main className="flex-1 ml-60 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
