import { NextRequest, NextResponse } from 'next/server';
import { AudioRequest, AudioResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: AudioRequest = await request.json();
    
    if (!body.text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    // Get API key from environment variables
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }
    
    // Use Shimmer voice ID to match Python implementation
    const voiceId = body.voiceId || 'kCx3Qoh3lfILbbTZftSq';
    
    // Call ElevenLabs API with parameters matching Python implementation
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: body.text,
          model_id: 'eleven_flash_v2',  // Updated to match Python
          output_format: 'mp3_44100_128',  // Added to match Python
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
          },
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ElevenLabs API error: ${errorData.detail?.message || response.statusText}`);
    }
    
    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Convert audio buffer to base64 data URL for direct playback
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
    
    const result: AudioResponse = {
      audioUrl,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}