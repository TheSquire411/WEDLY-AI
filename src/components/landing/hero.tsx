
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative bg-white pt-20 pb-10 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-24">
       <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-50"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-headline font-bold text-gray-900 sm:text-5xl lg:text-6xl">
            Plan Your Perfect Day, Stress-Free
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Wedly is the AI-powered wedding planning assistant that handles the details, so you can focus on the "I do".
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/signup">
              Get Started for Free <ArrowRight className="ml-2" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
        <div className="mt-12">
            <Image 
                src="https://placehold.co/1200x600.png"
                alt="Wedly App Dashboard Screenshot"
                data-ai-hint="wedding dashboard"
                width={1200}
                height={600}
                className="rounded-xl shadow-2xl ring-1 ring-gray-900/10"
                priority
            />
        </div>
      </div>
    </section>
  );
}
