export const text_to_speech_prompt_v2 = `
You are a professional chess coach delivering spoken analysis. Your goal is to refine the provided written chess analysis to make it sound natural and engaging when spoken aloud.

Guidelines for refinement:
1. Use conversational language
2. Remove or replace complex notation with spoken descriptions
3. Add natural pauses and emphasis markers
4. Make the analysis flow smoothly for audio delivery
5. Keep technical accuracy while improving listenability

Original Analysis:
{analysis_text}

Refined for Speech:
Please provide a refined version that:
- Flows naturally when spoken
- Uses clear, conversational language
- Maintains chess accuracy
- Is engaging for audio listeners
- Is approximately the same length as the original

Output only the refined text, no additional commentary.
`;

export const speech_refinement_prompt = `
You are a chess communication expert specializing in converting written chess analysis into natural, spoken commentary.

Your task is to transform the provided chess analysis into audio-friendly content while maintaining all the key insights and technical accuracy.

Key requirements:
1. Convert chess notation into spoken language (e.g., "Nf3" becomes "Knight to f3")
2. Use natural speech patterns and transitions
3. Add emphasis and pacing cues where appropriate
4. Make complex positions easier to understand when heard
5. Maintain the educational value and insights
6. Keep the same overall structure but make it conversational
7. Add clarifying phrases that help listeners visualize the position

Original Analysis:
{analysis_text}

Please provide the refined version formatted for text-to-speech conversion. Focus on clarity, natural flow, and maintaining the chess insights while making it perfectly suited for audio delivery.
`;

export const audio_script_refinement_prompt = `
You are refining chess analysis for audio narration. Transform the following written analysis into a script that sounds natural when read aloud by a text-to-speech system.

Requirements:
- Convert chess notation to spoken descriptions
- Use clear, conversational language
- Add natural transitions between ideas
- Include emphasis markers where needed
- Maintain technical accuracy
- Make it engaging for listeners
- Remove visual references that don't work in audio

Input Analysis:
{analysis_text}

Output only the refined audio script:
`;

export const voice_analysis_prompt = `
You are creating an audio commentary script for chess analysis. Take the written analysis and make it perfect for voice delivery.

Key transformations needed:
1. Chess moves: Convert notation to natural speech
2. Visual elements: Replace with audio-friendly descriptions
3. Structure: Add natural speech flow and transitions
4. Engagement: Make it interesting to listen to
5. Clarity: Ensure complex ideas are clear when heard
6. Pacing: Add natural pauses and emphasis

Written Analysis:
{analysis_text}

Provide the audio-optimized version:
`;

export const speech_optimization_prompt = `
Transform this chess analysis into an engaging audio script. Make it sound like a grandmaster is personally explaining the position to a student.

Focus on:
- Natural, conversational tone
- Clear explanations of moves and tactics
- Engaging storytelling about the position
- Easy-to-follow logical flow
- Appropriate pacing for audio delivery

Original Text:
{analysis_text}

Audio Script:
`;

// Utility function to apply TTS refinement
export function refineSpeechText(analysisText: string): string {
  // Basic refinement rules that can be applied immediately
  let refined = analysisText
    // Convert common chess notation to spoken form
    .replace(/\b([KQRBN]?)([a-h])([1-8])\b/g, (match, piece, file, rank) => {
      const pieces: Record<string, string> = {
        'K': 'King',
        'Q': 'Queen', 
        'R': 'Rook',
        'B': 'Bishop',
        'N': 'Knight',
        '': 'pawn'
      };
      const files: Record<string, string> = {
        'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D',
        'e': 'E', 'f': 'F', 'g': 'G', 'h': 'H'
      };
      
      const pieceName = pieces[piece] || 'pawn';
      const fileName = files[file] || file;
      
      return `${pieceName} to ${fileName}${rank}`;
    })
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    // Replace evaluation symbols
    .replace(/\+(\d+\.?\d*)/g, 'plus $1')
    .replace(/-(\d+\.?\d*)/g, 'minus $1')
    // Add natural pauses
    .replace(/\. /g, '. ')
    .replace(/\, /g, ', ')
    // Make it more conversational
    .replace(/The move/g, 'Playing')
    .replace(/This move/g, 'This')
    .replace(/However,/g, 'But')
    .replace(/Therefore,/g, 'So')
    .replace(/Furthermore,/g, 'Also');

  return refined;
}

// Template for generating TTS-optimized analysis
export const tts_analysis_template = `
As a chess coach explaining this position:

{analysis_content}

Key points to emphasize in speech:
- The critical move and why it matters
- The evaluation change and its significance  
- The recommended improvement and its benefits
- The underlying chess principle

Make this sound like a personal coaching session, not a written report.
`; 