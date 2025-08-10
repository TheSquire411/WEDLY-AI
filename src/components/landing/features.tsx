import { CheckCircle, Zap, Users, Bot, Palette, BookOpen } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Task Management',
    description: 'Generate a comprehensive wedding checklist in seconds. Our AI ensures you don’t miss a single detail, from booking vendors to sending thank-you notes.',
    icon: CheckCircle,
  },
  {
    name: 'Instant Vow & Speech Writer',
    description: 'Struggling to find the right words? Create beautiful, personalized vows and speeches that capture your unique love story.',
    icon: BookOpen,
  },
  {
    name: 'Smart Guest & RSVP Tracking',
    description: 'Manage your guest list, track RSVPs, and handle dietary restrictions with ease. Our smart system keeps all your guest info organized.',
    icon: Users,
  },
  {
    name: 'Intelligent Wedding Assistant',
    description: 'Have a question? Need advice? Our 24/7 AI wedding assistant is here to help you with etiquette, ideas, and vendor suggestions.',
    icon: Bot,
  },
  {
    name: 'Vision Board Generator',
    description: 'Describe your dream wedding, and our AI will generate a stunning vision board to help you visualize and refine your aesthetic.',
    icon: Palette,
  },
  {
    name: 'Budget & Expense Tracker',
    description: 'Set your budget and let our AI help you stick to it. Get smart suggestions on where to save and track every expense effortlessly.',
    icon: Zap,
  },
];

export function Features() {
  return (
    <section id="features" className="bg-gray-50">
      <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-headline font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything You Need for "I Do"
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Wedly combines powerful AI tools with intuitive design to make your wedding planning experience seamless and enjoyable.
          </p>
        </div>
        <div className="mt-20">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-8 w-8 flex-none text-primary" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
