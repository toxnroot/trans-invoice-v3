'use server';

/**
 * @fileOverview This file implements the smart customer suggestions flow.
 *
 * - suggestCustomerName - A function that suggests customer names based on user input.
 * - SuggestCustomerNameInput - The input type for the suggestCustomerName function.
 * - SuggestCustomerNameOutput - The return type for the suggestCustomerName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCustomerNameInputSchema = z.object({
  partialCustomerName: z
    .string()
    .describe('The partial customer name entered by the user.'),
  availableCustomers: z.array(z.string()).describe('A list of available customer names.'),
});
export type SuggestCustomerNameInput = z.infer<typeof SuggestCustomerNameInputSchema>;

const SuggestCustomerNameOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('Suggested customer names based on the input.'),
});
export type SuggestCustomerNameOutput = z.infer<typeof SuggestCustomerNameOutputSchema>;

export async function suggestCustomerName(input: SuggestCustomerNameInput): Promise<SuggestCustomerNameOutput> {
  return suggestCustomerNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCustomerNamePrompt',
  input: {schema: SuggestCustomerNameInputSchema},
  output: {schema: SuggestCustomerNameOutputSchema},
  prompt: `You are an AI assistant that suggests customer names based on a partial input and a list of available customers.

  Given the partial customer name "{{partialCustomerName}}" and the following list of available customers:
  {{#each availableCustomers}}
  - {{{this}}}
  {{/each}}

  Suggest customer names that the user might be looking for. Return only customer names from the list of available customers.
  Return the suggestions as an array of strings.
  If there are no suggestions, return an empty array.
  `,
});

const suggestCustomerNameFlow = ai.defineFlow(
  {
    name: 'suggestCustomerNameFlow',
    inputSchema: SuggestCustomerNameInputSchema,
    outputSchema: SuggestCustomerNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
