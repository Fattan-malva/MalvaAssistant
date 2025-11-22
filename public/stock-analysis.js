document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = 'index.html';
});

const startBtn = document.getElementById('start-analysis');
const loader = document.getElementById('loader');
const results = document.getElementById('results');

// Kriteria yang lebih realistis untuk trading
const TRADING_CRITERIA = {
    'MIN_VOLUME_RATIO': 0.8,      // Volume minimal 80% dari average
    'MAX_FROM_ATH': 30,           // Maksimal 30% dari ATH
    'MIN_PRICE': 50,              // Harga minimal Rp 50
    'MAX_PRICE': 50000,           // Harga maksimal Rp 50,000
};

startBtn.addEventListener('click', async () => {
    results.innerHTML = '';
    loader.style.display = 'block';
    startBtn.disabled = true;

    try {
        // Load stock symbols
        addProgress('📥 Loading stock symbols...');
        const response = await fetch('/resources/data.json');
        if (!response.ok) throw new Error(`Failed to load stock symbols: ${response.status}`);
        const text = await response.text();

        if (!text.startsWith('[')) {
            throw new Error('Invalid response - received HTML instead of JSON');
        }

        const stockSymbols = JSON.parse(text);
        const stockDataList = [];
        const batchSize = 10;
        const totalStocks = stockSymbols.length;

        addProgress(`🎯 Screening ${totalStocks} stocks fokus Bandarmology & Momentum...`);

        // Fetch all stocks in batches
        for (let start = 0; start < totalStocks; start += batchSize) {
            const end = Math.min(start + batchSize, totalStocks);
            addProgress(`⏳ Fetching ${start + 1} to ${end} dari ${totalStocks}...`, true);

            const batchPromises = [];
            for (let i = start; i < end; i++) {
                const symbol = stockSymbols[i];
                batchPromises.push(
                    fetch(`https://sniper-ihsg.vercel.app/api/stocks/${symbol.toLowerCase()}`)
                        .then(async apiResp => {
                            if (!apiResp.ok) return null;
                            const text = await apiResp.text();
                            if (!text.startsWith('{')) return null;
                            try {
                                const data = JSON.parse(text);
                                return (data && data.success && data.data) ? data.data : null;
                            } catch (e) {
                                return null;
                            }
                        })
                        .catch(() => null)
                );
            }

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(stockData => {
                if (stockData) stockDataList.push(stockData);
            });

            await new Promise(res => setTimeout(res, 300));
        }

        if (stockDataList.length === 0) {
            addProgress('❌ No stock data could be retrieved.');
            return;
        }

        addProgress(`✅ Retrieved ${stockDataList.length} stocks`);
        addProgress('🔍 Analisis Bandarmology & Momentum Entry...', true);

        // Enhanced scoring dengan fokus trading
        const scoredStocks = stockDataList.map(stock => {
            let score = 0;
            let tradingSignals = [];
            let entryReasons = [];

            const changePercent = parseFloat(stock.changePercent) || 0;
            const volume = parseFloat(stock.volume) || 0;
            const price = parseFloat(stock.price) || 1;
            const dayHigh = parseFloat(stock.dayHigh) || 0;
            const dayLow = parseFloat(stock.dayLow) || 0;
            const open = parseFloat(stock.open) || 0;
            const fiftyTwoWeekHigh = parseFloat(stock.fiftyTwoWeekHigh) || 0;
            const fiftyTwoWeekLow = parseFloat(stock.fiftyTwoWeekLow) || 0;
            const averageVolume = parseFloat(stock.fullData?.averageDailyVolume3Month) || volume;

            // Data fundamental tambahan
            const marketCap = parseFloat(stock.marketCap) || 0;
            const peRatio = parseFloat(stock.fullData?.trailingPE) || 0;
            const pbv = parseFloat(stock.fullData?.priceToBook) || 0;
            const dividendYield = parseFloat(stock.fullData?.dividendYield) || 0;

            // FILTER DASAR: Skip saham tidak memenuhi kriteria dasar
            if (price < TRADING_CRITERIA.MIN_PRICE || price > TRADING_CRITERIA.MAX_PRICE) {
                return { ...stock, score: 0, filtered: true };
            }

            // ========== BANDARMOLOGY ANALYSIS ==========

            // 1. VOLUME ANALYSIS (Indikator Bandar)
            const volumeRatio = averageVolume > 0 ? volume / averageVolume : 1;

            if (volumeRatio > 3) {
                score += 35;
                tradingSignals.push(`VOLUME SPIKES 3x++ 🚀`);
                entryReasons.push(`Bandar masuk massive, volume ${volumeRatio.toFixed(1)}x rata2`);
            } else if (volumeRatio > 2) {
                score += 25;
                tradingSignals.push(`Volume 2x+ 📈`);
                entryReasons.push(`Aksi bandar terdeteksi, volume ${volumeRatio.toFixed(1)}x`);
            } else if (volumeRatio > 1.2) {
                score += 15;
                tradingSignals.push(`Volume tinggi`);
                entryReasons.push(`Liquidity bagus, volume ${volumeRatio.toFixed(1)}x`);
            }

            // 2. PRICE MOMENTUM & BREAKOUT
            if (changePercent > 7) {
                score += 30;
                tradingSignals.push(`BREAKOUT STRONG 💥`);
                entryReasons.push(`Momentum kuat +${changePercent.toFixed(2)}% hari ini`);
            } else if (changePercent > 3) {
                score += 20;
                tradingSignals.push(`Uptrend ↗️`);
                entryReasons.push(`Trend naik +${changePercent.toFixed(2)}%`);
            } else if (changePercent > 0) {
                score += 10;
                tradingSignals.push(`Positive`);
                entryReasons.push(`Masih hijau +${changePercent.toFixed(2)}%`);
            } else if (changePercent >= -2) {
                score += 5;
                tradingSignals.push(`Consolidation`);
                entryReasons.push(`Konsolidasi ${changePercent.toFixed(2)}%`);
            }

            // 3. SUPPORT/RESISTANCE BREAKOUT
            if (dayHigh > 0 && dayLow > 0) {
                const isBreakout = price > open && (price - open) / open > 0.02; // Break 2% dari open
                const positionInRange = ((price - dayLow) / (dayHigh - dayLow)) * 100;

                if (isBreakout && positionInRange > 70) {
                    score += 25;
                    tradingSignals.push(`BREAKOUT CONFIRMED ✅`);
                    entryReasons.push(`Break resistance, posisi ${positionInRange.toFixed(0)}% dari high`);
                } else if (positionInRange > 60) {
                    score += 15;
                    tradingSignals.push(`Near Resistance`);
                    entryReasons.push(`Mendekati resistance ${positionInRange.toFixed(0)}%`);
                }
            }

            // 4. DISTANCE FROM ATH (Potensi Upside)
            if (fiftyTwoWeekHigh > 0) {
                const distanceFromHigh = ((fiftyTwoWeekHigh - price) / fiftyTwoWeekHigh) * 100;

                if (distanceFromHigh > 40) {
                    score += 20;
                    tradingSignals.push(`POTENTIAL REBOUND 🔄`);
                    entryReasons.push(`Jauh dari ATH -${distanceFromHigh.toFixed(1)}%, upside besar`);
                } else if (distanceFromHigh > 20) {
                    score += 15;
                    tradingSignals.push(`Room to Grow`);
                    entryReasons.push(`Masih -${distanceFromHigh.toFixed(1)}% dari ATH`);
                }
            }

            // 5. FUNDAMENTAL SUPPORT (Backup)
            if (peRatio > 0 && peRatio < 20) {
                score += 10;
                entryReasons.push(`Valuasi menarik PE ${peRatio.toFixed(1)}x`);
            }

            if (dividendYield > 3) {
                score += 10;
                tradingSignals.push(`DIVIDEND 🎁`);
                entryReasons.push(`Dividend yield ${dividendYield.toFixed(1)}%`);
            }

            // 6. MARKET CAP CATEGORY
            if (marketCap > 500000000000) { // > 500B
                score += 10;
                entryReasons.push(`Bluechip stabil`);
            } else if (marketCap > 100000000000) { // > 100B
                score += 15;
                entryReasons.push(`Midcap growth potential`);
            } else {
                score += 5; // Small cap lebih risky
                entryReasons.push(`Smallcap high risk/reward`);
            }

            // 7. CORPORATE ACTION POTENTIAL
            const earningsDate = stock.fullData?.earningsTimestampStart;
            const hasDividend = dividendYield > 0 || stock.fullData?.trailingAnnualDividendRate > 0;

            if (earningsDate && new Date(earningsDate) > new Date()) {
                score += 15;
                tradingSignals.push(`UPCOMING EARNINGS 📊`);
                entryReasons.push(`Ada earnings upcoming, potential catalyst`);
            }

            if (hasDividend) {
                score += 10;
                entryReasons.push(`Ada track record dividend`);
            }

            return {
                ...stock,
                score,
                tradingSignals: tradingSignals.join(' • '),
                entryReasons: entryReasons.join(', '),
                volumeRatio: volumeRatio.toFixed(1),
                distanceFromHigh: fiftyTwoWeekHigh > 0 ? ((fiftyTwoWeekHigh - price) / fiftyTwoWeekHigh * 100).toFixed(1) : 'N/A',
                positionInRange: dayHigh > dayLow ? ((price - dayLow) / (dayHigh - dayLow) * 100).toFixed(1) : 'N/A',
                filtered: false
            };
        });

        // Filter minimal score 40 (lebih longgar) dan volume cukup
        const qualifiedStocks = scoredStocks.filter(stock =>
            !stock.filtered &&
            stock.score >= 40 &&
            parseFloat(stock.volumeRatio) >= TRADING_CRITERIA.MIN_VOLUME_RATIO
        );

        // Sort by score dan ambil top 25
        const topStocks = qualifiedStocks
            .sort((a, b) => b.score - a.score)
            .slice(0, 25);

        addProgress(`✅ Found ${topStocks.length} potential trading stocks from ${stockDataList.length} total`);

        if (topStocks.length === 0) {
            // Fallback: show top 10 by volume jika tidak ada yang qualified
            const volumeLeaders = scoredStocks
                .filter(stock => !stock.filtered)
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 10)
                .map(stock => ({ ...stock, score: stock.volume / 1000000 }));

            topStocks.push(...volumeLeaders);
            addProgress(`🔄 Showing top 10 volume leaders instead`);
        }

        addProgress('🤖 Generating trading recommendations dengan AI...', true);

        // Build trading-focused prompt
        let prompt = `ANALISIS TRADING SAHAM - FOKUS BANDARMOLOGY & MOMENTUM ENTRY

DATA SAHAM POTENSIAL UNTUK TRADING (${topStocks.length} dari ${stockDataList.length} stocks):

`;

        topStocks.forEach((stock, idx) => {
            prompt += `
${idx + 1}. ${stock.symbol} - ${stock.name}
   💰 Price: Rp ${stock.price} | 📈 Change: ${stock.changePercent}% 
   📊 Volume: ${(stock.volume / 1000000).toFixed(1)}M (${stock.volumeRatio}x avg)
   🎯 Signals: ${stock.tradingSignals || 'No signals'}
   📉 ATH Distance: -${stock.distanceFromHigh}% | Range Position: ${stock.positionInRange}%
   💡 Reasons: ${stock.entryReasons}
   ⭐ Score: ${stock.score}
`;
        });

        prompt += `

BERIKAN REKOMENDASI TRADING DENGAN FORMAT:
No | Symbol | Action (STRONG BUY/BUY/HOLD/AVOID) | Entry Price | Stop Loss | Target 1 | Target 2 | Timeframe | Confidence | Alasan Trading (momentum, bandar, teknikal)

KRITERIA PRIORITAS:
1. VOLUME SPIKES (indikasi bandar masuk)
2. BREAKOUT CONFIRMATION (price > resistance)  
3. MOMENTUM STRONG (change > 3%)
4. POTENTIAL CATALYST (earnings, dividend, news)
5. TECHNICAL SETUP (support bounce, trend continuation)

HINDARI:
- Saham sudah overbought (change > 15%)
- Volume rendah (< 0.8x average)  
- Trend masih downtrend
- Tidak ada catalyst`;

        // Call AI API
        const aiResp = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!aiResp.ok) {
            throw new Error(`AI analysis request failed: ${aiResp.status} ${aiResp.statusText}`);
        }

        const aiText = await aiResp.text();
        let aiData;
        try {
            aiData = JSON.parse(aiText);
        } catch (e) {
            throw new Error('Failed to parse AI response - received invalid format');
        }

        const analysisText = typeof aiData === 'object' ? aiData.response : aiData;

        addProgress('✅ Trading analysis complete!');

        // Display enhanced summary
        const volumeLeaders = topStocks
            .filter(stock => parseFloat(stock.volumeRatio) > 2)
            .slice(0, 5);

        const breakoutStocks = topStocks
            .filter(stock => parseFloat(stock.changePercent) > 3)
            .slice(0, 5);

        const summaryHtml = `
            <div class="trading-summary">
                <h3>🎯 Trading Opportunities Summary</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <h4>📊 Screening Results</h4>
                        <p>Total Screened: <strong>${stockDataList.length}</strong></p>
                        <p>Potential Trades: <strong>${topStocks.length}</strong></p>
                        <p>Success Rate: <strong>${((topStocks.length / stockDataList.length) * 100).toFixed(1)}%</strong></p>
                    </div>
                    <div class="summary-item">
                        <h4>🚀 Volume Leaders</h4>
                        ${volumeLeaders.map(stock =>
            `<p>${stock.symbol}: ${stock.volumeRatio}x volume</p>`
        ).join('')}
                    </div>
                    <div class="summary-item">
                        <h4>💥 Breakout Stocks</h4>
                        ${breakoutStocks.map(stock =>
            `<p>${stock.symbol}: +${stock.changePercent}%</p>`
        ).join('')}
                    </div>
                </div>
            </div>
        `;

        const formattedHtml = formatTradingAnalysis(analysisText);
        results.innerHTML = summaryHtml +
            '<div class="analysis-title">🎯 Trading Recommendations (Bandarmology Focus)</div>' +
            '<div class="analysis-result">' + formattedHtml + '</div>';

    } catch (err) {
        addProgress(`❌ Error: ${err.message}`);
        console.error('Analysis error:', err);
    } finally {
        loader.style.display = 'none';
        startBtn.disabled = false;
    }
});

