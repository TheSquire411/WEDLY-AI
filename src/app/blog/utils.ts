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

// In a real app, this would come from a CMS or markdown files
const posts: Post[] = [
    {
        slug: '10-tips-for-a-stress-free-wedding-day',
        metadata: {
            title: '10 Tips for a Stress-Free Wedding Day',
            date: '2024-07-15',
            excerpt: 'Your wedding day should be about joy, not stress. Follow these 10 tips to ensure everything runs smoothly, leaving you to focus on what truly matters: celebrating your love.',
            image: 'https://placehold.co/600x400.png',
            image_alt: 'A calm bride sipping tea before her wedding',
            image_hint: 'bride relaxing',
        },
        content: `
## Introduction
Your wedding day is one of the most memorable days of your life. But with so many moving parts, it can also be one of the most stressful. Here are ten practical tips to help you stay calm and enjoy every moment.

### 1. Plan Ahead and Delegate
A well-thought-out plan is your best defense against stress. Create a detailed timeline for the day and delegate tasks to your wedding party, family members, or a professional coordinator. Trusting others with responsibilities will lighten your load significantly.

### 2. Get a Good Night's Sleep
It sounds simple, but a full night of rest is crucial. Avoid the temptation to stay up late finalizing details. A well-rested mind is better equipped to handle any last-minute surprises with grace.

### 3. Eat a Healthy Breakfast
Don't skip breakfast! Nerves might curb your appetite, but your body needs fuel. A light, nutritious meal will give you the energy you need to get through the long, exciting day ahead.

### 4. Build in Buffer Time
Everything takes longer than you think on a wedding day. Schedule extra time between activities—hair and makeup, photos, travel to the venue. This buffer prevents the frantic rush that causes anxiety.

### 5. Put Your Phones Away
Designate a "phone-sitter" for the day. Being constantly bombarded with texts and calls can be overwhelming. Disconnect from the digital world and be present in the moment.

### 6. Have a "Go-To" Person
Designate one person—a maid of honor, a wedding planner, or a trusted friend—as the point person for all vendor questions and logistical issues. This way, you won't be bothered with minor problems.

### 7. Prepare an Emergency Kit
Pack a small bag with essentials: safety pins, stain remover, pain relievers, snacks, water, and any other "just-in-case" items. Knowing you're prepared for small mishaps can provide great peace of mind.

### 8. Take a Moment for Yourselves
Schedule a brief, private moment for you and your partner right after the ceremony. Just five to ten minutes alone to breathe and soak it all in can be incredibly grounding and memorable.

### 9. Focus on the Big Picture
If a small detail goes wrong—the wrong shade of napkins, a misplaced floral arrangement—let it go. In the grand scheme of things, these minor imperfections won't impact the joy of your marriage. Remember why you're there: to celebrate your love.

### 10. Stay Hydrated
Sip water throughout the day. Dehydration can lead to headaches and fatigue, which only amplifies stress. Keep a water bottle handy, especially during photos and before the ceremony.
        `,
    },
    {
        slug: 'how-to-choose-the-perfect-wedding-venue',
        metadata: {
            title: 'How to Choose the Perfect Wedding Venue',
            date: '2024-06-28',
            excerpt: 'The venue sets the tone for your entire wedding. From rustic barns to elegant ballrooms, here\'s how to find the perfect backdrop for your special day that fits your style and budget.',
            image: 'https://placehold.co/600x400.png',
            image_alt: 'A beautiful and empty wedding venue with chandeliers',
            image_hint: 'wedding venue',
        },
        content: `
## Introduction
Choosing a wedding venue is one of the biggest decisions you'll make during your planning process. It influences your budget, guest list, and overall theme. Here’s a guide to help you find the perfect spot.

### 1. Define Your Vision and Style
Before you start looking, decide on the overall feel you want for your wedding. Are you envisioning a rustic outdoor affair, a modern city celebration, or a classic, formal event? Having a clear vision will help narrow down your options significantly.

### 2. Set a Realistic Budget
Your venue and catering will likely be the largest portion of your wedding budget. Determine how much you're willing to spend before you start your search. Be upfront with potential venues about your budget to avoid falling in love with a place you can't afford.

### 3. Consider Your Guest List
Know your approximate guest count before you look at venues. A space that's too small will feel cramped, while a space that's too large can feel empty and impact the atmosphere. Make sure the venue's capacity aligns with your list.

### 4. Think About Logistics
Consider the experience for your guests. Is the venue easy to get to? Is there ample parking or access to public transportation? If you have many out-of-town guests, are there hotels nearby? These logistical details are crucial for a smooth event.

### 5. Ask What's Included
Every venue is different. Some offer all-inclusive packages that cover catering, seating, linens, and even a coordinator. Others are simply a rental space, and you'll need to bring in everything yourself. Get a detailed list of what is and isn't included to accurately compare costs.

### 6. Visit in Person
Photos can be deceiving. Once you have a shortlist, schedule visits to see the venues in person. Pay attention to the lighting, the layout, and the overall condition of the space. Try to visit at the same time of day you plan to have your wedding.

### 7. Read Reviews and Ask for References
See what other couples have to say about their experience with the venue. Check online reviews on sites like The Knot and WeddingWire. Don't hesitate to ask the venue for references you can speak with directly.

### 8. Review the Contract Carefully
Before you sign on the dotted line, read the contract thoroughly. Pay close attention to the cancellation policy, payment schedule, and any restrictions or hidden fees. If something is unclear, ask for clarification in writing.
        `,
    },
];


export function getBlogPosts(): Post[] {
    return posts;
}

export function getBlogPost(slug: string): Post | undefined {
    return posts.find(post => post.slug === slug);
}
