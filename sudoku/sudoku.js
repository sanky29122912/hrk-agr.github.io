// Sudoku Game Logic
class SudokuGame {
    constructor() {
        this.board = Array(81).fill(0);
        this.solution = Array(81).fill(0);
        this.givenCells = new Set();
        this.selectedCell = null;
        this.history = [];
        this.errors = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.difficulty = 'medium';
        this.hintUsed = new Set();
    }

    // Generate a valid Sudoku puzzle
    generatePuzzle(difficulty = 'medium') {
        this.board = Array(81).fill(0);
        this.solution = Array(81).fill(0);
        this.givenCells.clear();
        this.history = [];
        this.errors = 0;
        this.hintUsed.clear();
        this.difficulty = difficulty;

        // Generate a complete solution
        this.fillBoard();
        
        // Copy solution
        this.solution = [...this.board];

        // Remove numbers based on difficulty
        const cellsToRemove = {
            'easy': 30,
            'medium': 40,
            'hard': 50
        }[difficulty] || 40;

        const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < cellsToRemove && i < cells.length; i++) {
            const idx = cells[i];
            this.board[idx] = 0;
        }

        // Mark given cells
        for (let i = 0; i < 81; i++) {
            if (this.board[i] !== 0) {
                this.givenCells.add(i);
            }
        }

        this.startTimer();
    }

    // Fill the board with a valid solution using backtracking
    fillBoard() {
        for (let i = 0; i < 81; i++) {
            if (this.board[i] === 0) {
                const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                
                for (let num of nums) {
                    if (this.isValid(i, num)) {
                        this.board[i] = num;
                        if (this.fillBoard()) {
                            return true;
                        }
                        this.board[i] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }

    // Check if a number is valid at a position
    isValid(index, num) {
        const row = Math.floor(index / 9);
        const col = index % 9;

        // Check row
        for (let i = 0; i < 9; i++) {
            if (this.board[row * 9 + i] === num) return false;
        }

        // Check column
        for (let i = 0; i < 9; i++) {
            if (this.board[i * 9 + col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (this.board[r * 9 + c] === num) return false;
            }
        }

        return true;
    }

    // Shuffle array
    shuffleArray(arr) {
        const newArr = [...arr];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    }

    // Place a number in a cell
    placeNumber(index, num) {
        if (this.givenCells.has(index)) return false;

        const oldValue = this.board[index];
        this.board[index] = num;

        // Save to history
        this.history.push({ index, oldValue, newValue: num });

        // Check if it's wrong
        if (num !== 0 && num !== this.solution[index]) {
            this.errors++;
            updateUI();
            return false;
        }

        updateUI();
        return true;
    }

    // Undo last move
    undo() {
        if (this.history.length === 0) return;

        const lastMove = this.history.pop();
        this.board[lastMove.index] = lastMove.oldValue;
        
        // Recalculate errors
        this.errors = 0;
        for (let i = 0; i < 81; i++) {
            if (this.board[i] !== 0 && this.board[i] !== this.solution[i]) {
                this.errors++;
            }
        }

        updateUI();
    }

    // Get a hint
    getHint() {
        const emptyCells = [];
        for (let i = 0; i < 81; i++) {
            if (this.board[i] === 0 && !this.hintUsed.has(i)) {
                emptyCells.push(i);
            }
        }

        if (emptyCells.length === 0) return null;

        const hintCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.hintUsed.add(hintCell);
        return { index: hintCell, value: this.solution[hintCell] };
    }

    // Check if puzzle is solved
    isSolved() {
        for (let i = 0; i < 81; i++) {
            if (this.board[i] !== this.solution[i]) return false;
        }
        return true;
    }

    // Get completed cells count
    getCompletedCount() {
        let count = 0;
        for (let i = 0; i < 81; i++) {
            if (this.board[i] !== 0) count++;
        }
        return count;
    }

    // Start timer
    startTimer() {
        this.startTime = Date.now();
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            updateTimer();
        }, 1000);
    }

    // Stop timer
    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    // Get elapsed time
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

// Global game instance
let game = new SudokuGame();

// Initialize game
function initGame() {
    const difficulty = document.getElementById('difficulty').value;
    game.generatePuzzle(difficulty);
    renderBoard();
    updateUI();
}

// Render the board
function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        if (game.givenCells.has(i)) {
            cell.classList.add('given');
        }

        const value = game.board[i];
        if (value !== 0) {
            cell.textContent = value;
        }

        cell.addEventListener('click', (e) => selectCell(i, e));
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            placeNumber(i, 0);
        });

        boardEl.appendChild(cell);
    }
}

