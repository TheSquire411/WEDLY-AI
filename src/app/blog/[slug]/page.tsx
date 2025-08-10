// src/app/blog/[slug]/page.tsx

// This is the correct way to define the props for a dynamic page
// It tells TypeScript that this component will receive 'params'
// and inside 'params' there will be a 'slug' which is a string.
type BlogPageProps = {
  params: {
    slug: string;
  };
};

// This function could fetch your blog post data from a CMS or database
async function getPostData(slug: string) {
  // Replace this with your actual data fetching logic
  // For example, fetch(`https://your-cms.com/api/posts/${slug}`)
  return {
    title: `This is post: ${slug}`,
    content: "This is the content for the blog post. You would fetch this from your backend.",
    date: new Date().toLocaleDateString(),
  };
}


export default async function BlogPage({ params }: BlogPageProps) {
  // We get the specific slug for this page from the params prop
  const post = await getPostData(params.slug);

  return (
    <article className="container mx-auto px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-2 text-gray-500">Published on {post.date}</p>
      </header>
      
      <div className="prose lg:prose-xl mx-auto">
        {/* This is where you would render your post content,
            perhaps from Markdown or a rich text editor */}
        <p>{post.content}</p>
      </div>
    </article>
  );
}
