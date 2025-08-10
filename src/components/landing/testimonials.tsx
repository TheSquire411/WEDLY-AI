export function Testimonials() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-semibold leading-8 tracking-tight text-primary">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by Couples Everywhere
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-4">
          <figure className="col-span-2 hidden sm:block sm:rounded-2xl sm:bg-white sm:shadow-lg sm:ring-1 sm:ring-gray-900/5 xl:col-start-2 xl:row-end-1">
            <blockquote className="p-12 text-xl font-semibold leading-8 tracking-tight text-gray-900">
              <p>“Wedly was a lifesaver! It took all the stress out of planning and let us focus on what really matters. The AI checklist was a game-changer.”</p>
            </blockquote>
            <figcaption className="flex items-center gap-x-4 border-t border-gray-900/10 px-6 py-4">
              <img className="h-10 w-10 flex-none rounded-full bg-gray-50" src="https://randomuser.me/api/portraits/women/12.jpg" alt="" />
              <div className="flex-auto">
                <div className="font-semibold">Sarah & Tom</div>
                <div className="text-gray-600">@sarahandtom</div>
              </div>
            </figcaption>
          </figure>
          <div className="space-y-8 xl:contents xl:space-y-0">
            <div className="space-y-8 xl:row-span-2">
              <figure className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5">
                <blockquote className="text-gray-900">
                  <p>“The vow generator is pure magic. I was so stuck, and it helped me write the most beautiful, personal vows. My partner was in tears!”</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-x-4">
                  <img className="h-10 w-10 rounded-full bg-gray-50" src="https://randomuser.me/api/portraits/men/32.jpg" alt="" />
                  <div>
                    <div className="font-semibold">Michael R.</div>
                    <div className="text-gray-600">@michael</div>
                  </div>
                </figcaption>
              </figure>
            </div>
            <div className="space-y-8 xl:row-start-1">
              <figure className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5">
                <blockquote className="text-gray-900">
                  <p>“I loved the vision board feature. It was so fun to collaborate with my fiancé and see our dream wedding come to life visually.”</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-x-4">
                  <img className="h-10 w-10 rounded-full bg-gray-50" src="https://randomuser.me/api/portraits/women/44.jpg" alt="" />
                  <div>
                    <div className="font-semibold">Jessica L.</div>
                    <div className="text-gray-600">@jessl</div>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
