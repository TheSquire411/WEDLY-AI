
import Image from 'next/image';

export function Narrative() {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-background shadow-xl rounded-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
             <div className="relative min-h-[300px] lg:min-h-[500px]">
                 <Image
                    src="https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="A happy couple laughing together outdoors"
                    data-ai-hint="happy couple"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                />
            </div>
            <div className="p-8 sm:p-12 lg:p-16 flex items-center">
              <div className="max-w-xl">
                <h2 className="text-4xl font-headline font-bold text-gray-900 sm:text-5xl">
                  Remember the "Yes"? Let's Get Back to That Feeling.
                </h2>
                <p className="mt-6 text-lg text-gray-600">
                  The "happiest time of your life" can quickly become consumed by invoices, seating charts, and endless to-do lists. The joy gets buried under admin.
                </p>
                <p className="mt-4 text-lg text-gray-600">
                  Now, imagine a different path. A path where you and your partner spend your evenings dreaming up your vision, not debating budget lines. Where crafting your vows is a moment of connection, not a stressful homework assignment. Where you can focus on each other, knowing the details are handled.
                </p>
                <p className="mt-8 text-xl font-semibold text-gray-800">
                  Wedly gives you back your engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
