/* ============================================
   MODERN BINGO GAME - JAVASCRIPT
   Fast Game Logic with 4-Second Reveal Animation
   ============================================ */

// ============================================
// 1. GAME STATE & CONFIGURATION
// ============================================
const gameState = {
    selectedNumbers: new Set(),
    numCards: 1,
    betAmount: 25,
    gameInProgress: false,
    bingoCards: [],
    calledNumbers: new Set(),
    gameResult: null,
    gameStartTime: null,
    currentScreen: 'selectionScreen'
};

const GAME_CONFIG = {
    TOTAL_NUMBERS: 75,
    CARD_SIZE: 5,
    ANIMATION_DURATION: 4000, // 4 seconds
    BINGO_COLUMNS: {
        B: { min: 1, max: 15 },
        I: { min: 16, max: 30 },
        N: { min: 31, max: 45 },
        G: { min: 46, max: 60 },
        O: { min: 61, max: 75 }
    }
};

// ============================================
// 2. DOM ELEMENTS
// ============================================
const elements = {
    // Screens
    selectionScreen: document.getElementById('selectionScreen'),
    gameScreen: document.getElementById('gameScreen'),
    resultAnimationScreen: document.getElementById('resultAnimationScreen'),
    resultScreen: document.getElementById('resultScreen'),
    loadingOverlay: document.getElementById('loadingOverlay'),

    // Selection Screen
    numberGrid: document.getElementById('numberGrid'),
    selectedCount: document.getElementById('selectedCount'),
    clearBtn: document.getElementById('clearBtn'),
    numCards: document.getElementById('numCards'),
    betAmount: document.getElementById('betAmount'),
    summaryCards: document.getElementById('summaryCards'),
    summaryBet: document.getElementById('summaryBet'),
    selectedNumbersList: document.getElementById('selectedNumbersList'),
    playBtn: document.getElementById('playBtn'),
    
    // Game Screen
    bingoBoard: document.getElementById('bingoBoard'),
    calledNumbersList: document.getElementById('calledNumbersList'),
    numbersCalledCount: document.getElementById('numbersCalledCount'),
    activeCardsCount: document.getElementById('activeCardsCount'),
    gameTimer: document.getElementById('gameTimer'),
    gameModeDisplay: document.getElementById('gameModeDisplay'),
    pauseBtn: document.getElementById('pauseBtn'),
    quitBtn: document.getElementById('quitBtn'),

    // Animation & Result
    balloonAnimation: document.getElementById('balloonAnimation'),
    resultPopup: document.getElementById('resultPopup'),
    progressFill: document.getElementById('progressFill')
};

// ============================================
// 3. INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
});

function initializeGame() {
    generateNumberGrid();
    updateSummary();
}

function setupEventListeners() {
    // Number selection
    elements.clearBtn.addEventListener('click', clearAllNumbers);
    
    // Card and bet configuration
    elements.numCards.addEventListener('change', (e) => {
        gameState.numCards = parseInt(e.target.value);
        updateSummary();
    });

    elements.betAmount.addEventListener('change', (e) => {
        gameState.betAmount = parseInt(e.target.value) || 25;
        updateSummary();
    });

    // Quick bet buttons
    document.querySelectorAll('.btn-amount').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const value = e.target.dataset.value;
            gameState.betAmount = parseInt(value);
            elements.betAmount.value = value;
            updateSummary();
            updateAmountButtons();
        });
    });

    // Play button
    elements.playBtn.addEventListener('click', startGame);

    // Game controls
    elements.pauseBtn.addEventListener('click', pauseGame);
    elements.quitBtn.addEventListener('click', quitGame);
}

// ============================================
// 4. NUMBER GRID GENERATION
// ============================================
function generateNumberGrid() {
    const grid = elements.numberGrid;
    grid.innerHTML = '';

    for (let i = 1; i <= GAME_CONFIG.TOTAL_NUMBERS; i++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.textContent = i;
        btn.dataset.number = i;

        btn.addEventListener('click', () => toggleNumber(i, btn));
        grid.appendChild(btn);
    }
}

function toggleNumber(number, btnElement) {
    if (gameState.selectedNumbers.has(number)) {
        gameState.selectedNumbers.delete(number);
        btnElement.classList.remove('selected');
    } else {
        gameState.selectedNumbers.add(number);
        btnElement.classList.add('selected');
    }

    updateSelectedNumbersList();
    updateSelectedCount();
    updatePlayButtonState();
}

