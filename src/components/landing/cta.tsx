
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="bg-gray-50">
      <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-headline font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to start planning?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Sign up for Wedly today and experience the future of wedding planning. Your dream wedding is just a few clicks away.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/signup">
                Get Started Now
              </Link>
            </Button>
            <Button asChild variant="link" size="lg">
                <Link href="/#features">
                    Learn more <span aria-hidden="true">→</span>
                </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
