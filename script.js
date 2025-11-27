/* ========================================
   REAL-TIME CURRENCY EXCHANGE SYSTEM
   JAVASCRIPT FILE
   ======================================== */

// =============== DOM ELEMENTS SELECTION ===============
// Currency and Amount Elements
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const amount = document.getElementById('amount');

// Button Elements
const swapBtn = document.getElementById('swapBtn');
const clearBtn = document.getElementById('clearBtn');
const toggleAutoUpdate = document.getElementById('toggleAutoUpdate');
const aboutBtn = document.getElementById('aboutBtn');
const closeAboutBtn = document.getElementById('closeAboutBtn');
const closeAboutBtn2 = document.getElementById('closeAboutBtn2');

// Result Display Elements
const resultContainer = document.getElementById('resultContainer');
const resultAmount = document.getElementById('resultAmount');
const exchangeRate = document.getElementById('exchangeRate');
const realtimeStatus = document.getElementById('realtimeStatus');

// Status and Update Elements
const lastUpdated = document.getElementById('lastUpdated');
const statusDot = document.getElementById('statusDot');
const spinner = document.getElementById('spinner');
const updateInterval = document.getElementById('updateInterval');

// History Elements
const historyList = document.getElementById('historyList');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const amountError = document.getElementById('amountError');

// Modal Elements
const aboutModal = document.getElementById('aboutModal');
const modalOverlay = document.getElementById('modalOverlay');

// =============== GLOBAL CONFIGURATION ===============
/**
 * API Configuration
 * Using exchangerate-api.com for real-time currency rates
 * Free tier provides updates for multiple currencies
 */
const API_URL = 'https://api.exchangerate-api.com/v4/latest/';

/**
 * Update Frequency in milliseconds
 * 5000ms = 5 seconds for real-time updates
 */
const UPDATE_FREQUENCY = 5000;

// =============== GLOBAL STATE VARIABLES ===============
/**
 * Stores the interval ID for clearing the auto-update timer
 * Used to prevent memory leaks and manage updates
 */
let updateIntervalId = null;

/**
 * Flag to track if automatic real-time updates are enabled
 * User can toggle this on/off using the toggle button
 */
let autoUpdateEnabled = true;

/**
 * Cache object storing exchange rates for quick access
 * Prevents excessive API calls
 * Format: { 'EUR': 0.92, 'GBP': 0.79, ... }
 */
let ratesCache = {};

/**
 * Timestamp of the last successful rate fetch
 * Used to display "last updated X seconds ago" in status bar
 */
let lastUpdateTime = null;

// =============== INITIALIZATION ===============
/**
 * DOMContentLoaded Event Handler
 * Fires when entire HTML document is loaded
 * Initializes all app functionality
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Application Initialized');
    loadHistory(); // Load previous conversions from localStorage
    setupEventListeners(); // Attach all event handlers
    fetchRatesOnce(); // Fetch rates immediately on startup
    startAutoUpdate(); // Start automatic real-time updates
});

// =============== EVENT LISTENERS SETUP ===============
/**
 * Sets up all event listeners for interactive elements
 * Handles clicks, changes, and keyboard input
 */
function setupEventListeners() {
    // Currency Swap Button
    swapBtn.addEventListener('click', swapCurrencies);

    // Clear Form Button
    clearBtn.addEventListener('click', clearForm);

    // Delete All History Button
    deleteAllBtn.addEventListener('click', deleteAllHistory);

    // Toggle Auto-Update Button
    toggleAutoUpdate.addEventListener('click', toggleAutoUpdateMode);

    // About Modal Buttons
    aboutBtn.addEventListener('click', openAboutModal);
    closeAboutBtn.addEventListener('click', closeAboutModal);
    closeAboutBtn2.addEventListener('click', closeAboutModal);
    modalOverlay.addEventListener('click', closeAboutModal);

    // Close Modal with Escape Key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && aboutModal.classList.contains('show')) {
            closeAboutModal();
        }
    });

    // Amount Input Events
    amount.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') performConversion();
    });

    amount.addEventListener('input', () => {
        amountError.classList.remove('show');

        // Auto-convert if valid amount entered
        if (isValidAmount()) {
            performConversion();
        }
    });

    // Currency Selection Changes
    fromCurrency.addEventListener('change', () => {
        if (isValidAmount()) {
            performConversion();
        }
    });

    toCurrency.addEventListener('change', () => {
        if (isValidAmount()) {
            performConversion();
        }
    });
}

