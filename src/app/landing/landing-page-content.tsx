"use client";

import React from "react";
import { LandingNavbar } from "./components/navbar";
import { HeroSection } from "./components/hero-section";
import { LogoCarousel } from "./components/logo-carousel";
import { StatsSection } from "./components/stats-section";
import { FeaturesSection } from "./components/features-section";
import { TeamSection } from "./components/team-section";
import { TestimonialsSection } from "./components/testimonials-section";
import { BlogSection } from "./components/blog-section";
import { PricingSection } from "./components/pricing-section";
import { CTASection } from "./components/cta-section";
import { ContactSection } from "./components/contact-section";
import { FaqSection } from "./components/faq-section";
import { LandingFooter } from "./components/footer";
import {
  LandingThemeCustomizer,
  LandingThemeCustomizerTrigger,
} from "./components/landing-theme-customizer";
import { AboutSection } from "./components/about-section";

export function LandingPageContent() {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      <main>
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <BlogSection />
        <FaqSection />
        <CTASection />
        <ContactSection />
      </main>

      <LandingFooter />
    </div>
  );
}
