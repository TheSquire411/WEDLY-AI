
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
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Tool to get budget status
const getBudgetStatus = ai.defineTool(
  {
    name: 'getBudgetStatus',
    description: 'Returns the current budget status, including total budget, amount spent, and remaining budget.',
    inputSchema: z.object({
        userId: z.string().describe("The ID of the user to fetch data for.")
    }),
    outputSchema: z.object({
      totalBudget: z.number(),
      totalSpent: z.number(),
      remainingBudget: z.number(),
    }),
  },
  async ({ userId }) => {
    const budgetDocRef = db.collection('users').doc(userId).collection('budget').doc('summary');
    const expensesCollectionRef = db.collection('users').doc(userId).collection('expenses');
    
    const budgetDoc = await budgetDocRef.get();
    const expensesSnapshot = await expensesCollectionRef.where('paid', '==', true).get();

    const totalBudget = budgetDoc.exists ? (budgetDoc.data()?.total || 0) : 0;
    const totalSpent = expensesSnapshot.docs.reduce((sum, doc) => sum + doc.data().actual, 0);
    const remainingBudget = totalBudget - totalSpent;

    return { totalBudget, totalSpent, remainingBudget };
  }
);


// Tool to get guest list summary
const getGuestListSummary = ai.defineTool(
    {
        name: 'getGuestListSummary',
        description: 'Returns a summary of the guest list, including RSVP counts.',
        inputSchema: z.object({
            userId: z.string().describe("The ID of the user to fetch data for.")
        }),
        outputSchema: z.object({
            totalGuests: z.number(),
            confirmed: z.number(),
            pending: z.number(),
            declined: z.number(),
        })
    },
    async ({ userId }) => {
        const guestsCollectionRef = db.collection('users').doc(userId).collection('guests');
        const confirmedSnapshot = await guestsCollectionRef.where('rsvp', '==', 'Confirmed').get();
        const pendingSnapshot = await guestsCollectionRef.where('rsvp', '==', 'Pending').get();
        const declinedSnapshot = await guestsCollectionRef.where('rsvp', '==', 'Declined').get();
        
        const totalGuests = confirmedSnapshot.size + pendingSnapshot.size + declinedSnapshot.size;

        return { 
            totalGuests, 
            confirmed: confirmedSnapshot.size, 
            pending: pendingSnapshot.size, 
            declined: declinedSnapshot.size 
        };
    }
);

// Tool to get upcoming tasks
const getUpcomingTasks = ai.defineTool(
    {
        name: 'getUpcomingTasks',
        description: 'Returns a list of incomplete tasks.',
        inputSchema: z.object({
            userId: z.string().describe("The ID of the user to fetch data for.")
        }),
        outputSchema: z.object({
            upcomingTasks: z.array(z.object({ title: z.string() }))
        }),
    },
    async ({ userId }) => {
        const tasksCollectionRef = db.collection('users').doc(userId).collection('tasks');
        const tasksSnapshot = await tasksCollectionRef.where('completed', '==', false).get();
        const upcomingTasks = tasksSnapshot.docs.map(doc => ({title: doc.data().title}));
        return { upcomingTasks };
    }
)


const WeddingAssistantInputSchema = z.object({
  question: z.string().describe('The user\'s question about their wedding plan.'),
  userId: z.string().describe('The ID of the user asking the question.'),
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
Use the available tools to answer the user's questions about their wedding plan based on their user ID.
Provide clear, concise, and friendly answers.
If you don't have the information, say so politely.
Always refer to yourself in the first person (e.g., "I can help with that!").
When asked a question, you must call the appropriate tool with the userId provided in the input.`,
    tools: [getBudgetStatus, getGuestListSummary, getUpcomingTasks],
    input: { schema: WeddingAssistantInputSchema },
    output: { schema: WeddingAssistantOutputSchema },
    prompt: `The user's question is: {{{question}}}. The user's ID is: {{{userId}}}.`
});


const weddingAssistantFlow = ai.defineFlow(
  {
    name: 'weddingAssistantFlow',
    inputSchema: WeddingAssistantInputSchema,
    outputSchema: WeddingAssistantOutputSchema,
  },
  async (input) => {
    try {
        const llmResponse = await prompt(input);
        const answer = llmResponse.output?.answer;

        if (answer) {
            return { answer };
        } else {
             // Fallback if the structured output is empty
            const rawTextResponse = llmResponse.text;
            if (rawTextResponse) {
                return { answer: rawTextResponse };
            }
            return { answer: "I'm not sure how to answer that. Can you try asking another way?" };
        }
    } catch (error) {
        console.error("Error in wedding assistant flow:", error);
        return { answer: "Sorry, I encountered an error while trying to respond. Please try again." };
    }
  }
);