// =============== VALIDATION FUNCTIONS ===============
/**
 * Checks if the amount input is valid
 * Returns true if amount is a positive number
 * @returns {boolean} True if valid, false otherwise
 */
function isValidAmount() {
    return amount.value && !isNaN(parseFloat(amount.value)) && parseFloat(amount.value) > 0;
}

/**
 * Validates the amount input with comprehensive checks
 * Displays appropriate error messages
 * @returns {boolean} True if input is valid, false otherwise
 */
function validateInput() {
    const amountValue = parseFloat(amount.value);

    // Check if field is empty
    if (amount.value.trim() === '') {
        showError('Please enter an amount');
        return false;
    }

    // Check if value is a number
    if (isNaN(amountValue)) {
        showError('Please enter a valid number');
        return false;
    }

    // Check if amount is positive
    if (amountValue <= 0) {
        showError('Amount must be greater than 0');
        return false;
    }

    return true;
}

/**
 * Displays error message below amount input
 * Includes shake animation for user attention
 * @param {string} message - Error message to display
 */
function showError(message) {
    amountError.textContent = message;
    amountError.classList.add('show');
}

// =============== API FUNCTIONS ===============
/**
 * Fetches latest exchange rates from API
 * Stores rates in cache for quick access
 * Called automatically every 5 seconds
 * Handles errors gracefully
 */
async function fetchRatesOnce() {
    try {
        const fromCurr = fromCurrency.value;

        // Fetch rates for selected 'from' currency
        const response = await fetch(`${API_URL}${fromCurr}`);

        // Check if response is successful
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }

        // Parse JSON response
        const data = await response.json();

        // Store rates in cache
        ratesCache = data.rates;

        // Update last update timestamp
        lastUpdateTime = new Date();

        // Update UI timestamp
        updateStatus();

        console.log('✅ Rates updated successfully');

    } catch (error) {
        console.error('❌ Fetch error:', error);
        showError('Failed to fetch rates. Please check your internet connection.');
    }
}

// =============== REAL-TIME UPDATE SYSTEM ===============
/**
 * Starts the automatic real-time update system
 * Fetches rates immediately, then every UPDATE_FREQUENCY milliseconds
 * Status dot pulses during updates for visual feedback
 */
function startAutoUpdate() {
    // Clear any existing interval to prevent duplicates
    if (updateIntervalId) clearInterval(updateIntervalId);

    // Fetch rates immediately on startup
    fetchRatesOnce();

    // Set up interval for automatic updates
    updateIntervalId = setInterval(() => {
        if (autoUpdateEnabled) {
            // Add pulsing animation to status dot
            statusDot.classList.add('updating');

            // Fetch new rates
            fetchRatesOnce();

            // Remove pulsing animation after 1 second
            setTimeout(() => {
                statusDot.classList.remove('updating');
            }, 1000);

            // Auto-convert if amount is entered
            if (isValidAmount()) {
                performConversion();
            }
        }
    }, UPDATE_FREQUENCY);
}

/**
 * Updates the "Last updated" text in status bar
 * Shows time in seconds or minutes since last update
 * Called every second to keep display current
 */
function updateStatus() {
    if (lastUpdateTime) {
        const now = new Date();
        const diffSeconds = Math.floor((now - lastUpdateTime) / 1000);

        // Display in seconds if less than 60 seconds
        if (diffSeconds < 60) {
            lastUpdated.textContent = `Last updated: ${diffSeconds}s ago`;
        } else {
            // Display in minutes if 60 seconds or more
            const diffMinutes = Math.floor(diffSeconds / 60);
            lastUpdated.textContent = `Last updated: ${diffMinutes}m ago`;
        }
    }
}

