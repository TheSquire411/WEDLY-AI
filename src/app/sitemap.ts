import { MetadataRoute } from 'next'
import { getBlogPosts } from './blog/utils';
 
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = 'https://wedly.minimal.app';

  const posts = getBlogPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.metadata.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const routes = ['', '/blog', '/guest-upload', '/admin'].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.5,
  }));
 
  return [
    ...routes,
    ...posts
  ];
}
