
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
            Stop Wedding Planning Stress. Start AI-Powered Bliss.
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Effortlessly craft vows, manage guests, and beat your budget with smarter AI.
          </p>
          <div className="mt-8 flex flex-col items-center">
            <div className="mb-5 inline-flex max-w-[90%] items-center rounded-xl border border-purple-200 bg-purple-50 px-5 py-3 text-center text-[15px] text-purple-800 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
              <span className="mr-3 text-xl">🎁</span>
              <p className="m-0 leading-snug">
                Sign up this week to unlock a <strong className="font-semibold text-purple-900">Premium AI Wedding Speech Guide</strong> instantly!
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/signup">
                Start Your Effortless Wedding Plan <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
        <div className="mt-12 mx-auto">
            <Image 
                src="https://images.unsplash.com/reserve/xd45Y326SvKzSR3Nanc8_MRJ_8125-1.jpg?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="A beautiful wedding bouquet, part of the wedding planning inspiration from Wedly"
                data-ai-hint="wedding bouquet"
                width={1200}
                height={300}
                className="rounded-xl shadow-2xl ring-1 ring-gray-900/10 object-cover"
                priority
            />
        </div>
      </div>
    </section>
  );
}
