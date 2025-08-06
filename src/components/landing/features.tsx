
import { Bot, CircleDollarSign, GalleryHorizontal, ListChecks, Users, Sparkles } from 'lucide-react';

const features = [
  {
    name: 'AI Wedding Assistant',
    description: 'Your personal AI helper to answer questions about your budget, guest list, and tasks.',
    icon: Bot,
  },
  {
    name: 'Vision Board Generator',
    description: 'Use AI to create and visualize your dream wedding aesthetic, from decor to attire.',
    icon: GalleryHorizontal,
  },
  {
    name: 'AI Vow Generator',
    description: "Struggling with words? Our AI helps you craft beautiful, personal vows from your memories.",
    icon: Sparkles,
  },
  {
    name: 'Budget Tracker',
    description: 'Keep your finances in order with an easy-to-use budget tool and AI spending suggestions.',
    icon: CircleDollarSign,
  },
  {
    name: 'Guest List Manager',
    description: 'Effortlessly manage your guests, RSVPs, and even get AI-powered seating chart suggestions.',
    icon: Users,
  },
  {
    name: 'Wedding Checklist',
    description: 'Stay on track with a comprehensive checklist that guides you every step of the way.',
    icon: ListChecks,
  },
];

export function Features() {
  return (
    <section className="bg-gray-50 py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-headline font-bold text-gray-900 sm:text-4xl">
            Everything You Need to Plan Your Wedding
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Wedly combines powerful AI tools with essential planning features in one beautiful dashboard.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.name} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-base text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
