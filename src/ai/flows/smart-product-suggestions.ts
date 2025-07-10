'use server';

/**
 * @fileOverview This file implements the smart product suggestions flow.
 *
 * - suggestProductName - A function that suggests product names based on user input.
 * - SuggestProductNameInput - The input type for the suggestProductName function.
 * - SuggestProductNameOutput - The return type for the suggestProductName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductNameInputSchema = z.object({
  partialProductName: z
    .string()
    .describe('The partial product name entered by the user.'),
  availableProducts: z.array(z.string()).describe('A list of available product names.'),
});
export type SuggestProductNameInput = z.infer<typeof SuggestProductNameInputSchema>;

const SuggestProductNameOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('Suggested product names based on the input.'),
});
export type SuggestProductNameOutput = z.infer<typeof SuggestProductNameOutputSchema>;

export async function suggestProductName(input: SuggestProductNameInput): Promise<SuggestProductNameOutput> {
  return suggestProductNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductNamePrompt',
  input: {schema: SuggestProductNameInputSchema},
  output: {schema: SuggestProductNameOutputSchema},
  prompt: `You are an AI assistant that suggests product names based on a partial input and a list of available products.

  Given the partial product name "{{partialProductName}}" and the following list of available products:
  {{#each availableProducts}}
  - {{{this}}}
  {{/each}}

  Suggest product names that the user might be looking for. Return only product names from the list of available products.
  Return the suggestions as an array of strings.
  If there are no suggestions, return an empty array.
  `,
});

const suggestProductNameFlow = ai.defineFlow(
  {
    name: 'suggestProductNameFlow',
    inputSchema: SuggestProductNameInputSchema,
    outputSchema: SuggestProductNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
