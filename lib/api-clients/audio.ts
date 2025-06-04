import axios from 'axios';
import { AudioRequest, AudioResponse } from '@/lib/types';

// Function to generate audio from text using ElevenLabs API
export async function generateAudio(text: string, voiceId?: string): Promise<AudioResponse> {
  try {
    // Use default voice if not specified
    const voice = voiceId || 'g1YTxkimRsWs5W4bseRi'; // Default ElevenLabs voice ID
    
    const response = await axios.post('/api/audio/generate', {
      text,
      voiceId: voice
    } as AudioRequest);
    
    return response.data;
  } catch (error) {
    console.error('Error generating audio:', error);
    return {
      audioUrl: '',
      error: 'Failed to generate audio. Please try again.'
    };
  }
}