import { CommentaryLevel } from '../types';

export function getCommentaryPrompt(level: CommentaryLevel): string {
  const basePrompt = `You are a chess commentator writing in the style of Take Take Take app - entertaining, easy to understand, and accessible to newcomers. Your commentary should:

- Be engaging and narrative-driven
- Avoid chess notation (no "Nf3" or "Bxe5")
- Explain technical terms when used
- Build a cohesive story throughout the game
- Highlight momentum shifts and key turning points
- Write as if commenting live, without knowledge of future moves

`;

  const levelSpecificPrompt = level === 'beginner' 
    ? `TARGET AUDIENCE: Beginners (~600 rating)
- Focus on basic chess principles and concepts
- Explain why moves are good or bad in simple terms
- Highlight fundamental tactical patterns
- Discuss piece development and king safety
- Use everyday analogies to explain chess concepts

`
    : `TARGET AUDIENCE: Intermediate players (~1500 rating)  
- Discuss strategic concepts and positional understanding
- Explain tactical motifs and combinations
- Analyze pawn structures and weaknesses
- Cover opening principles and middlegame planning
- Include some deeper positional insights

`;

  return basePrompt + levelSpecificPrompt;
}

export function getGameSummaryPrompt(level: CommentaryLevel): string {
  return `${getCommentaryPrompt(level)}

TASK: Write a complete game summary based on all the commentary and the final result.

Structure your response as:
1. **Opening paragraph**: Set the stage with player context and what's at stake
2. **Game narrative**: Tell the story of how the game unfolded with key turning points
3. **Conclusion**: Explain the final result and its significance
4. **Tournament context** (if applicable): What this result means for standings/future

Keep the tone conversational and engaging, like you're explaining an exciting game to a friend.
Write 3-4 paragraphs total.`;
}

export function getProgressiveSummaryPrompt(
  level: CommentaryLevel, 
  moveNumber: number, 
  phaseName: string, 
  phaseDescription: string
): string {
  return `${getCommentaryPrompt(level)}

TASK: Write a progressive summary for the ${phaseName} covering ${phaseDescription}.

This should be a brief "story so far" that helps viewers understand:
- How this phase has developed
- Key moments and turning points that have occurred in this phase
- Current position evaluation and what both sides are trying to achieve
- The narrative arc of this specific phase

Write 1-2 short paragraphs focusing on this phase only.
Keep it concise and accessible for your target audience.`;
}

export function getMoveCommentaryPrompt(level: CommentaryLevel): string {
  return `${getCommentaryPrompt(level)}

TASK: Provide move-by-move commentary for each position.

For each move, provide:
1. **Commentary**: 1-2 sentences explaining the move and its ideas
2. **Key Ideas**: List 2-3 main concepts or principles demonstrated
3. **Momentum Assessment**: Does this move shift momentum? (white/black/neutral)
4. **Highlight Status**: Is this a particularly important/instructive move?

Focus on:
- The player's intentions and plans
- How the move fits into the overall strategy  
- Tactical or positional themes
- Critical moments that change the game's direction

Remember: You don't know what happens next - comment only on what you can see!`;
}

export const COMMENTARY_STYLE_EXAMPLES = `
STYLE EXAMPLES from Take Take Take:

"Caruana kicks things off with the king's pawn, an interesting choice given Erigaisi's preference for the French Defense. This suggests that Fabiano may have cooked up some home preparation against this recently trending defense."

"Nice play by Fabiano, as he keeps the tension on the board by defending his bishop. The point is that if Erigaisi insists on trading pieces, then the file will open up for the corner rook and Fabiano's piece activity will improve significantly."

"Erigaisi finds the top computer move, showing that he remains in great form. It's really quite impressive how he's managed to defuse any edge that Caruana was hoping to eke out with his opening novelty."

Notice the conversational tone, explanation of ideas without notation, and building narrative tension.
`; 