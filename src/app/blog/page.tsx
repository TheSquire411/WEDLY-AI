// src/app/blog/page.tsx

import Link from 'next/link';

// This function would fetch a list of all your blog posts
async function getAllPosts() {
  // Replace this with your actual data fetching logic
  // For example, fetch(`https://your-cms.com/api/posts`)
  return [
    { slug: 'first-post', title: 'My First Blog Post', excerpt: 'This is a short summary of the first post.' },
    { slug: 'second-post', title: 'Another Interesting Article', excerpt: 'A brief look into another topic.' },
    { slug: 'third-post', title: 'The Final Word', excerpt: 'Concluding thoughts on the series.' },
  ];
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight">The Wedly Blog</h1>
        <p className="mt-4 text-lg text-gray-600">Tips, tricks, and inspiration for your perfect day.</p>
      </header>
      
      <div className="grid gap-8">
        {posts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="block p-6 rounded-lg border hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-bold">{post.title}</h2>
            <p className="mt-2 text-gray-700">{post.excerpt}</p>
            <span className="mt-4 inline-block font-semibold text-primary">Read More &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
