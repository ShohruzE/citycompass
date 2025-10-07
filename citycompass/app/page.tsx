import Link from 'next/link';
import { NavBar } from "./components/NavBar";
import HomepageHeroSection from "./components/HomepageHeroSection";
import FeatureGrid from "./components/FeatureGrid";
import PlatformImpact from "./components/PlatformImpact";
import Footer from "./components/Footer";


export default function Home() {
  return (
    <main className="-center">
      <NavBar />
      <HomepageHeroSection />
      <FeatureGrid />
      <PlatformImpact />
      <Footer />
    </main>
  );
}
