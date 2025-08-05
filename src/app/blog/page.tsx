import Image from 'next/image';
import Link from 'next/link';
import { getBlogPosts, type Post } from './utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ArrowRight } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wedly Wedding Planning Blog',
  description: 'Explore tips, inspiration, and expert advice on planning your perfect wedding. From choosing a venue to writing your vows, the Wedly blog has you covered.',
}

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-headline text-gray-800">The Wedly Blog</h1>
            <p className="mt-4 text-lg text-muted-foreground">Inspiration and advice for your wedding journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card key={post.slug} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0">
                    <Link href={`/blog/${post.slug}`}>
                        <Image
                            src={post.metadata.image}
                            alt={post.metadata.image_alt}
                            data-ai-hint={post.metadata.image_hint}
                            width={600}
                            height={400}
                            className="object-cover w-full h-48"
                        />
                    </Link>
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                    <CardTitle className="font-headline text-2xl leading-tight">
                        <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                           {post.metadata.title}
                        </Link>
                    </CardTitle>
                    <CardDescription className="mt-4 text-base">
                        {post.metadata.excerpt}
                    </CardDescription>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                    <Button asChild variant="link" className="p-0 h-auto">
                        <Link href={`/blog/${post.slug}`}>
                            Read More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
