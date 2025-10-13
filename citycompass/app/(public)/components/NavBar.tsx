"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Interactive Map", href: "/map" },
    { label: "Take Survey", href: "/survey" },
    { label: "Insights", href: "/insights" },
    { label: "Compare", href: "/compare" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border text-foreground">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        {/* Logo / Brand */}
        <Link href="/" className="text-2xl font-bold text-primary">
          CityCompass
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}

          <div className="flex items-center gap-3 ml-6">
            <Link href="/sign-in">
              <Button
                variant="outline"
                className="text-sm px-4 border-border text-foreground hover:text-primary"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground text-sm px-4">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-primary"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background shadow-sm">
          <nav className="flex flex-col items-center gap-4 py-4 text-foreground">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/sign-in" onClick={() => setIsOpen(false)}>
              <Button
                variant="outline"
                className="text-sm w-32 border-border text-foreground hover:text-primary"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up" onClick={() => setIsOpen(false)}>
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground text-sm w-32">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
