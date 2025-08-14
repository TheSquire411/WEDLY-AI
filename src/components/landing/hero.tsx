// hero.tsx

"use client";

import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
// 1. Import your new CSS module file
import styles from './hero.module.css';

export function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
      {/* Site Name in Top Left Corner */}
      <div className="absolute top-0 left-0 p-8 z-30">
        <h3 className="text-2xl font-bold font-headline text-white">Wedly</h3>
      </div>

      {/* Video Background Container */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <iframe
          src="https://player.vimeo.com/video/1108822056?background=1&autopause=0&loop=1&autoplay=1&muted=1"
          frameBorder="0"
          allow="autoplay; fullscreen"
          // 2. Replace the old classes with your new, single class
          className={styles.backgroundVideo}
          title="Wedly AI Background Video"
        ></iframe>
      </div>

      {/* Dark Overlay for text readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 py-32 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-headline font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Your AI Wedding Planner
          </h1>
          <p className="mt-6 text-lg max-w-lg mx-auto">
            From checklists to vows, Wedly's intelligent platform simplifies every step of your journey to the altar. Plan your perfect day, stress-free.
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Start Planning for Free
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Use the Next.js Script component to safely load the Vimeo player API */}
      <Script src="https://player.vimeo.com/api/player.js" strategy="lazyOnload" />
    </section>
  );
}