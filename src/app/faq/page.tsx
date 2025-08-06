
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Header } from "@/components/header";
import { Metadata } from "next";
import Head from "next/head";

export const metadata: Metadata = {
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about Wedly, your AI-powered wedding planning assistant. Learn about our features, pricing, and how we can make your wedding planning easier.',
}

const faqData = [
    {
        question: "What is Wedly?",
        answer: "Wedly is an all-in-one wedding planning platform that uses the power of Artificial Intelligence to simplify your wedding planning. From creating a budget and managing your guest list to generating personalized vows and creating a vision board, Wedly is your personal wedding assistant."
    },
    {
        question: "How does the AI Wedding Assistant work?",
        answer: "Our AI assistant is connected to your wedding data (budget, guests, tasks). You can ask it natural language questions like 'How much have I spent on catering?' or 'Who hasn't RSVP'd yet?' and it will provide you with instant, accurate answers, saving you from manually digging through your plans."
    },
    {
        question: "What's the difference between the Free and Pro plans?",
        answer: "The Free plan includes basic tools to get you started. The Pro plan, available for a one-time payment, unlocks all our powerful AI features, including the Vow Generator, AI Budget Assistant, AI Seating Chart Assistant, and unlimited photo uploads for you and your guests. This gives you the full, stress-free planning experience."
    },
    {
        question: "Is my personal data secure?",
        answer: "Absolutely. We take your privacy very seriously. Your wedding data is stored securely and is only used to power the features within your personal account. We do not share or sell your data to third parties. All payment information is handled securely by our payment processor, Stripe."
    },
    {
        question: "How does the guest photo upload work?",
        answer: "We provide you with a unique QR code and a shareable link. Your guests can scan the code or use the link to upload their photos directly from their phones to a shared wedding album right within your Wedly dashboard. It's the easiest way to collect all those precious memories from your special day."
    },
    {
        question: "What if I need help or have more questions?",
        answer: "We're here for you! You can always reach out to our support team through our contact page. We're committed to making your wedding planning journey as smooth as possible."
    }
];

// JSON-LD Schema for SEO
const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
        }
    }))
};


export default function FaqPage() {
  return (
    <>
      <Head>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <div className="bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-headline text-gray-800">Frequently Asked Questions</h1>
                <p className="mt-4 text-lg text-muted-foreground">Have questions? We have answers.</p>
            </div>

            <div className="max-w-3xl mx-auto">
                 <Accordion type="single" collapsible className="w-full">
                    {faqData.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-lg text-left">{item.question}</AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                            {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </main>
      </div>
    </>
  );
}
