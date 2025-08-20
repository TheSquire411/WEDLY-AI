import Link from 'next/link';
import { getBlogPosts } from './utils';

export default async function BlogIndexPage() {
  const posts = getBlogPosts();

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight">The Wedly Blog</h1>
        <p className="mt-4 text-lg text-gray-600">Tips, tricks, and inspiration for your perfect day.</p>
      </header>
      
      <div className="grid gap-8">
        {posts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="block p-6 rounded-lg border hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-bold">{post.metadata.title}</h2>
            <p className="mt-2 text-gray-700">{post.metadata.excerpt}</p>
            <span className="mt-4 inline-block font-semibold text-primary">Read More &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
