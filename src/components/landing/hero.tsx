
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-white pt-20 pb-10 sm:pt-24 lg:pt-32">
      <div className="container mx-auto px-6 sm:px-8 lg:px-8">
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
        <div className="mt-12 mx-auto">
            <Image 
                src="https://images.unsplash.com/reserve/xd45Y326SvKzSR3Nanc8_MRJ_8125-1.jpg?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="A beautiful bouquet of wedding flowers"
                data-ai-hint="wedding bouquet"
                width={1600}
                height={400}
                className="rounded-xl shadow-2xl ring-1 ring-gray-900/10 object-cover"
                priority
            />
        </div>
      </div>
    </section>
  );
}
