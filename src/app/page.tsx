
"use client";

import { Header } from '@/components/header';
import { Hero } from '@/components/landing/hero';
import { Features }from '@/components/landing/features';
import { CTA } from '@/components/landing/cta';
import { Testimonials } from '@/components/landing/testimonials';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
      </main>
    </div>
  );
}
