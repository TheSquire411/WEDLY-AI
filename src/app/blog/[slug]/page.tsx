import { getBlogPost, getBlogPosts } from '../utils';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="prose lg:prose-xl mx-auto">
        <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{post.metadata.title}</h1>
            <p className="text-gray-500">{post.metadata.date}</p>
        </div>
        {post.metadata.image && (
            <Image 
                src={post.metadata.image} 
                alt={post.metadata.image_alt} 
                width={1200} 
                height={600} 
                className="rounded-lg mb-8"
            />
        )}
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>
    </div>
  );
}