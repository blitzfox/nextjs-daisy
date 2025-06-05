'use client';

import React from 'react';
import { useChessStore } from '@/lib/state/store';
import { Platform } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, Zap } from 'lucide-react';

const PlatformSelector: React.FC = () => {
  const { platform, setPlatform } = useChessStore();
  
  const handlePlatformChange = (newPlatform: Platform) => {
    setPlatform(newPlatform);
  };
  
  const platforms = [
    {
      id: 'lichess' as Platform,
      name: 'Lichess',
      color: 'from-green-500 to-emerald-600',
      icon: <Globe className="h-4 w-4" />
    },
    {
      id: 'chessdotcom' as Platform,
      name: 'Chess.com',
      color: 'from-orange-500 to-red-600',
      icon: <Zap className="h-4 w-4" />
    }
  ];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Choose Platform</span>
        <Badge variant="outline" className="text-xs">
          {platform === 'lichess' ? 'Lichess' : 'Chess.com'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {platforms.map((platformOption) => {
          const isSelected = platform === platformOption.id;
          
          return (
            <Button
              key={platformOption.id}
              onClick={() => handlePlatformChange(platformOption.id)}
              variant={isSelected ? "default" : "outline"}
              className={`
                w-full h-auto p-3 justify-start text-left transition-all duration-200
                ${isSelected 
                  ? `bg-gradient-to-r ${platformOption.color} text-white shadow-lg hover:shadow-xl border-0` 
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                }
              `}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-md ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {React.cloneElement(platformOption.icon, {
                      className: `h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-600'}`
                    })}
                  </div>
                  <div>
                    <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {platformOption.name}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="p-1 bg-white/20 rounded-full">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformSelector;