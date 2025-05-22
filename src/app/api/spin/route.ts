import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const symbols = ['⭐️', '🔔', '🍇', '🍋', '7️⃣'];
const wildSymbol = '🕉';

export async function POST(request: NextRequest) {
  try {
    const { userId, betAmount } = await request.json();
    
    if (!userId || !betAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Start a transaction by fetching user and global state
    const [userResult, globalStateResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('global_state').select('*').single()
    ]);

    if (userResult.error || !userResult.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (globalStateResult.error || !globalStateResult.data) {
      return NextResponse.json({ error: 'Global state error' }, { status: 500 });
    }

    const user = userResult.data;
    const globalState = globalStateResult.data;

    // Check if user has enough credits
    if (user.credits < betAmount) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Generate the result grid
    const resultGrid = generateSlotResult();
    const isWin = checkWin(resultGrid);
    
    let potAmountWon = 0;
    let newPotAmount = globalState.pot_total_cents;
    
    if (isWin) {
      potAmountWon = globalState.pot_total_cents;
      newPotAmount = 0;
    } else {
      // Add bet amount to pot (each credit = $0.25 = 25 cents)
      newPotAmount = globalState.pot_total_cents + (betAmount * 25);
    }

    // Update user credits
    const newCredits = user.credits - betAmount;
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId);

    if (updateUserError) {
      return NextResponse.json({ error: 'Failed to update user credits' }, { status: 500 });
    }

    // Update global pot
    const { error: updatePotError } = await supabase
      .from('global_state')
      .update({ pot_total_cents: newPotAmount })
      .eq('id', 1);

    if (updatePotError) {
      return NextResponse.json({ error: 'Failed to update pot' }, { status: 500 });
    }

    // Create spin record
    const { data: spin, error: spinError } = await supabase
      .from('spins')
      .insert({
        user_id: userId,
        bet_amount: betAmount,
        result_grid: resultGrid,
        won: isWin,
        pot_amount_won: potAmountWon,
        charity_id: isWin ? user.selected_charity_id : null
      })
      .select()
      .single();

    if (spinError) {
      return NextResponse.json({ error: 'Failed to record spin' }, { status: 500 });
    }

    // If won, create donation record
    if (isWin && user.selected_charity_id) {
      await supabase
        .from('donations')
        .insert({
          user_id: userId,
          charity_id: user.selected_charity_id,
          amount_cents: potAmountWon
        });
    }

    return NextResponse.json({
      spin,
      newCredits,
      newPotAmount
    });
  } catch (error) {
    console.error('Spin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateSlotResult(): string[][] {
  const grid: string[][] = [];
  
  // Base win chance
  const baseWinChance = 0.05; // 5% base chance
  
  // Decide if this will be a winning spin
  const willWin = Math.random() < baseWinChance;
  
  if (willWin) {
    // Generate a winning pattern
    const pattern = Math.floor(Math.random() * 4);
    const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    // Initialize with random symbols
    for (let i = 0; i < 5; i++) {
      grid[i] = [];
      for (let j = 0; j < 5; j++) {
        grid[i][j] = getRandomSymbol();
      }
    }
    
    // Apply winning pattern
    if (pattern === 0) {
      // Horizontal line
      const row = Math.floor(Math.random() * 5);
      for (let col = 0; col < 5; col++) {
        grid[row][col] = winSymbol;
      }
    } else if (pattern === 1) {
      // Vertical line
      const col = Math.floor(Math.random() * 5);
      for (let row = 0; row < 5; row++) {
        grid[row][col] = winSymbol;
      }
    } else if (pattern === 2) {
      // Diagonal top-left to bottom-right
      for (let i = 0; i < 5; i++) {
        grid[i][i] = winSymbol;
      }
    } else {
      // Diagonal top-right to bottom-left
      for (let i = 0; i < 5; i++) {
        grid[i][4 - i] = winSymbol;
      }
    }
    
    // Add some wild symbols randomly (but not on the winning line)
    const wildCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < wildCount; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * 5);
        col = Math.floor(Math.random() * 5);
      } while (grid[row][col] === winSymbol);
      grid[row][col] = wildSymbol;
    }
  } else {
    // Generate a non-winning grid
    for (let i = 0; i < 5; i++) {
      grid[i] = [];
      for (let j = 0; j < 5; j++) {
        grid[i][j] = getRandomSymbol();
      }
    }
    
    // Ensure no accidental wins
    // This is a simplified check - in production you'd want more thorough validation
    ensureNoWins(grid);
  }
  
  return grid;
}

function getRandomSymbol(): string {
  // 20% chance for wild symbol
  if (Math.random() < 0.2) {
    return wildSymbol;
  }
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function checkWin(grid: string[][]): boolean {
  // Check horizontal lines
  for (let row = 0; row < 5; row++) {
    if (checkLine(grid[row])) return true;
  }
  
  // Check vertical lines
  for (let col = 0; col < 5; col++) {
    const line = [grid[0][col], grid[1][col], grid[2][col], grid[3][col], grid[4][col]];
    if (checkLine(line)) return true;
  }
  
  // Check diagonals
  const diag1 = [grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]];
  const diag2 = [grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]];
  
  return checkLine(diag1) || checkLine(diag2);
}

function checkLine(line: string[]): boolean {
  const firstSymbol = line[0];
  if (firstSymbol === wildSymbol) return false; // Can't win with all wilds
  
  return line.every(symbol => symbol === firstSymbol || symbol === wildSymbol);
}

function ensureNoWins(grid: string[][]): void {
  // Check and break any accidental winning patterns
  // This is a simplified version - you might want more sophisticated logic
  
  // Check rows
  for (let row = 0; row < 5; row++) {
    if (checkLine(grid[row])) {
      // Change one symbol to break the pattern
      const col = Math.floor(Math.random() * 5);
      let newSymbol;
      do {
        newSymbol = getRandomSymbol();
      } while (newSymbol === grid[row][0] || newSymbol === wildSymbol);
      grid[row][col] = newSymbol;
    }
  }
  
  // Similar checks for columns and diagonals would go here
} 