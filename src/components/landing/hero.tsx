
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
      {/* Video Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <iframe
          src="https://player.vimeo.com/video/1107994292?background=1&autoplay=1&loop=1&muted=1&quality=1080p"
          className="absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
          allow="autoplay; fullscreen"
        ></iframe>
      </div>

      {/* Dark Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>
      
      {/* Content */}
      <div className="relative z-20 max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-headline font-bold sm:text-5xl lg:text-6xl text-shadow-md">
          Stop Wedding Planning Stress. Start AI-Powered Bliss.
        </h1>
        <p className="mt-6 text-lg text-shadow">
          Effortlessly craft vows, manage guests, and beat your budget with smarter AI.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
           <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white py-3 px-5 rounded-full border border-white/20 shadow-lg">
                <span className="text-xl">🎁</span>
                <p className="text-sm">
                    Sign up this week to unlock a <strong>Premium AI Wedding Speech Guide</strong> instantly!
                </p>
            </div>
            <Button asChild size="lg">
              <Link href="/signup">
                Start Your Effortless Plan <ArrowRight className="ml-2" />
              </Link>
            </Button>
        </div>
      </div>

      {/* Simple text shadow utility styles */}
      <style jsx>{`
        .text-shadow-md {
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .text-shadow {
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
      `}</style>
    </section>
  );
}