function formatTradingAnalysis(text) {
    // Clean HTML spans first
    text = text.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');

    let html = parseMarkdownTable(text);

    // Enhanced formatting for trading terms
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Color coding for trading actions - smooth gradients
    html = html.replace(/\bSTRONG BUY\b(?!<)/g,
        '<span class="trading-signal strong-buy">STRONG BUY</span>');
    html = html.replace(/\bBUY\b(?!<)/g,
        '<span class="trading-signal buy">BUY</span>');
    html = html.replace(/\bHOLD\b(?!<)/g,
        '<span class="trading-signal hold">HOLD</span>');
    html = html.replace(/\bAVOID\b(?!<)/g,
        '<span class="trading-signal avoid">AVOID</span>');
    html = html.replace(/\bSELL\b(?!<)/g,
        '<span class="trading-signal avoid">SELL</span>');

    // Highlight key trading terms
    html = html.replace(/\bEntry Price\b/gi, '<strong>Entry Price</strong>');
    html = html.replace(/\bStop Loss\b/gi, '<strong class="stop-loss">Stop Loss</strong>');
    html = html.replace(/\bTarget\b/gi, '<strong class="target">Target</strong>');
    html = html.replace(/\bTimeframe\b/gi, '<strong>Timeframe</strong>');
    html = html.replace(/\bConfidence\b/gi, '<strong>Confidence</strong>');

    // Volume and momentum indicators - enhanced styling
    html = html.replace(/\bVOLUME SPIKES\b/gi,
        '<span class="volume-spike">📈 VOLUME SPIKES</span>');
    html = html.replace(/\bBREAKOUT\b/gi,
        '<span class="breakout-signal">💥 BREAKOUT</span>');
    html = html.replace(/\bMOMENTUM\b/gi,
        '<span class="momentum-signal">🚀 MOMENTUM</span>');

    return html;
}

