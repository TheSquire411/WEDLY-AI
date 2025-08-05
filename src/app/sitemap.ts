import { MetadataRoute } from 'next'
import { getBlogPosts } from './blog/utils';
 
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = 'https://your-domain.com';

  const posts = getBlogPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.metadata.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const routes = ['', '/blog', '/guest-upload'].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.5,
  }));
 
  return [
    ...routes,
    ...posts
  ];
}