'use server';

/**
 * @fileOverview A conversational AI wedding assistant that can answer questions about the user's wedding plan.
 *
 * - askWeddingAssistant - The main function to interact with the assistant.
 * - WeddingAssistantInput - The input type for the assistant.
 * - WeddingAssistantOutput - The return type for the assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mock data stores - in a real app, this would come from a database.
const budgetData = {
  totalBudget: 20000,
  expenses: [
    { category: 'Venue', actual: 5500, paid: true },
    { category: 'Catering', actual: 5800, paid: true },
    { category: 'Photography', actual: 2500, paid: true },
    { category: 'Flowers', actual: 1200, paid: false },
    { category: 'Attire', actual: 2750, paid: true },
    { category: 'Entertainment', actual: 3000, paid: false },
  ],
};

const guestData = {
  guests: [
    { name: 'Alice Johnson', rsvp: 'Confirmed' },
    { name: 'Bob Williams', rsvp: 'Confirmed' },
    { name: 'Charlie Brown', rsvp: 'Pending' },
    { name: 'Diana Miller', rsvp: 'Declined' },
    { name: 'Ethan Davis', rsvp: 'Confirmed' },
    { name: 'Fiona Garcia', rsvp: 'Confirmed' },
    { name: 'George Rodriguez', rsvp: 'Pending' },
    { name: 'Hannah Smith', rsvp: 'Confirmed' },
  ]
};

const taskData = {
    tasks: [
        { id: '4', title: 'Hire a caterer', completed: false },
        { id: '5', title: 'Send save-the-dates', completed: false },
        { id: '7', title: 'Book entertainment', completed: false },
        { id: '8', title: 'Order invitations', completed: false },
        { id: '9', title: 'Finalize menu and floral selections', completed: false },
        { id: '10', title: 'Apply for marriage license', completed: false },
        { id: '11', title: 'Confirm final details with vendors', completed: false },
    ]
};


// Tool to get budget status
const getBudgetStatus = ai.defineTool(
  {
    name: 'getBudgetStatus',
    description: 'Returns the current budget status, including total budget, amount spent, and remaining budget.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      totalBudget: z.number(),
      totalSpent: z.number(),
      remainingBudget: z.number(),
    }),
  },
  async () => {
    const totalSpent = budgetData.expenses.filter(e => e.paid).reduce((sum, exp) => sum + exp.actual, 0);
    const remainingBudget = budgetData.totalBudget - totalSpent;
    return {
      totalBudget: budgetData.totalBudget,
      totalSpent,
      remainingBudget,
    };
  }
);


// Tool to get guest list summary
const getGuestListSummary = ai.defineTool(
    {
        name: 'getGuestListSummary',
        description: 'Returns a summary of the guest list, including RSVP counts.',
        inputSchema: z.object({}),
        outputSchema: z.object({
            totalGuests: z.number(),
            confirmed: z.number(),
            pending: z.number(),
            declined: z.number(),
        })
    },
    async () => {
        const totalGuests = guestData.guests.length;
        const confirmed = guestData.guests.filter(g => g.rsvp === 'Confirmed').length;
        const pending = guestData.guests.filter(g => g.rsvp === 'Pending').length;
        const declined = guestData.guests.filter(g => g.rsvp === 'Declined').length;
        return { totalGuests, confirmed, pending, declined };
    }
);

// Tool to get upcoming tasks
const getUpcomingTasks = ai.defineTool(
    {
        name: 'getUpcomingTasks',
        description: 'Returns a list of incomplete tasks.',
        inputSchema: z.object({}),
        outputSchema: z.object({
            upcomingTasks: z.array(z.object({ title: z.string() }))
        }),
    },
    async () => {
        const upcomingTasks = taskData.tasks.filter(t => !t.completed).map(t => ({title: t.title}));
        return { upcomingTasks };
    }
)


const WeddingAssistantInputSchema = z.object({
  question: z.string().describe('The user\'s question about their wedding plan.'),
});
export type WeddingAssistantInput = z.infer<typeof WeddingAssistantInputSchema>;

const WeddingAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI assistant\'s answer to the user\'s question.'),
});
export type WeddingAssistantOutput = z.infer<typeof WeddingAssistantOutputSchema>;


export async function askWeddingAssistant(input: WeddingAssistantInput): Promise<WeddingAssistantOutput> {
  return weddingAssistantFlow(input);
}


const prompt = ai.definePrompt({
    name: 'weddingAssistantPrompt',
    system: `You are a helpful and friendly wedding planning assistant. Your name is Welly.
Use the available tools to answer the user's questions about their wedding plan.
Provide clear, concise, and friendly answers.
If you don't have the information, say so politely.
Always refer to yourself in the first person (e.g., "I can help with that!").`,
    tools: [getBudgetStatus, getGuestListSummary, getUpcomingTasks],
    input: { schema: WeddingAssistantInputSchema },
    output: { schema: WeddingAssistantOutputSchema },
    prompt: `The user's question is: {{{question}}}`
});


const weddingAssistantFlow = ai.defineFlow(
  {
    name: 'weddingAssistantFlow',
    inputSchema: WeddingAssistantInputSchema,
    outputSchema: WeddingAssistantOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return {
        answer: llmResponse.output?.answer || "I'm not sure how to answer that. Can you try asking another way?",
    };
  }
);
