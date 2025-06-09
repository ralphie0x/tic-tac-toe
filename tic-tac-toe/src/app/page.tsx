import { useState, useEffect } from "react";

type Player = "White" | "Black";
type Tile = Player | null;
type Mode = "HumanVsHuman" | "HumanVsAI" | "AIvsAI";
type AIDifficulty = 1 | 2 | 3;

export default function Home() {
  const [board, setBoard] = useState<Tile[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("White");
  const [mode, setMode] = useState<Mode | null>(null);
  const [aiLevels, setAiLevels] = useState<{ white: AIDifficulty; black: AIDifficulty }>({
    white: 1,
    black: 1,
  });
  const [winner, setWinner] = useState<Player | "Draw" | null>(null);

  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diags
  ];

  const checkWinner = (b: Tile[]): Player | "Draw" | null => {
    for (let [a, b1, c] of lines) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    }
    return b.every(tile => tile) ? "Draw" : null;
  };

  const availableMoves = (b: Tile[]) => b.map((v, i) => (v === null ? i : null)).filter(i => i !== null) as number[];

  const makeMove = (index: number) => {
    if (winner || board[index]) return;
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    const next = currentPlayer === "White" ? "Black" : "White";
    setBoard(newBoard);
    setCurrentPlayer(next);
    setWinner(checkWinner(newBoard));
  };

  const aiMove = (difficulty: AIDifficulty, player: Player, b: Tile[]): number => {
    if (difficulty === 1) {
      const moves = availableMoves(b);
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (difficulty === 2) {
      // Try to win
      for (let i of availableMoves(b)) {
        const temp = [...b];
        temp[i] = player;
        if (checkWinner(temp) === player) return i;
      }
      // Block opponent
      const opponent = player === "White" ? "Black" : "White";
      for (let i of availableMoves(b)) {
        const temp = [...b];
        temp[i] = opponent;
        if (checkWinner(temp) === opponent) return i;
      }
      // Random fallback
      return aiMove(1, player, b);
    }

    // Minimax
    const opponent = player === "White" ? "Black" : "White";
    const minimax = (b: Tile[], p: Player): [number, number] => {
      const result = checkWinner(b);
      if (result === player) return [1, -1];
      if (result === opponent) return [-1, -1];
      if (result === "Draw") return [0, -1];

      let bestScore = p === player ? -Infinity : Infinity;
      let move = -1;
      for (let i of availableMoves(b)) {
        const temp = [...b];
        temp[i] = p;
        const [score] = minimax(temp, p === "White" ? "Black" : "White");
        if (p === player) {
          if (score > bestScore) [bestScore, move] = [score, i];
        } else {
          if (score < bestScore) [bestScore, move] = [score, i];
        }
      }
      return [bestScore, move];
    };

    const [, move] = minimax(b, player);
    return move;
  };

  useEffect(() => {
    if (winner || !mode) return;

    const isAI = (p: Player) =>
      (mode === "HumanVsAI" && p === "Black") || mode === "AIvsAI";

    if (isAI(currentPlayer)) {
      const level = aiLevels[currentPlayer.toLowerCase() as "white" | "black"];
      const move = aiMove(level, currentPlayer, board);
      const delay = mode === "AIvsAI" ? 500 : 200;
      setTimeout(() => makeMove(move), delay);
    }
  }, [currentPlayer, board, mode, winner]);

  const handleStart = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("White");
    setWinner(null);
  };

  if (!mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-3xl font-bold">Tic-Tac-Toe</h1>
        <div className="flex gap-4">
          <button onClick={() => setMode("HumanVsHuman")} className="btn">Human vs Human</button>
          <button onClick={() => setMode("HumanVsAI")} className="btn">Human vs AI</button>
          <button onClick={() => setMode("AIvsAI")} className="btn">AI vs AI</button>
        </div>
        {(mode === "HumanVsAI" || mode === "AIvsAI") && (
          <div className="flex flex-col gap-2 mt-4">
            <div>
              <label>White AI Level: </label>
              <select onChange={(e) => setAiLevels({ ...aiLevels, white: Number(e.target.value) as AIDifficulty })}>
                {[1, 2, 3].map(i => <option key={i} value={i}>Level {i}</option>)}
              </select>
            </div>
            <div>
              <label>Black AI Level: </label>
              <select onChange={(e) => setAiLevels({ ...aiLevels, black: Number(e.target.value) as AIDifficulty })}>
                {[1, 2, 3].map(i => <option key={i} value={i}>Level {i}</option>)}
              </select>
            </div>
          </div>
        )}
        <button onClick={handleStart} className="btn mt-4">Start Game</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Tic-Tac-Toe</h1>
      <div className="grid grid-cols-3 gap-2">
        {board.map((tile, i) => (
          <button
            key={i}
            className="w-20 h-20 bg-gray-100 border border-gray-300 text-2xl font-bold"
            onClick={() => {
              if ((mode === "HumanVsHuman") || (mode === "HumanVsAI" && currentPlayer === "White"))
                makeMove(i);
            }}
          >
            {tile === "White" ? "O" : tile === "Black" ? "X" : ""}
          </button>
        ))}
      </div>
      {winner && <p className="text-lg font-medium">
        {winner === "Draw" ? "It's a draw!" : `${winner} wins!`}
      </p>}
      <div className="flex gap-4 mt-4">
        <button onClick={handleStart} className="btn">Restart</button>
        <button onClick={() => setMode(null)} className="btn">Back to Menu</button>
      </div>
    </div>
  );
}

// Tailwind CSS utility class for buttons
const btnStyle = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600";
const style = document.createElement('style');
style.innerHTML = `.btn { ${btnStyle.replace(/;/g, ' !important;')} }`;
if (typeof window !== 'undefined' && !document.getElementById('btn-style')) {
  style.id = 'btn-style';
  document.head.appendChild(style);
}