function clearAllNumbers() {
    gameState.selectedNumbers.clear();
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    updateSelectedNumbersList();
    updateSelectedCount();
    updatePlayButtonState();
}

function updateSelectedCount() {
    elements.selectedCount.textContent = `Selected: ${gameState.selectedNumbers.size} numbers`;
}

function updateSelectedNumbersList() {
    const list = elements.selectedNumbersList;
    
    if (gameState.selectedNumbers.size === 0) {
        list.innerHTML = '<p class="empty-state">No numbers selected yet</p>';
        return;
    }

    const sortedNumbers = Array.from(gameState.selectedNumbers).sort((a, b) => a - b);
    list.innerHTML = sortedNumbers
        .map(num => `<span class="selected-number-tag">${num}</span>`)
        .join('');
}

function updateSummary() {
    elements.summaryCards.textContent = gameState.numCards;
    elements.summaryBet.textContent = `$${gameState.betAmount * gameState.numCards}`;
}

function updateAmountButtons() {
    document.querySelectorAll('.btn-amount').forEach(btn => {
        const value = parseInt(btn.dataset.value);
        btn.classList.toggle('active', value === gameState.betAmount);
    });
}

function updatePlayButtonState() {
    const hasSelection = gameState.selectedNumbers.size > 0;
    elements.playBtn.disabled = !hasSelection;
    if (!hasSelection) {
        elements.playBtn.style.opacity = '0.5';
    } else {
        elements.playBtn.style.opacity = '1';
    }
}

// ============================================
// 5. GAME LOGIC - BINGO CARD GENERATION
// ============================================
function generateBingoCards() {
    gameState.bingoCards = [];

    for (let cardNum = 0; cardNum < gameState.numCards; cardNum++) {
        const card = {
            id: cardNum,
            grid: generateSingleCard(),
            markers: Array(GAME_CONFIG.CARD_SIZE)
                .fill(null)
                .map(() => Array(GAME_CONFIG.CARD_SIZE).fill(false))
        };
        gameState.bingoCards.push(card);
    }

    return gameState.bingoCards;
}

function generateSingleCard() {
    const columns = ['B', 'I', 'N', 'G', 'O'];
    const grid = Array(GAME_CONFIG.CARD_SIZE).fill(null).map(() => Array(5));

    columns.forEach((col, colIndex) => {
        const range = GAME_CONFIG.BINGO_COLUMNS[col];
        const numbers = generateRandomNumbers(range.min, range.max, GAME_CONFIG.CARD_SIZE);

        for (let row = 0; row < GAME_CONFIG.CARD_SIZE; row++) {
            if (col === 'N' && row === 2) {
                grid[row][colIndex] = 'FREE'; // Free space in center
            } else {
                grid[row][colIndex] = numbers[row];
            }
        }
    });

    return grid;
}

function generateRandomNumbers(min, max, count) {
    const numbers = [];
    const available = Array.from({ length: max - min + 1 }, (_, i) => min + i);

    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        numbers.push(available[randomIndex]);
        available.splice(randomIndex, 1);
    }

    return numbers;
}

