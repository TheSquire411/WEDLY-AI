import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Post {
    slug: string;
    metadata: {
        title: string;
        date: string;
        excerpt: string;
        image: string;
        image_alt: string;
        image_hint: string;
    };
    content: string;
}

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

export function getBlogPosts(): Post[] {
    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
            slug,
            metadata: data as Post['metadata'],
            content,
        };
    });

    return allPostsData.sort((a, b) => {
        if (new Date(a.metadata.date) < new Date(b.metadata.date)) {
            return 1;
        } else {
            return -1;
        }
    });
}

export function getBlogPost(slug: string): Post | undefined {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    try {
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);
        return {
            slug,
            metadata: data as Post['metadata'],
            content,
        };
    } catch (error) {
        return undefined;
    }
}
