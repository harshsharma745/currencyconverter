// ============================================
// OOP CONCEPT 1: CLASS DEFINITION
// ============================================

class Currency {
    #code;
    #name;
    #symbol;
    #rateToUSD;

    constructor(code, name, symbol, rateToUSD) {
        this.#code = code;
        this.#name = name;
        this.#symbol = symbol;
        this.#rateToUSD = rateToUSD;
    }

    getCode() {
        return this.#code;
    }

    getName() {
        return this.#name;
    }

    getSymbol() {
        return this.#symbol;
    }

    getRateToUSD() {
        return this.#rateToUSD;
    }

    displayInfo() {
        return `${this.#code} (${this.#name}) - ${this.#symbol}`;
    }
}

// ============================================
// OOP CONCEPT 2: TRANSACTION CLASS
// ============================================

class Transaction {
    constructor(fromCurrency, toCurrency, amount, result, rate, date) {
        this.fromCurrency = fromCurrency;
        this.toCurrency = toCurrency;
        this.amount = amount;
        this.result = result;
        this.rate = rate;
        this.date = date;
    }

    getFormattedTransaction() {
        return `${this.amount} ${this.fromCurrency} → ${this.result.toFixed(2)} ${this.toCurrency} (Rate: ${this.rate.toFixed(4)})`;
    }

    getFormattedDate() {
        return this.date.toLocaleString();
    }
}

// ============================================
// OOP CONCEPT 3: MAIN SYSTEM (COMPOSITION)
// ============================================

class CurrencyExchangeSystem {
    constructor() {
        this.currencies = this.initializeCurrencies();
        this.transactionHistory = [];
    }

    initializeCurrencies() {
        return [
            new Currency('USD', 'US Dollar', '$', 1.0),
            new Currency('EUR', 'Euro', '€', 0.92),
            new Currency('GBP', 'British Pound', '£', 0.79),
            new Currency('INR', 'Indian Rupee', '₹', 83.12),
            new Currency('JPY', 'Japanese Yen', '¥', 149.50),
            new Currency('AUD', 'Australian Dollar', 'A$', 1.53),
            new Currency('CAD', 'Canadian Dollar', 'C$', 1.36),
            new Currency('CHF', 'Swiss Franc', 'Fr', 0.88)
        ];
    }

    findCurrency(code) {
        return this.currencies.find(currency => currency.getCode() === code);
    }

    convertCurrency(amount, fromCode, toCode) {
        const fromCurrency = this.findCurrency(fromCode);
        const toCurrency = this.findCurrency(toCode);

        if (!fromCurrency || !toCurrency) {
            throw new Error('Invalid currency code');
        }

        if (amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        const amountInUSD = amount / fromCurrency.getRateToUSD();
        const result = amountInUSD * toCurrency.getRateToUSD();
        const exchangeRate = toCurrency.getRateToUSD() / fromCurrency.getRateToUSD();

        const transaction = new Transaction(
            fromCode,
            toCode,
            amount,
            result,
            exchangeRate,
            new Date()
        );

        this.addTransaction(transaction);

        return {
            result: result,
            rate: exchangeRate,
            transaction: transaction
        };
    }

    addTransaction(transaction) {
        this.transactionHistory.unshift(transaction);
        if (this.transactionHistory.length > 5) {
            this.transactionHistory.pop();
        }
    }

    getAllCurrencies() {
        return this.currencies;
    }

    getHistory() {
        return this.transactionHistory;
    }
}

// ============================================
// SYSTEM INSTANCE
// ============================================

const exchangeSystem = new CurrencyExchangeSystem();

// ============================================
// UI FUNCTIONS
// ============================================

function performExchange() {
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    try {
        const result = exchangeSystem.convertCurrency(amount, fromCurrency, toCurrency);
        displayResult(result, amount, fromCurrency, toCurrency);
        updateHistory();
    } catch (error) {
        alert(error.message);
    }
}

function displayResult(result, amount, fromCode, toCode) {
    const resultDiv = document.getElementById('result');
    const resultValue = document.getElementById('resultValue');
    const resultDetails = document.getElementById('resultDetails');

    const fromCurrency = exchangeSystem.findCurrency(fromCode);
    const toCurrency = exchangeSystem.findCurrency(toCode);

    resultValue.textContent = `${toCurrency.getSymbol()}${result.result.toFixed(2)}`;
    
    resultDetails.innerHTML = `
        <strong>${amount} ${fromCurrency.displayInfo()}</strong> = 
        <strong>${result.result.toFixed(2)} ${toCurrency.displayInfo()}</strong><br>
        Exchange Rate: 1 ${fromCode} = ${result.rate.toFixed(4)} ${toCode}
    `;

    resultDiv.classList.remove('hidden');
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    const history = exchangeSystem.getHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<p style="color: #999;">No transactions yet</p>';
        return;
    }

    historyList.innerHTML = history.map(transaction => `
        <div class="history-item">
            <strong>${transaction.getFormattedTransaction()}</strong><br>
            <small style="color: #666;">${transaction.getFormattedDate()}</small>
        </div>
    `).join('');
}

function displayRatesTable() {
    const table = document.getElementById('ratesTable');
    const currencies = exchangeSystem.getAllCurrencies();

    let html = `
        <tr>
            <th>Currency</th>
            <th>Code</th>
            <th>Symbol</th>
            <th>Rate to USD</th>
        </tr>
    `;

    currencies.forEach(currency => {
        html += `
            <tr>
                <td>${currency.getName()}</td>
                <td><strong>${currency.getCode()}</strong></td>
                <td>${currency.getSymbol()}</td>
                <td>${currency.getRateToUSD().toFixed(4)}</td>
            </tr>
        `;
    });

    table.innerHTML = html;
}

window.onload = function() {
    displayRatesTable();
    updateHistory();
};