// ============================================
// 6. FAST GAME RESOLUTION LOGIC
// ============================================
function determineGameWinner(cards, selectedNumbers) {
    /**
     * FAST WINNER DETERMINATION:
     * This function simulates a bingo game by:
     * 1. Randomly drawing numbers from the selected numbers
     * 2. Marking cards as numbers are drawn
     * 3. Checking for winning patterns (horizontal, vertical, diagonal)
     * 4. Returns the result immediately
     */

    const cardResults = cards.map(card => ({
        card: card,
        winningPattern: null,
        winNumber: null
    }));

    // Simulate the game: draw numbers one by one
    const numbers = Array.from(selectedNumbers).sort(() => Math.random() - 0.5);

    for (let drawnNum of numbers) {
        // Check each card
        for (let cardResult of cardResults) {
            if (cardResult.winningPattern) continue; // Already won

            const card = cardResult.card;

            // Find and mark the number on the card
            for (let row = 0; row < GAME_CONFIG.CARD_SIZE; row++) {
                for (let col = 0; col < GAME_CONFIG.CARD_SIZE; col++) {
                    if (card.grid[row][col] === drawnNum) {
                        card.markers[row][col] = true;
                    }
                    // Mark FREE space automatically
                    if (card.grid[row][col] === 'FREE') {
                        card.markers[row][col] = true;
                    }
                }
            }

            // Check for winning pattern
            const winPattern = checkWinningPattern(card.markers);
            if (winPattern) {
                cardResult.winningPattern = winPattern;
                cardResult.winNumber = drawnNum;
            }
        }

        // Check if any card won
        if (cardResults.some(r => r.winningPattern)) {
            break;
        }
    }

    // Store called numbers for display
    gameState.calledNumbers = new Set(numbers.slice(0, 20)); // Store first 20 called

    // Determine result
    const winnerCard = cardResults.find(r => r.winningPattern);
    
    if (winnerCard) {
        const multiplier = getWinMultiplier(winnerCard.winningPattern, gameState.numCards);
        const totalBet = gameState.betAmount * gameState.numCards;
        const winAmount = totalBet * multiplier;

        return {
            isWin: true,
            pattern: winnerCard.winningPattern,
            cardId: winnerCard.card.id,
            winMultiplier: multiplier,
            winAmount: winAmount,
            totalBet: totalBet,
            cardsPlayed: gameState.numCards
        };
    } else {
        return {
            isWin: false,
            totalBet: gameState.betAmount * gameState.numCards,
            cardsPlayed: gameState.numCards
        };
    }
}

function checkWinningPattern(markers) {
    // Check rows
    for (let row = 0; row < GAME_CONFIG.CARD_SIZE; row++) {
        if (markers[row].every(m => m)) {
            return 'row';
        }
    }

    // Check columns
    for (let col = 0; col < GAME_CONFIG.CARD_SIZE; col++) {
        if (markers.every(row => row[col])) {
            return 'column';
        }
    }

    // Check diagonals
    if (markers.every((row, i) => row[i])) {
        return 'diagonal-left';
    }

    if (markers.every((row, i) => row[GAME_CONFIG.CARD_SIZE - 1 - i])) {
        return 'diagonal-right';
    }

    // Check full card (coverall)
    if (markers.every(row => row.every(m => m))) {
        return 'coverall';
    }

    return null;
}

function getWinMultiplier(pattern, numCards) {
    const baseMultipliers = {
        'row': 2,
        'column': 2,
        'diagonal-left': 3,
        'diagonal-right': 3,
        'coverall': 10
    };

    const baseMultiplier = baseMultipliers[pattern] || 2;
    const cardBonus = 1 + (numCards - 1) * 0.5; // Bonus for multiple cards

    return baseMultiplier * cardBonus;
}

// ============================================
// 7. GAME FLOW CONTROL
// ============================================
function startGame() {
    // Validation
    if (gameState.selectedNumbers.size === 0) {
        alert('Please select at least one number!');
        return;
    }

    showLoading(true);

    // Small delay for UX
    setTimeout(() => {
        // 1. Generate bingo cards
        generateBingoCards();

        // 2. INSTANTLY determine the game result (fast logic)
        gameState.gameResult = determineGameWinner(
            gameState.bingoCards,
            gameState.selectedNumbers
        );

        // 3. Switch to animation screen
        showLoading(false);
        switchScreen('resultAnimationScreen');
        startAnimationSequence();
    }, 500);
}

function startAnimationSequence() {
    /**
     * 4-SECOND ANIMATION SEQUENCE:
     * - Show balloon pop animation
     * - Progress bar fills over 4 seconds
     * - After 4 seconds, show result popup
     */

    // Create balloon animations
    const balloonsContainer = document.querySelector('.balloons-grid');
    balloonsContainer.innerHTML = '';

    for (let i = 0; i < 25; i++) {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.style.background = getRandomBalloonColor();
        balloon.style.animationDelay = `${i * 0.1}s`;
        balloonsContainer.appendChild(balloon);
    }

    // Start progress animation
    elements.progressFill.style.animation = 'none';
    setTimeout(() => {
        elements.progressFill.style.animation = 'progressFill 4s ease-out forwards';
    }, 10);

    // After 4 seconds, show result
    setTimeout(() => {
        switchScreen('resultScreen');
        displayResultPopup();
    }, GAME_CONFIG.ANIMATION_DURATION);
}

