// src/app/page.tsx

"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// --- A consistent loading component for all dynamic imports ---
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-gray-100">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

// --- Dynamically import ALL of your landing page components with SSR disabled ---
const DynamicHero = dynamic(() => import('@/components/landing/hero').then((mod) => mod.Hero), { 
  ssr: false,
  loading: () => <PageLoader />,
});

const DynamicNarrative = dynamic(() => import('@/components/landing/narrative').then((mod) => mod.Narrative), {
  ssr: false,
  loading: () => <PageLoader />,
});

const DynamicFeatures = dynamic(() => import('@/components/landing/features').then((mod) => mod.Features), {
  ssr: false,
  loading: () => <PageLoader />,
});

const DynamicTestimonials = dynamic(() => import('@/components/landing/testimonials').then((mod) => mod.Testimonials), {
  ssr: false,
  loading: () => <PageLoader />,
});

const DynamicUpgrade = dynamic(() => import('@/components/landing/upgrade').then((mod) => mod.Upgrade), {
  ssr: false,
  loading: () => <PageLoader />,
});

const DynamicCTA = dynamic(() => import('@/components/landing/cta').then((mod) => mod.CTA), {
  ssr: false,
  loading: () => <PageLoader />,
});


export default function LandingPage() {
  return (
    <>
      {/* This is the order your components will appear on the page */}
      <DynamicHero />
      <DynamicNarrative />
      <DynamicFeatures />
      <DynamicTestimonials />
      <DynamicUpgrade />
      <DynamicCTA />
    </>
  );
}