/**
 * Updates status display every 1 second
 * Keeps "Last updated" time accurate without API calls
 */
setInterval(updateStatus, 1000);

// =============== CONVERSION FUNCTIONS ===============
/**
 * Main conversion function
 * Validates input, uses cached rates, displays result
 * Called when user types amount, changes currency, or manually converts
 */
function performConversion() {
    // Validate input first
    if (!validateInput()) return;

    const fromCurr = fromCurrency.value;
    const toCurr = toCurrency.value;
    const amt = parseFloat(amount.value);

    try {
        // Get exchange rate from cache
        const rate = ratesCache[toCurr];

        // Check if rate is available
        if (!rate) {
            throw new Error('Exchange rate not available');
        }

        // Calculate converted amount
        const converted = (amt * rate).toFixed(2);

        // Display the result
        displayResult(converted, rate, fromCurr, toCurr, amt);

        // Add to history
        addToHistory(fromCurr, toCurr, amt, converted);

    } catch (error) {
        console.error('❌ Conversion error:', error);
        showError('Conversion failed. Please try again.');
    }
}

/**
 * Updates the result display with converted amount and exchange rate
 * Shows result container with fade-in animation
 * @param {number} converted - The converted amount
 * @param {number} rate - The exchange rate used
 * @param {string} fromCurr - Source currency code
 * @param {string} toCurr - Destination currency code
 * @param {number} amt - Original amount
 */
function displayResult(converted, rate, fromCurr, toCurr, amt) {
    // Display converted amount
    resultAmount.textContent = converted;

    // Display exchange rate (1 fromCurr = ? toCurr)
    exchangeRate.textContent = `1 ${fromCurr} = ${rate.toFixed(4)} ${toCurr}`;

    // Show real-time status
    realtimeStatus.textContent = '🟢 Real-time (Updated)';

    // Show result container with animation
    resultContainer.classList.add('show');
}

// =============== HISTORY FUNCTIONS ===============
/**
 * Stores conversion in localStorage (browser storage)
 * Keeps only last 50 conversions to manage storage
 * Prevents duplicate consecutive entries
 * @param {string} fromCurr - Source currency code
 * @param {string} toCurr - Destination currency code
 * @param {number} amt - Original amount
 * @param {number} converted - Converted amount
 */
function addToHistory(fromCurr, toCurr, amt, converted) {
    // Get existing history from localStorage
    let history = JSON.parse(localStorage.getItem('conversionHistory')) || [];

    // Get most recent entry to check for duplicates
    const lastEntry = history[0];

    // Skip if duplicate of last entry
    if (lastEntry && lastEntry.fromCurr === fromCurr && lastEntry.toCurr === toCurr &&
        lastEntry.amount === amt && lastEntry.converted === converted) {
        return;
    }

    // Create new history entry with unique timestamp ID
    const entry = {
        id: Date.now(), // Unique ID using timestamp
        fromCurr,
        toCurr,
        amount: amt,
        converted,
        timestamp: new Date().toLocaleString() // Human-readable date/time
    };

    // Add new entry to beginning of array
    history.unshift(entry);

    // Keep only last 50 entries
    if (history.length > 50) {
        history = history.slice(0, 50);
    }

    // Save to localStorage
    localStorage.setItem('conversionHistory', JSON.stringify(history));

    // Update history display
    loadHistory();
}

/**
 * Retrieves and displays conversion history from localStorage
 * Creates HTML elements for each history item dynamically
 * Shows "No conversions yet" if history is empty
 */
