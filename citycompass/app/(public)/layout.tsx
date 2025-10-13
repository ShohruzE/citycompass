import { NavBar } from "./components/NavBar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <NavBar />
      <main>{children}</main>
    </div>
  );
}