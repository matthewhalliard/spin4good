'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface SlotMachineProps {
  userProfile: any;
  potAmount: number;
  updateCredits: (credits: number) => void;
  onNeedCredits: () => void;
}

const symbols = ['⭐️', '🔔', '🍇', '🍋', '7️⃣'];
const wildSymbol = '🕉';

const betSizes = [
  { value: 1, label: '1 credit' },
  { value: 3, label: '3 credits' },
  { value: 5, label: '5 credits' }
];

export default function SlotMachine({ userProfile, potAmount, updateCredits, onNeedCredits }: SlotMachineProps) {
  const [grid, setGrid] = useState([
    ['⭐️', '🔔', '🕉', '⭐️', '🍇'],
    ['🍇', '🕉', '🔔', '🍋', '🍇'],
    ['⭐️', '⭐️', '7️⃣', '🕉', '7️⃣'],
    ['🍋', '🕉', '⭐️', '🔔', '🍋'],
    ['🔔', '7️⃣', '🍇', '🕉', '🔔']
  ]);
  
  const [selectedBet, setSelectedBet] = useState(betSizes[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [winningLines, setWinningLines] = useState<[number, number][]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [winMessage, setWinMessage] = useState('');
  const [showWildTooltip, setShowWildTooltip] = useState(false);

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const isWinningCell = (row: number, col: number) => {
    return winningLines.some(([r, c]) => r === row && c === col);
  };

  const getRandomSymbol = () => {
    if (Math.random() < 0.2) {
      return wildSymbol;
    }
    return symbols[Math.floor(Math.random() * symbols.length)];
  };

  const checkWinPatterns = (newGrid: string[][]) => {
    let winningCells: [number, number][] = [];
    let description = '';
    
    // Check horizontal wins
    for (let row = 0; row < 5; row++) {
      const rowSymbols = newGrid[row];
      const firstSymbol = rowSymbols[0];
      const allMatch = rowSymbols.every(s => s === firstSymbol || s === wildSymbol);
      
      if (allMatch && firstSymbol !== wildSymbol) {
        for (let col = 0; col < 5; col++) {
          winningCells.push([row, col]);
        }
        description += `Row ${row + 1} matches! `;
      }
    }
    
    // Check vertical wins
    for (let col = 0; col < 5; col++) {
      const colSymbols = [newGrid[0][col], newGrid[1][col], newGrid[2][col], newGrid[3][col], newGrid[4][col]];
      const firstSymbol = colSymbols[0];
      const allMatch = colSymbols.every(s => s === firstSymbol || s === wildSymbol);
      
      if (allMatch && firstSymbol !== wildSymbol) {
        for (let row = 0; row < 5; row++) {
          winningCells.push([row, col]);
        }
        description += `Column ${col + 1} matches! `;
      }
    }
    
    // Check diagonal (top-left to bottom-right)
    const diag1 = [newGrid[0][0], newGrid[1][1], newGrid[2][2], newGrid[3][3], newGrid[4][4]];
    const diag1First = diag1[0];
    const diag1Match = diag1.every(s => s === diag1First || s === wildSymbol);
    
    if (diag1Match && diag1First !== wildSymbol) {
      winningCells.push([0, 0], [1, 1], [2, 2], [3, 3], [4, 4]);
      description += 'Diagonal from top-left matches! ';
    }
    
    // Check diagonal (top-right to bottom-left)
    const diag2 = [newGrid[0][4], newGrid[1][3], newGrid[2][2], newGrid[3][1], newGrid[4][0]];
    const diag2First = diag2[0];
    const diag2Match = diag2.every(s => s === diag2First || s === wildSymbol);
    
    if (diag2Match && diag2First !== wildSymbol) {
      winningCells.push([0, 4], [1, 3], [2, 2], [3, 1], [4, 0]);
      description += 'Diagonal from top-right matches! ';
    }
    
    return {
      cells: winningCells,
      description: description,
      hasWin: winningCells.length > 0
    };
  };

  const handleSpin = async () => {
    if (userProfile.credits < selectedBet.value) {
      onNeedCredits();
      return;
    }
    
    setIsSpinning(true);
    setWinningLines([]);
    setIsWinner(false);
    setWinAmount(0);
    setWinMessage('');
    
    // Call server action to process spin
    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile.id,
          betAmount: selectedBet.value,
        }),
      });

      if (!response.ok) {
        throw new Error('Spin failed');
      }

      const { spin, newCredits, newPotAmount } = await response.json();
      
      // Animate spinning
      const spinInterval = setInterval(() => {
        const animatedGrid = Array(5).fill(null).map(() =>
          Array(5).fill(null).map(() => getRandomSymbol())
        );
        setGrid(animatedGrid);
      }, 100);
      
      setTimeout(() => {
        clearInterval(spinInterval);
        setGrid(spin.result_grid);
        updateCredits(newCredits);
        
        if (spin.won) {
          const result = checkWinPatterns(spin.result_grid);
          setWinningLines(result.cells);
          setIsWinner(true);
          setWinMessage(result.description);
          setWinAmount(spin.pot_amount_won);
        }
        
        setIsSpinning(false);
      }, 2000);
    } catch (error) {
      console.error('Spin error:', error);
      setIsSpinning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center mb-6">
      <div className="relative bg-gray-800 rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl">
        <div className="bg-gray-700 p-4 text-center relative">
          <h2 className="text-xl font-bold">Charity Slot</h2>
          <p className="text-sm text-gray-300">Win to direct the pot to your charity</p>
          
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <button 
              className="bg-gray-600 p-2 rounded-full hover:bg-gray-500"
              onMouseEnter={() => setShowWildTooltip(true)}
              onMouseLeave={() => setShowWildTooltip(false)}
            >
              <Info size={16} />
            </button>
            
            {showWildTooltip && (
              <div className="absolute right-0 mt-2 p-3 bg-gray-900 rounded-lg shadow-lg z-10 w-64 text-left">
                <h4 className="font-bold mb-1">Wild Symbol: {wildSymbol}</h4>
                <p className="text-sm mb-2">
                  The wild symbol can substitute for any other symbol to complete a winning combination.
                </p>
                <p className="text-sm text-gray-400">
                  Win on any row, column, or diagonal with 5 matching symbols!
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-black p-4">
          <div className="grid grid-cols-5 gap-1 mb-4">
            {grid.map((row, rowIndex) => (
              row.map((symbol, colIndex) => {
                const isWinCell = isWinningCell(rowIndex, colIndex);
                const isWild = symbol === wildSymbol;
                
                return (
                  <div 
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      w-full h-16 bg-gradient-to-b from-gray-700 to-gray-900 
                      rounded flex items-center justify-center text-3xl
                      ${isWinCell ? 'animate-bounce shadow-lg shadow-yellow-500/50' : ''}
                      ${isWild ? 'bg-gradient-to-b from-purple-600 to-purple-900 shadow-lg shadow-purple-500/50' : ''}
                      ${isSpinning ? 'animate-pulse border-2 border-green-400' : ''}
                      transition-all duration-200
                    `}
                  >
                    {symbol}
                  </div>
                );
              })
            ))}
          </div>
          
          {isWinner && (
            <div className="bg-green-600 text-white p-3 rounded-lg text-center mb-4 animate-pulse">
              <div className="text-xl font-bold">🎉 WINNER!</div>
              {winMessage && <div className="text-sm mb-2">{winMessage}</div>}
              <div className="text-lg font-bold">
                {formatAmount(winAmount)} sent to {userProfile.charities?.name}!
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-1/3 flex flex-col gap-2">
              <div className="text-sm text-gray-400 mb-1">Bet Size</div>
              <div className="flex gap-2">
                {betSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setSelectedBet(size)}
                    disabled={isSpinning}
                    className={`flex-1 py-2 px-3 rounded-lg text-center ${
                      selectedBet.value === size.value 
                        ? 'bg-green-600 text-white font-bold' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {size.value}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`w-full sm:w-2/3 py-3 rounded-lg text-xl font-bold ${
                isSpinning 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
              }`}
            >
              {isSpinning 
                ? 'Spinning...' 
                : `SPIN (${selectedBet.value} credit${selectedBet.value > 1 ? 's' : ''})`
              }
            </button>
          </div>
          
          <div className="mt-3 flex flex-wrap justify-between items-center text-sm text-gray-400">
            <div>
              <span className="font-medium text-white">Credits:</span> {userProfile.credits}
            </div>
            <div className="hidden sm:block">
              Higher bets = bigger donations
            </div>
            <button
              onClick={onNeedCredits}
              className="bg-gray-600 hover:bg-gray-500 text-white text-sm rounded px-3 py-1 flex items-center gap-1"
            >
              <span className="text-xs">🕐</span>
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 