function parseMarkdownTable(text) {
    const lines = text.split('\n');
    let inTable = false;
    let tableHtml = '';
    let headers = [];
    let rows = [];
    let beforeTableText = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
            if (!inTable) {
                if (beforeTableText.trim()) {
                    tableHtml += beforeTableText.replace(/\n/g, '<br>') + '<br>';
                }
                headers = cells;
                inTable = true;
                beforeTableText = '';
            } else if (cells.every(cell => cell.match(/^[-:]+$/))) {
                continue;
            } else {
                rows.push(cells);
            }
        } else {
            if (inTable) {
                tableHtml += buildTradingTable(headers, rows) + '<br>';
                inTable = false;
                headers = [];
                rows = [];
                beforeTableText = line;
            } else {
                beforeTableText += (beforeTableText ? '\n' : '') + line;
            }
        }
    }
    if (inTable && headers.length > 0) {
        tableHtml += buildTradingTable(headers, rows);
    } else if (beforeTableText.trim()) {
        tableHtml += beforeTableText.replace(/\n/g, '<br>');
    }
    return tableHtml;
}

function buildTradingTable(headers, rows) {
    // Filter out the last column (Alasan) if it exists
    const reasonIndex = headers.findIndex(h => h.toLowerCase().includes('alasan') || h.toLowerCase().includes('reason'));
    const displayHeaders = reasonIndex >= 0 ? headers.slice(0, reasonIndex) : headers;

    let html = '<table class="trading-table"><thead><tr>';
    displayHeaders.forEach(header => {
        html += `<th>${escapeHtml(header)}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach((row, rowIndex) => {
        html += '<tr>';
        const displayCells = reasonIndex >= 0 ? row.slice(0, reasonIndex) : row;
        const reasonCell = reasonIndex >= 0 ? row[reasonIndex] : '';

        displayCells.forEach((cell, index) => {
            let cellHtml = escapeHtml(cell);
            // Color code based on content
            if (cell.includes('STRONG BUY')) {
                cellHtml = `<span class="trading-signal strong-buy">${cellHtml}</span>`;
            } else if (cell.includes('BUY')) {
                cellHtml = `<span class="trading-signal buy">${cellHtml}</span>`;
            } else if (cell.includes('HOLD')) {
                cellHtml = `<span class="trading-signal hold">${cellHtml}</span>`;
            } else if (cell.includes('AVOID') || cell.includes('SELL')) {
                cellHtml = `<span class="trading-signal avoid">${cellHtml}</span>`;
            }
            html += `<td>${cellHtml}</td>`;
        });
        html += '</tr>';

        // Add detail row for reason if exists
        if (reasonCell) {
            html += `<tr class="trading-detail-row show">
                <td colspan="${displayCells.length}" class="trading-detail-cell">
                    <span class="trading-detail-label">🎯 Alasan Trading:</span>
                    ${highlightTradingTerms(escapeHtml(reasonCell))}
                </td>
            </tr>`;
        }
    });

    html += '</tbody></table>';
    return html;
}

function highlightTradingTerms(text) {
    const terms = {
        'volume': 'volume-spike-term',
        'bandar': 'bandar-term',
        'breakout': 'breakout-term',
        'momentum': 'momentum-term',
        'support': 'support-term',
        'resistance': 'resistance-term',
        'dividend': 'dividend-term',
        'earnings': 'earnings-term'
    };

    let result = text;
    Object.entries(terms).forEach(([term, className]) => {
        const regex = new RegExp(term, 'gi');
        result = result.replace(regex, `<span class="${className}">${term}</span>`);
    });

    return result;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function addProgress(message, isUpdate = false) {
    if (isUpdate && results.lastElementChild && results.lastElementChild.classList.contains('progress-item')) {
        results.lastElementChild.textContent = message;
    } else {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.textContent = message;
        results.appendChild(progressItem);
    }
    results.scrollTop = results.scrollHeight;
}

// Typing animation
class TypingAnimation {
    constructor(element, text, speed = 100, delay = 4000) {
        this.element = element;
        this.fullText = text;
        this.speed = speed;
        this.delay = delay;
        this.index = 0;
        this.isDeleting = false;
        this.type();
    }

    type() {
        const currentText = this.isDeleting
            ? this.fullText.substring(0, this.index--)
            : this.fullText.substring(0, this.index++);

        this.element.textContent = currentText;

        let timeout;
        if (!this.isDeleting && this.index === this.fullText.length) {
            timeout = this.delay;
            this.isDeleting = true;
        } else if (this.isDeleting && this.index === 0) {
            timeout = this.delay;
            this.isDeleting = false;
        } else {
            timeout = this.speed;
        }

        setTimeout(() => this.type(), timeout);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const titleSpan = document.querySelector('.malva-title span');
    if (titleSpan) {
        new TypingAnimation(titleSpan, " Bandarmology Trading Analysis by Malva ", 100, 4500);
    }
});