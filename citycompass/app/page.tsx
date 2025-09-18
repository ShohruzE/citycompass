import Image from "next/image";
import Link from 'next/link';
import { NavBar } from "./components/NavBar";
import HomepageHeroSection from "./components/HomepageHeroSection";

export default function Home() {
  return (
    <main className="-center">
      <NavBar />
      <HomepageHeroSection />


    </main>
  );
}