function getRandomBalloonColor() {
    const colors = [
        '#4A90E2', // Blue
        '#8B5CF6', // Purple
        '#10B981', // Green
        '#F59E0B', // Orange
        '#EF4444'  // Red
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function displayResultPopup() {
    const result = gameState.gameResult;
    const popup = elements.resultPopup;
    
    if (result.isWin) {
        popup.innerHTML = `
            <div class="result-header">
                <div class="result-icon">🎉</div>
                <h2 class="result-title">CONGRATULATIONS!</h2>
                <p class="result-subtitle">You've won with a ${result.pattern}!</p>
            </div>

            <div class="prize-display">
                <div class="prize-label">YOUR WINNINGS</div>
                <div class="prize-amount">$${result.winAmount.toFixed(2)}</div>
            </div>

            <div class="result-details">
                <div class="result-detail-row">
                    <span class="result-detail-label">Win Pattern:</span>
                    <span class="result-detail-value">${capitalizePattern(result.pattern)}</span>
                </div>
                <div class="result-detail-row">
                    <span class="result-detail-label">Multiplier:</span>
                    <span class="result-detail-value">x${result.winMultiplier.toFixed(1)}</span>
                </div>
                <div class="result-detail-row">
                    <span class="result-detail-label">Total Bet:</span>
                    <span class="result-detail-value">$${result.totalBet.toFixed(2)}</span>
                </div>
                <div class="result-detail-row">
                    <span class="result-detail-label">Cards Played:</span>
                    <span class="result-detail-value">${result.cardsPlayed}</span>
                </div>
            </div>

            <div class="result-actions">
                <button class="btn-primary" onclick="playAgain()">Play Again</button>
                <button class="btn-secondary" onclick="exitToHome()">Home</button>
            </div>
        `;
    } else {
        popup.innerHTML = `
            <div class="result-header">
                <div class="result-icon">😔</div>
                <h2 class="result-title">NO WIN THIS TIME</h2>
                <p class="result-subtitle">Better luck next game!</p>
            </div>

            <div class="prize-display" style="background: linear-gradient(135deg, #6B7280, #9CA3AF);">
                <div class="prize-label">AMOUNT LOST</div>
                <div class="prize-amount">$${result.totalBet.toFixed(2)}</div>
            </div>

            <div class="result-details">
                <div class="result-detail-row">
                    <span class="result-detail-label">Total Bet:</span>
                    <span class="result-detail-value">$${result.totalBet.toFixed(2)}</span>
                </div>
                <div class="result-detail-row">
                    <span class="result-detail-label">Cards Played:</span>
                    <span class="result-detail-value">${result.cardsPlayed}</span>
                </div>
            </div>

            <div class="result-actions">
                <button class="btn-primary" onclick="playAgain()">Try Again</button>
                <button class="btn-secondary" onclick="exitToHome()">Home</button>
            </div>
        `;
    }
}

function capitalizePattern(pattern) {
    return pattern
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================
// 8. GAME CONTROLS
// ============================================
function pauseGame() {
    gameState.gameInProgress = false;
    elements.pauseBtn.textContent = '▶ Resume';
    elements.pauseBtn.onclick = resumeGame;
}

function resumeGame() {
    gameState.gameInProgress = true;
    elements.pauseBtn.textContent = '⏸ Pause';
    elements.pauseBtn.onclick = pauseGame;
}

function quitGame() {
    if (confirm('Are you sure you want to quit?')) {
        exitToHome();
    }
}

function playAgain() {
    // Reset game state
    gameState.selectedNumbers.clear();
    gameState.bingoCards = [];
    gameState.calledNumbers.clear();
    gameState.gameResult = null;

    // Clear UI
    clearAllNumbers();
    
    // Return to selection screen
    switchScreen('selectionScreen');
}

function exitToHome() {
    // Full reset
    gameState.selectedNumbers.clear();
    gameState.bingoCards = [];
    gameState.calledNumbers.clear();
    gameState.gameResult = null;
    gameState.gameInProgress = false;

    // Clear UI
    clearAllNumbers();
    generateNumberGrid();
    
    // Return to selection screen
    switchScreen('selectionScreen');
}

// ============================================
// 9. SCREEN NAVIGATION
// ============================================
function switchScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenName);
    if (targetScreen) {
        targetScreen.classList.add('active');
        gameState.currentScreen = screenName;
    }
}

function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

// ============================================
// 10. TIMER
// ============================================
function startTimer() {
    gameState.gameStartTime = Date.now();

    setInterval(() => {
        if (gameState.gameInProgress) {
            const elapsed = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            elements.gameTimer.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 100);
}

// =================================