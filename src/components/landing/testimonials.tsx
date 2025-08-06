
import Image from 'next/image';

const testimonials = [
  {
    body: 'Wedly completely changed our wedding planning experience. The AI assistant was like having a 24/7 planner in our pocket. We felt so organized and stress-free!',
    author: {
      name: 'Sarah & Tom',
      handle: 'sarahandtom',
      imageUrl: 'https://placehold.co/100x100.png',
      imageHint: 'happy couple'
    },
  },
  {
    body: 'The AI vow generator is pure magic. It took our jumbled memories and turned them into the most beautiful vows. There wasn\'t a dry eye in the house.',
    author: {
      name: 'Jessica & Mark',
      handle: 'jessandmark',
      imageUrl: 'https://placehold.co/100x100.png',
      imageHint: 'laughing couple'
    },
  },
  {
    body: 'As someone who is terrible with budgets, the AI budget suggestions were a lifesaver. It helped us allocate our funds smartly and we actually came in under budget!',
    author: {
      name: 'Emily & Chris',
      handle: 'emilyandchris',
      imageUrl: 'https://placehold.co/100x100.png',
      imageHint: 'smiling couple'
    },
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-headline font-bold text-gray-900 sm:text-4xl">
            Loved by Couples Everywhere
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Don't just take our word for it. Here's what real couples are saying about planning their wedding with Wedly.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.author.name}
              className="rounded-2xl bg-white shadow-lg ring-1 ring-gray-900/5"
            >
              <blockquote className="p-8 text-xl font-semibold leading-8 tracking-tight text-gray-900">
                <p>{`“${testimonial.body}”`}</p>
              </blockquote>
              <figcaption className="flex items-center gap-x-4 border-t border-gray-900/10 px-6 py-4">
                <Image
                  className="h-10 w-10 flex-none rounded-full bg-gray-50"
                  src={testimonial.author.imageUrl}
                  data-ai-hint={testimonial.author.imageHint}
                  alt={testimonial.author.name}
                  width={40}
                  height={40}
                />
                <div className="flex-auto">
                  <div className="font-semibold">{testimonial.author.name}</div>
                  <div className="text-gray-600">{`@${testimonial.author.handle}`}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
