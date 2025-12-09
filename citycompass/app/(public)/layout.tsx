import { NavBar } from "./components/NavBar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      <NavBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}