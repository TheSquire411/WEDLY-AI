import { notFound } from 'next/navigation';
import { getBlogPost, getBlogPosts } from '../utils';
import { Header } from '@/components/header';
import Image from 'next/image';
import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
 
  if (!post) {
    return {
        title: 'Post Not Found',
    }
  }
 
  return {
    title: post.metadata.title,
    description: post.metadata.excerpt,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.excerpt,
      images: [
        {
          url: post.metadata.image,
          width: 600,
          height: 400,
          alt: post.metadata.image_alt,
        },
      ],
    },
  }
}

export async function generateStaticParams() {
    const posts = getBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

// This is a simple markdown-to-html renderer
function Markdown({ content }: { content: string }) {
    const htmlContent = content
        .split('\n\n')
        .map(paragraph => {
            if (paragraph.startsWith('## ')) {
                return `<h2 class="text-3xl font-headline mt-8 mb-4">${paragraph.substring(3)}</h2>`;
            } else if (paragraph.startsWith('### ')) {
                return `<h3 class="text-2xl font-headline mt-6 mb-3">${paragraph.substring(4)}</h3>`;
            } else if (paragraph.trim()) {
                return `<p class="mb-4 leading-relaxed">${paragraph}</p>`;
            }
            return '';
        })
        .join('');
    
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  
  if (!post) {
    notFound();
  }
  
  return (
    <div className="bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-5xl font-headline text-center text-gray-800">{post.metadata.title}</h1>
            <p className="text-center text-muted-foreground mt-4">{new Date(post.metadata.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </header>
          <Image
            src={post.metadata.image}
            alt={post.metadata.image_alt}
            data-ai-hint={post.metadata.image_hint}
            width={1200}
            height={600}
            className="w-full h-auto rounded-lg shadow-lg object-cover mb-8"
          />
          <div className="prose lg:prose-xl max-w-none">
              <Markdown content={post.content} />
          </div>
        </article>
      </main>
    </div>
  );
}