function loadHistory() {
    // Get history from localStorage or empty array
    const history = JSON.parse(localStorage.getItem('conversionHistory')) || [];

    // Clear history list
    historyList.innerHTML = '';

    // Show message if no history
    if (history.length === 0) {
        historyList.textContent = 'No conversions yet';
        deleteAllBtn.style.display = 'none';
        return;
    }

    // Show delete all button
    deleteAllBtn.style.display = 'block';

    // Create HTML for each history entry
    history.forEach((entry) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        historyItem.innerHTML = `
            <div class="history-text">
                <strong>${entry.amount} ${entry.fromCurr}</strong> → <strong>${entry.converted} ${entry.toCurr}</strong>
                <br>
                <small style="color: #999;">${entry.timestamp}</small>
            </div>
            <button class="delete-history-btn" onclick="deleteHistoryItem(${entry.id})">Delete</button>
        `;

        historyList.appendChild(historyItem);
    });
}

/**
 * Deletes a specific history entry by its ID
 * Updates localStorage and refreshes display
 * @param {number} id - Unique ID (timestamp) of entry to delete
 */
function deleteHistoryItem(id) {
    // Get current history
    let history = JSON.parse(localStorage.getItem('conversionHistory')) || [];

    // Filter out entry with matching ID
    history = history.filter(entry => entry.id !== id);

    // Save updated history
    localStorage.setItem('conversionHistory', JSON.stringify(history));

    // Refresh display
    loadHistory();
}

/**
 * Deletes all conversion history after user confirmation
 * Requires confirmation to prevent accidental deletion
 */
function deleteAllHistory() {
    // Ask for confirmation
    if (confirm('Are you sure you want to delete all history? This action cannot be undone.')) {
        // Remove history from localStorage
        localStorage.removeItem('conversionHistory');

        // Refresh display
        loadHistory();
    }
}

// =============== FORM FUNCTIONS ===============
/**
 * Clears all form fields and hides results/errors
 * Focuses cursor on amount input for convenience
 */
function clearForm() {
    // Clear amount input
    amount.value = '';

    // Hide result container
    resultContainer.classList.remove('show');

    // Hide error messages
    amountError.classList.remove('show');

    // Focus on amount input
    amount.focus();
}

/**
 * Swaps the 'from' and 'to' currencies
 * Updates cached rates for new 'from' currency
 * Auto-converts with swapped currencies if amount entered
 */
function swapCurrencies() {
    // Store 'from' currency temporarily
    const temp = fromCurrency.value;

    // Set 'from' to old 'to' currency
    fromCurrency.value = toCurrency.value;

    // Set 'to' to old 'from' currency
    toCurrency.value = temp;

    // Fetch rates for new 'from' currency
    fetchRatesOnce();

    // Auto-convert with swapped currencies
    if (isValidAmount()) {
        performConversion();
    }
}

/**
 * Toggles automatic real-time updates on and off
 * Updates button text and color to reflect state
 * Restarts update interval when turning on
 */
function toggleAutoUpdateMode() {
    // Toggle the flag
    autoUpdateEnabled = !autoUpdateEnabled;

    // Update button text
    toggleAutoUpdate.textContent = autoUpdateEnabled ? 'Auto-Update: ON' : 'Auto-Update: OFF';

    // Update button styling (green when on, blue when off)
    toggleAutoUpdate.classList.toggle('active', autoUpdateEnabled);

    // Restart updates if turning on
    if (autoUpdateEnabled) {
        startAutoUpdate();
    }
}

// =============== MODAL FUNCTIONS ===============
/**
 * Opens the About modal with animation
 * Displays project information and creators
 * Prevents page scrolling when modal is open
 */
function openAboutModal() {
    aboutModal.classList.add('show');
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent page scrolling
}

/**
 * Closes the About modal with animation
 * Restores normal page scrolling
 */
function closeAboutModal() {
    aboutModal.classList.remove('show');
    modalOverlay.classList.remove('show');
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// =============== CLEANUP FUNCTIONS ===============
/**
 * Cleanup function on page unload
 * Prevents memory leaks by clearing intervals
 */
window.addEventListener('beforeunload', () => {
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
    }
});

console.log('📊 Currency Exchange System Loaded Successfully');