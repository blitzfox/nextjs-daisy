import axios from 'axios';
import { AudioRequest, AudioResponse } from '@/lib/types';

// Function to generate audio from text using ElevenLabs API
export async function generateAudio(text: string, voiceId?: string): Promise<AudioResponse> {
  try {
    // Use Shimmer voice ID to match Python implementation
    const voice = voiceId || 'kCx3Qoh3lfILbbTZftSq'; // Shimmer voice ID
    
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