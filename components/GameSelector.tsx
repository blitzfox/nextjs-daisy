'use client';

import React, { useState } from 'react';
import { Game } from '@/lib/types';
import { useChessStore } from '@/lib/state/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Trophy, Clock, Calendar } from "lucide-react";

interface GameSelectorProps {
  games: Game[];
}

const GameSelector: React.FC<GameSelectorProps> = ({ games }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 5;
  const { selectGame, selectedGame } = useChessStore();
  
  // Calculate pagination
  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = games.slice(indexOfFirstGame, indexOfLastGame);
  const totalPages = Math.ceil(games.length / gamesPerPage);
  
  // Handle game selection
  const handleSelectGame = (game: Game) => {
    selectGame(game);
  };
  
  // Handle pagination
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };
  
  // Format date from timestamp
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get result badge styling
  const getResultBadge = (result: string, white: string, black: string, userColor: 'white' | 'black') => {
    if (result === '1-0') {
      return (
        <Badge className={`${userColor === 'white' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
          {userColor === 'white' ? 'Won' : 'Lost'}
        </Badge>
      );
    } else if (result === '0-1') {
      return (
        <Badge className={`${userColor === 'black' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
          {userColor === 'black' ? 'Won' : 'Lost'}
        </Badge>
      );
    } else {
      return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Draw</Badge>;
    }
  };

  // Get player initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (currentGames.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No games found</p>
        <p className="text-gray-400 text-sm">Try fetching games from your chess platform</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Games Table */}
      <Card className="shadow-sm">
        <CardContent className="pt-3 px-3 pb-2">
          <div className="rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50">
                  <TableHead className="w-12 py-1.5 text-xs font-semibold">#</TableHead>
                  <TableHead className="py-1.5 text-xs font-semibold">Players</TableHead>
                  <TableHead className="text-center py-1.5 text-xs font-semibold w-20">Result</TableHead>
                  <TableHead className="text-right py-1.5 text-xs font-semibold w-24">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentGames.map((game, index) => {
                  const isSelected = selectedGame?.id === game.id;
                  const gameNumber = indexOfFirstGame + index + 1;
                  
                  return (
                    <TableRow 
                      key={game.id}
                      onClick={() => handleSelectGame(game)}
                      className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        isSelected 
                          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                          : ''
                      }`}
                    >
                      <TableCell className="font-mono text-xs text-gray-500 py-1.5">
                        {gameNumber}
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center justify-between space-x-2 min-w-0">
                          <div className="flex items-center space-x-1 min-w-0 flex-1">
                            <Avatar className="h-5 w-5 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-white border text-gray-700">
                                {getInitials(game.white)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-xs truncate">{game.white}</span>
                          </div>
                          <span className="text-gray-400 text-xs font-bold flex-shrink-0">vs</span>
                          <div className="flex items-center space-x-1 min-w-0 flex-1">
                            <Avatar className="h-5 w-5 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-gray-900 text-white">
                                {getInitials(game.black)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-xs truncate">{game.black}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-1.5">
                        <div className="flex justify-center">
                          {getResultBadge(
                            game.result, 
                            game.white, 
                            game.black, 
                            'white' // This could be dynamic based on user
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-1.5">
                        <div className="flex items-center justify-end space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate">
                            {formatDate(game.date)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstGame + 1}-{Math.min(indexOfLastGame, games.length)} of {games.length} games
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === currentPage;
                
                // Show first page, last page, current page, and pages around current
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={pageNum}
                      variant={isCurrentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return (
                    <span key={pageNum} className="px-1 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSelector;