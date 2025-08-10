import { Users, Heart, Gift } from 'lucide-react';

export function Narrative() {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-primary font-semibold">The Wedly Way</p>
          <h2 className="mt-2 text-3xl font-headline font-bold tracking-tight text-gray-900 sm:text-4xl">
            From "Yes" to "I Do" with Ease
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Wedding planning can be overwhelming. We built Wedly to be your trusted companion, using AI to streamline tasks so you can focus on what truly matters: celebrating your love.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-x-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">For You & Your Partner</h3>
            <p className="mt-2 text-base text-gray-600">
              Collaborate on your vision, manage tasks together, and keep everything in sync.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">Personalized Experience</h3>
            <p className="mt-2 text-base text-gray-600">
              Our AI learns about your style and preferences to offer tailored suggestions.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
              <Gift className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">All-in-One Toolkit</h3>
            <p className="mt-2 text-base text-gray-600">
              Budgeting, guest lists, vendor tracking - everything you need is right here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
