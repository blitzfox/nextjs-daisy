'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CriticalMoment } from '@/lib/types';
import { generateAudio } from '@/lib/api-clients/audio';
import { refineSpeechText } from '@/lib/prompts/ttsPrompts';

interface AudioPlayerProps {
  momentNumber: number;
  criticalMoments: CriticalMoment[];
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ momentNumber, criticalMoments }) => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    // Reset state when moment changes
    setAudioUrl('');
    setError(null);
    
    const currentMoment = criticalMoments[momentNumber - 1];
    if (!currentMoment) return;
    
    // If moment already has an audio URL, use it
    if (currentMoment.audioUrl) {
      setAudioUrl(currentMoment.audioUrl);
      return;
    }
    
    // Otherwise, generate audio
    const loadAudio = async () => {
      setIsLoading(true);
      try {
        // Extract the analysis text and refine it for speech using the new system
        const analysisText = currentMoment.analysis;
        const refinedText = refineSpeechText(analysisText);
        
        // Generate audio
        const response = await generateAudio(refinedText);
        
        if (response.audioUrl) {
          setAudioUrl(response.audioUrl);
          
          // Update the moment with the generated audio URL
          currentMoment.audioUrl = response.audioUrl;
        } else {
          setError('Failed to generate audio');
        }
      } catch (err) {
        console.error('Error generating audio:', err);
        setError('Error generating audio. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAudio();
  }, [momentNumber, criticalMoments]);

  // Auto-play when audio loads
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  };

  if (!criticalMoments[momentNumber - 1]) {
    return null;
  }

  return (
    <div className="audio-player mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-lg font-semibold mb-3">Voice Analysis</h4>
      
      {isLoading && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          <span className="text-gray-600">Generating audio...</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-600 mb-3">
          {error}
        </div>
      )}
      
      {audioUrl && (
        <div className="space-y-3">
          <audio
            ref={audioRef}
            controls
            className="w-full"
            preload="metadata"
          >
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          
          <div className="flex space-x-2">
            <button
              onClick={handlePlay}
              className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              Play
            </button>
            <button
              onClick={handlePause}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={handleReplay}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Replay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;