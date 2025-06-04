import { z } from "zod";

// Schema for a single critical moment
export const CriticalMomentSchema = z.object({
  move_info: z.string().describe("The move that was played at this critical moment"),
  move_number: z.string().describe("The number of the critical move"),
  best_move: z.string().describe("The best move according to the engine"),
  evaluation: z.number().describe("The position evaluation after the move"),
  opponents_best_move: z.string().optional().describe("The best move for the opponent"),
  fen: z.string().describe("The FEN position after the move"),
  continuation: z.string().describe("The engine's suggested continuation"),
  full_line: z.string().describe("The complete table row for this move"),
  phase: z.enum(["opening", "early", "middle", "middlegame", "late", "endgame"]).describe("The game phase"),
  reason: z.string().describe("Brief explanation of why this moment is critical")
});

// Schema for the complete critical moments extraction
export const CriticalMomentsExtractionSchema = z.object({
  critical_moments: z.array(CriticalMomentSchema).length(4).describe("Exactly 4 critical moments in chronological order")
});

// Schema for detailed analysis of a single moment
export const MomentAnalysisSchema = z.object({
  title: z.string().describe("Title of the critical moment"),
  explanation: z.string().describe("Detailed explanation of what happened"),
  recommendation: z.string().describe("The recommended move"),
  why_better: z.string().describe("Why the recommended move is better"),
  principle: z.string().describe("The key chess principle demonstrated"),
  summary: z.string().describe("Brief summary for voice synthesis")
});

// Schema for voice analysis optimization
export const VoiceAnalysisSchema = z.object({
  audio_script: z.string().describe("Audio-optimized script for text-to-speech with natural pacing and clear pronunciation"),
  key_moves: z.array(z.string()).describe("List of chess moves mentioned that need special pronunciation"),
  emphasis_points: z.array(z.string()).describe("Key points that should be emphasized in speech"),
  estimated_duration: z.number().describe("Estimated duration in seconds for the audio")
});

// Export types for TypeScript
export type CriticalMomentExtraction = z.infer<typeof CriticalMomentsExtractionSchema>;
export type CriticalMomentData = z.infer<typeof CriticalMomentSchema>;
export type MomentAnalysis = z.infer<typeof MomentAnalysisSchema>;
export type VoiceAnalysis = z.infer<typeof VoiceAnalysisSchema>; 