// Select a cell
function selectCell(index, e) {
    if (game.givenCells.has(index)) return;

    game.selectedCell = index;
    updateCellHighlighting();

    // Keyboard input
    document.addEventListener('keydown', handleKeyPress);
}

// Handle keyboard input
function handleKeyPress(e) {
    if (game.selectedCell === null) return;

    if (e.key >= '1' && e.key <= '9') {
        placeNumber(game.selectedCell, parseInt(e.key));
    } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
        placeNumber(game.selectedCell, 0);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleArrowKey(e.key);
    }
}

// Handle arrow keys for navigation
function handleArrowKey(key) {
    let row = Math.floor(game.selectedCell / 9);
    let col = game.selectedCell % 9;

    if (key === 'ArrowUp') row = Math.max(0, row - 1);
    if (key === 'ArrowDown') row = Math.min(8, row + 1);
    if (key === 'ArrowLeft') col = Math.max(0, col - 1);
    if (key === 'ArrowRight') col = Math.min(8, col + 1);

    const newIndex = row * 9 + col;
    game.selectedCell = newIndex;
    updateCellHighlighting();
}

// Place a number
function placeNumber(index, num) {
    game.placeNumber(index, num);
    renderBoard();
    updateCellHighlighting();

    if (game.isSolved()) {
        showMessage('Congratulations! You solved the puzzle!', 'success');
        game.stopTimer();
    }
}

// Update cell highlighting
function updateCellHighlighting() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('selected', 'related', 'error');
    });

    if (game.selectedCell === null) return;

    const selectedCell = document.querySelector(`[data-index="${game.selectedCell}"]`);
    selectedCell.classList.add('selected');

    const row = Math.floor(game.selectedCell / 9);
    const col = game.selectedCell % 9;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    cells.forEach(cell => {
        const cellIndex = parseInt(cell.dataset.index);
        const cellRow = Math.floor(cellIndex / 9);
        const cellCol = cellIndex % 9;

        if (cellRow === row || cellCol === col || 
            (Math.floor(cellRow / 3) === Math.floor(boxRow / 3) && 
             Math.floor(cellCol / 3) === Math.floor(boxCol / 3))) {
            if (cellIndex !== game.selectedCell) {
                cell.classList.add('related');
            }
        }

        // Highlight errors
        if (game.board[cellIndex] !== 0 && game.board[cellIndex] !== game.solution[cellIndex]) {
            cell.classList.add('error');
        }
    });
}

// Update UI
function updateUI() {
    document.getElementById('errors').textContent = game.errors;
    document.getElementById('completed').textContent = `${game.getCompletedCount()}/81`;
    updateTimer();
}

// Update timer display
function updateTimer() {
    const elapsed = game.getElapsedTime();
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// New game
function newGame() {
    if (game.history.length > 0) {
        if (!confirm('Start a new game? Current progress will be lost.')) return;
    }
    initGame();
}

// Undo move
function undoMove() {
    game.undo();
    renderBoard();
    updateCellHighlighting();
}

// Show hint
function showHint() {
    const hint = game.getHint();
    if (hint) {
        placeNumber(hint.index, hint.value);
        game.board[hint.index] = hint.value;
        renderBoard();
        updateCellHighlighting();
        showMessage(`Hint: Cell at row ${Math.floor(hint.index / 9) + 1}, column ${hint.index % 9 + 1} is ${hint.value}`, 'success');
    } else {
        showMessage('No more hints available!', 'error');
    }
}

// Clear board
function clearBoard() {
    if (!confirm('Clear all cells? This cannot be undone.')) return;
    
    for (let i = 0; i < 81; i++) {
        if (!game.givenCells.has(i)) {
            game.board[i] = 0;
        }
    }
    game.history = [];
    game.errors = 0;
    game.hintUsed.clear();
    renderBoard();
    updateUI();
}

// Show message
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    
    setTimeout(() => {
        messageEl.className = 'message';
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initGame();

    document.getElementById('difficulty').addEventListener('change', () => {
        newGame();
    });
});

// Prevent text selection on board
document.addEventListener('selectstart', (e) => {
    if (e.target.closest('.board')) {
        e.preventDefault();
    }
});
