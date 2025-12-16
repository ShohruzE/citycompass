"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import FeatureGrid from "../components/FeatureGrid";
import PlatformImpact from "../components/PlatformImpact";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (<>
    <section className="max-w-5xl mx-auto text-center mt-24 px-6 text-foreground">
      <h1 className="text-5xl font-bold leading-tight">
        Understanding NYC{" "}
        <span className="text-primary">Neighborhoods</span> Through Community Voice
      </h1>

      <p className="text-muted-foreground mt-4 text-lg">
        Empowering residents, policymakers, and city officials with data-driven insights
        about neighborhood safety, cleanliness, and quality of life.
      </p>
    
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/sign-up">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/80">
            Get Started
          </Button>
        </Link>
        <Link href="/sign-in">
          <Button variant="outline" className="border-border text-foreground hover:text-primary">
            Sign In
          </Button>
        </Link>
      </div>
    </section>
      <FeatureGrid />
      <PlatformImpact />
      <Footer />
      </>
  );
}