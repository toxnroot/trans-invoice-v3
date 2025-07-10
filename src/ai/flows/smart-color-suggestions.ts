'use server';

/**
 * @fileOverview This file implements the smart color suggestions flow.
 *
 * - suggestColorName - A function that suggests color names based on user input.
 * - SuggestColorNameInput - The input type for the suggestColorName function.
 * - SuggestColorNameOutput - The return type for the suggestColorName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestColorNameInputSchema = z.object({
  partialColorName: z
    .string()
    .describe('The partial color name entered by the user.'),
  availableColors: z.array(z.string()).describe('A list of available color names.'),
});
export type SuggestColorNameInput = z.infer<typeof SuggestColorNameInputSchema>;

const SuggestColorNameOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('Suggested color names based on the input.'),
});
export type SuggestColorNameOutput = z.infer<typeof SuggestColorNameOutputSchema>;

export async function suggestColorName(input: SuggestColorNameInput): Promise<SuggestColorNameOutput> {
  return suggestColorNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestColorNamePrompt',
  input: {schema: SuggestColorNameInputSchema},
  output: {schema: SuggestColorNameOutputSchema},
  prompt: `You are an AI assistant that suggests color names based on a partial input and a list of available colors.

  Given the partial color name "{{partialColorName}}" and the following list of available colors:
  {{#each availableColors}}
  - {{{this}}}
  {{/each}}

  Suggest color names that the user might be looking for. Return only color names from the list of available colors.
  Return the suggestions as an array of strings.
  If there are no suggestions, return an empty array.
  `,
});

const suggestColorNameFlow = ai.defineFlow(
  {
    name: 'suggestColorNameFlow',
    inputSchema: SuggestColorNameInputSchema,
    outputSchema: SuggestColorNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
