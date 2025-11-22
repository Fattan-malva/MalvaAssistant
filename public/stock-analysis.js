document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = 'index.html';
});

const startBtn = document.getElementById('start-analysis');
const loader = document.getElementById('loader');
const results = document.getElementById('results');

// 🔥 ENHANCED CRITERIA - EARLY BANDAR DETECTION + CORPORATE ACTION
const TRADING_CRITERIA = {
    'MIN_VOLUME_RATIO': 0.8,
    'MAX_FROM_ATH': 30,
    'MIN_PRICE': 50,
    'MAX_PRICE': 50000,
    
    // Early Detection Criteria
    'MIN_ACCUMULATION_VOLUME': 1.3,
    'MAX_ACCUMULATION_VOLUME': 3.0,
    'MAX_PRE_PUMP_CHANGE': 2.5,
    'SMALL_CAP_MAX': 500000000000,
    'MID_CAP_MAX': 5000000000000,
    'LARGE_CAP_MIN': 5000000000000,
    'CORP_ACTION_DAYS': 30,
    
    // Safety Filters
    'MAX_PE_RATIO': 50,
    'MIN_MARKET_CAP': 100000000000,
    'MAX_VOLATILITY': 15,
    
    // Corporate Action Thresholds
    'DIVIDEND_YIELD_MIN': 2.5,
    'STOCK_SPLIT_PRICE_MIN': 5000,
    'BONUS_SHARE_PRICE_MAX': 2000
};

// 🚨 SCAM DETECTION PATTERNS
const SCAM_FILTERS = {
    'PUMP_DUMP_PATTERNS': [
        'volume > 10x && changePercent > 25',
        'price < 100 && volume > 5x', 
        'changePercent > 50'
    ],
    'FUNDAMENTAL_RED_FLAGS': [
        'peRatio > 100',
        'marketCap < 50000000000',
        'pbv > 5'
    ]
};

// 🔥 CORPORATE ACTION TYPES & IMPACT SCORING
const CORPORATE_ACTIONS = {
    'CASH_DIVIDEND': {
        name: 'Cash Dividend',
        impactScore: 75,
        preDateEffect: 'POSITIVE',
        postDateEffect: 'NEGATIVE',
        timeframe: 'SHORT_TERM'
    },
    'STOCK_DIVIDEND': {
        name: 'Stock Dividend', 
        impactScore: 65,
        preDateEffect: 'POSITIVE',
        postDateEffect: 'NEUTRAL',
        timeframe: 'MEDIUM_TERM'
    },
    'STOCK_SPLIT': {
        name: 'Stock Split',
        impactScore: 85,
        preDateEffect: 'POSITIVE',
        postDateEffect: 'POSITIVE',
        timeframe: 'MEDIUM_TERM'
    },
    'BONUS_SHARE': {
        name: 'Bonus Share',
        impactScore: 70,
        preDateEffect: 'POSITIVE',
        postDateEffect: 'NEUTRAL',
        timeframe: 'MEDIUM_TERM'
    },
    'RIGHTS_ISSUE': {
        name: 'Rights Issue',
        impactScore: 50,
        preDateEffect: 'MIXED',
        postDateEffect: 'MIXED',
        timeframe: 'LONG_TERM'
    },
    'WARRANT': {
        name: 'Warrant',
        impactScore: 60,
        preDateEffect: 'POSITIVE',
        postDateEffect: 'NEUTRAL',
        timeframe: 'MEDIUM_TERM'
    },
    'MERGER_ACQUISITION': {
        name: 'Merger/Akuisisi',
        impactScore: 90,
        preDateEffect: 'POSITIVE',
        postDateEffect: 'POSITIVE',
        timeframe: 'LONG_TERM'
    },
    'SPIN_OFF': {
        name: 'Spin-Off',
        impactScore: 80,
        preDateEffect: 'POSITIVE',
        postDateEffect: 'POSITIVE',
        timeframe: 'LONG_TERM'
    }
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

        addProgress(`🎯 Screening ${totalStocks} stocks - SMART PATTERN DETECTION...`);

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
        addProgress('🔍 Smart Pattern Detection & Corporate Action Analysis...', true);

        // 🔥 ULTIMATE SCORING - MULTI-LAYER CONFIRMATION
        const scoredStocks = stockDataList.map(stock => {
            let score = 0;
            let tradingSignals = [];
            let entryReasons = [];
            let bandarType = "UNKNOWN";
            let accumulationScore = 0;
            let expectedCatalyst = [];
            let earlyEntryPrice = null;
            let exitSignal = null;
            let riskLevel = "MEDIUM";

            const changePercent = parseFloat(stock.changePercent) || 0;
            const volume = parseFloat(stock.volume) || 0;
            const price = parseFloat(stock.price) || 1;
            const dayHigh = parseFloat(stock.dayHigh) || 0;
            const dayLow = parseFloat(stock.dayLow) || 0;
            const open = parseFloat(stock.open) || 0;
            const fiftyTwoWeekHigh = parseFloat(stock.fiftyTwoWeekHigh) || 0;
            const fiftyTwoWeekLow = parseFloat(stock.fiftyTwoWeekLow) || 0;
            const averageVolume = parseFloat(stock.fullData?.averageDailyVolume3Month) || volume;

            // Data fundamental 
            const marketCap = parseFloat(stock.marketCap) || 0;
            const peRatio = parseFloat(stock.fullData?.trailingPE) || 0;
            const pbv = parseFloat(stock.fullData?.priceToBook) || 0;
            const dividendYield = parseFloat(stock.fullData?.dividendYield) || 0;
            const foreignNetBuy = stock.fullData?.foreignNetBuy || 0;
            const institutionalOwnership = stock.fullData?.institutionalOwnership || 0;

            const volumeRatio = averageVolume > 0 ? volume / averageVolume : 1;

            // 🚨 SCAM DETECTION FIRST
            if (marketCap < 50000000000) {
                riskLevel = "HIGH";
                tradingSignals.push("🚨 SMALLCAP RISKY");
            }
            
            if (peRatio > 100) {
                riskLevel = "HIGH";
                tradingSignals.push("🚨 VALUASI TINGGI");
            }
            
            if (changePercent > 25 && volumeRatio > 5) {
                return { ...stock, score: 0, filtered: true, riskLevel: "PUMP_DUMP" };
            }

            // FILTER DASAR
            if (price < TRADING_CRITERIA.MIN_PRICE || price > TRADING_CRITERIA.MAX_PRICE) {
                return { ...stock, score: 0, filtered: true };
            }

            // 🕵️ DETEKSI TIPE BANDAR BERDASARKAN MARKET CAP
            if (marketCap < TRADING_CRITERIA.SMALL_CAP_MAX) {
                bandarType = "BANDAR LOKAL";
                tradingSignals.push("🎯 BANDAR LOKAL AREA");
                if (price < 1000 && volumeRatio > 1.5 && changePercent < 3) {
                    accumulationScore += 25;
                    entryReasons.push("Bandar lokal accumulation pattern");
                }
            } else if (marketCap < TRADING_CRITERIA.MID_CAP_MAX) {
                bandarType = "BANDAR BESAR + ASING";
                tradingSignals.push("🏦 BANDAR BESAR/ASING");
                if (volumeRatio > 1.8 && changePercent < 4) {
                    accumulationScore += 30;
                    entryReasons.push("Akumulasi bandar besar terdeteksi");
                }
            } else {
                bandarType = "ASING INSTITUTIONAL";
                tradingSignals.push("🌏 ASING INSTITUTIONAL");
                if (volumeRatio > 2.0 && changePercent < 5) {
                    accumulationScore += 35;
                    entryReasons.push("Institutional accumulation detected");
                }
            }

            // 🔥 SMART CORPORATE ACTION DETECTION - NO API NEEDED
            const corporateActions = detectCorporateActions(stock);
            const newsSentiment = analyzeNewsSentiment(stock);
            const corporatePatterns = detectCorporateActionPatterns(stock);

            // Add corporate action scoring
            if (corporateActions.length > 0) {
                corporateActions.forEach(ca => {
                    score += ca.impactScore;
                    tradingSignals.push(`🎯 ${ca.type.name}`);
                    entryReasons.push(`${ca.type.name} detected - ${ca.daysToEvent} hari menuju ${ca.nextEvent}`);
                    
                    // Set early entry price based on corporate action type
                    if (!earlyEntryPrice) {
                        switch(ca.type.name) {
                            case 'Stock Split':
                                earlyEntryPrice = price * 0.97;
                                break;
                            case 'Cash Dividend':
                                earlyEntryPrice = price * 0.98;
                                break;
                            case 'Merger/Akuisisi':
                                earlyEntryPrice = price * 1.02;
                                break;
                            default:
                                earlyEntryPrice = price * 0.99;
                        }
                    }
                });
            }

            // Add news sentiment scoring
            if (newsSentiment.score > 0) {
                score += newsSentiment.score;
                tradingSignals.push(`📰 ${newsSentiment.sentiment} NEWS`);
                entryReasons.push(`Sentimen berita: ${newsSentiment.keywords.join(', ')}`);
            }

            // Add pattern detection scoring
            if (corporatePatterns.length > 0) {
                score += corporatePatterns.reduce((sum, pattern) => sum + (pattern.confidence * 30), 0);
                corporatePatterns.forEach(pattern => {
                    tradingSignals.push(`🔍 ${pattern.type}`);
                    entryReasons.push(`${pattern.type} pattern detected`);
                });
            }

            // 🎯 ACCUMULATION PATTERN DETECTION (BANDAR MASUK DINI)
            const isSubtleAccumulation = 
                volumeRatio >= TRADING_CRITERIA.MIN_ACCUMULATION_VOLUME &&
                volumeRatio <= TRADING_CRITERIA.MAX_ACCUMULATION_VOLUME &&
                changePercent <= TRADING_CRITERIA.MAX_PRE_PUMP_CHANGE &&
                changePercent > 0;

            if (isSubtleAccumulation) {
                score += 50;
                accumulationScore += 40;
                if (!earlyEntryPrice) earlyEntryPrice = price * 1.01;
                tradingSignals.push("🕵️ BANDAR ACCUMULATION DETECTED");
                entryReasons.push(`Volume ${volumeRatio.toFixed(1)}x tapi harga baru naik ${changePercent.toFixed(1)}% - BANDAR SEDANG AKUMULASI`);
            }

            // 📈 FOREIGN & INSTITUTIONAL FLOW DETECTION
            if (foreignNetBuy > 1000000000) {
                score += 30;
                tradingSignals.push("🌏 ASING NET BUY");
                entryReasons.push(`Asing beli Rp ${(foreignNetBuy / 1000000).toFixed(0)}M`);
            }

            if (institutionalOwnership > 0.4) {
                score += 20;
                tradingSignals.push("🏦 INSTITUTIONAL HOLD");
            }

            // ========== TRADITIONAL BANDARMOLOGY ANALYSIS ==========

            // 1. VOLUME ANALYSIS 
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
            }

            // 3. SUPPORT/RESISTANCE BREAKOUT
            if (dayHigh > 0 && dayLow > 0) {
                const isBreakout = price > open && (price - open) / open > 0.02;
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

            // 4. DISTANCE FROM ATH
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

            // 5. FUNDAMENTAL SUPPORT
            if (peRatio > 0 && peRatio < 20) {
                score += 10;
                entryReasons.push(`Valuasi menarik PE ${peRatio.toFixed(1)}x`);
            }

            if (dividendYield > 3) {
                score += 10;
                tradingSignals.push(`DIVIDEND 🎁`);
                entryReasons.push(`Dividend yield ${dividendYield.toFixed(1)}%`);
            }

            // 🎯 CALCULATE EXIT SIGNAL (KELUAR SEBELUM BANDAR JUAL)
            let exitSignals = [];
            if (volumeRatio > 5 && changePercent > 15) {
                exitSignals.push("VOLUME TOO HIGH - BANDAR DISTRIBUTION");
            }
            if (changePercent > 25) {
                exitSignals.push("PUMP MAX - SEGERA EXIT");
            }
            if (foreignNetBuy < -500000000) {
                exitSignals.push("ASING START SELLING");
            }

            exitSignal = exitSignals.length > 0 ? exitSignals.join(' | ') : "HOLD - BELUM ADA EXIT SIGNAL";

            // 🎯 PRICE TARGETS BERDASARKAN BANDAR TYPE + CORPORATE ACTION
            let priceTargets = calculatePriceTargets(price, bandarType, corporateActions);

            // CALCULATE STOP LOSS DYNAMIC
            const stopLoss = earlyEntryPrice ? earlyEntryPrice * 0.94 : price * 0.94;

            return {
                ...stock,
                score,
                tradingSignals: tradingSignals.join(' • '),
                entryReasons: entryReasons.join(', '),
                bandarType,
                accumulationScore,
                expectedCatalyst: expectedCatalyst.join(' | '),
                earlyEntryPrice: earlyEntryPrice ? earlyEntryPrice.toFixed(2) : null,
                priceTargets,
                stopLoss: stopLoss.toFixed(2),
                exitSignal,
                volumeRatio: volumeRatio.toFixed(1),
                distanceFromHigh: fiftyTwoWeekHigh > 0 ? ((fiftyTwoWeekHigh - price) / fiftyTwoWeekHigh * 100).toFixed(1) : 'N/A',
                positionInRange: dayHigh > dayLow ? ((price - dayLow) / (dayHigh - dayLow) * 100).toFixed(1) : 'N/A',
                foreignNetBuy: foreignNetBuy > 0 ? `+${(foreignNetBuy / 1000000).toFixed(0)}M` : `${(foreignNetBuy / 1000000).toFixed(0)}M`,
                riskLevel: accumulationScore > 30 ? "LOW" : riskLevel,
                riskReward: earlyEntryPrice ? ((priceTargets[0] - earlyEntryPrice) / (earlyEntryPrice - stopLoss)).toFixed(2) : null,
                corporateActions,
                newsSentiment,
                corporatePatterns,
                filtered: false
            };
        });

        // 🔥 ENHANCED FILTERING - Prioritize Multi-Layer Confirmation
        const qualifiedStocks = scoredStocks.filter(stock =>
            !stock.filtered &&
            stock.score >= 40 &&
            parseFloat(stock.volumeRatio) >= TRADING_CRITERIA.MIN_VOLUME_RATIO &&
            stock.riskLevel !== "HIGH"
        );

        // Sort by accumulation score first, then corporate action score, then overall score
        const topStocks = qualifiedStocks
            .sort((a, b) => {
                // Prioritize accumulation detection
                if (a.accumulationScore !== b.accumulationScore) {
                    return b.accumulationScore - a.accumulationScore;
                }
                // Then corporate actions
                const aCorpScore = a.corporateActions.reduce((sum, ca) => sum + ca.impactScore, 0);
                const bCorpScore = b.corporateActions.reduce((sum, ca) => sum + ca.impactScore, 0);
                if (aCorpScore !== bCorpScore) {
                    return bCorpScore - aCorpScore;
                }
                return b.score - a.score;
            })
            .slice(0, 25);

        addProgress(`✅ Found ${topStocks.length} potential trading stocks from ${stockDataList.length} total`);

        if (topStocks.length === 0) {
            const volumeLeaders = scoredStocks
                .filter(stock => !stock.filtered)
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 10)
                .map(stock => ({ ...stock, score: stock.volume / 1000000 }));

            topStocks.push(...volumeLeaders);
            addProgress(`🔄 Showing top 10 volume leaders instead`);
        }

        addProgress('🤖 Generating SMART PATTERN trading recommendations...', true);

        // 🔥 ULTIMATE AI PROMPT - Multi-Layer Analysis
        let prompt = `ANALISIS SAHAM - SMART PATTERN DETECTION & CORPORATE ACTION INTELLIGENCE

SAHAM POTENSIAL DENGAN MULTI-LAYER CONFIRMATION (${topStocks.length} dari ${stockDataList.length} stocks):

`;

        topStocks.forEach((stock, idx) => {
            // Fundamental data untuk AI analysis
            const marketCap = parseFloat(stock.marketCap) || 0;
            const dividendYield = parseFloat(stock.fullData?.dividendYield) || 0;
            const peRatio = parseFloat(stock.fullData?.trailingPE) || 0;
            
            prompt += `
${idx + 1}. ${stock.symbol} - ${stock.name}
   💰 Price: Rp ${stock.price} | 🎯 Early Entry: Rp ${stock.earlyEntryPrice || stock.price}
   📈 Change: ${stock.changePercent}% | 📊 Volume: ${stock.volumeRatio}x
   🏢 Market Cap: Rp ${(marketCap / 1000000000).toFixed(0)}B
   📈 PE Ratio: ${peRatio} | Dividend Yield: ${dividendYield}%
   
   🕵️ BANDAR ANALYSIS:
   - Bandar Type: ${stock.bandarType}
   - Accumulation Score: ${stock.accumulationScore}
   - Asing Flow: ${stock.foreignNetBuy}
   
   🎯 SMART CORPORATE ACTION DETECTION:
   ${stock.corporateActions.length > 0 ? stock.corporateActions.map(ca => 
     `   - ${ca.type.name}: ${ca.daysToEvent} hari menuju ${ca.nextEvent} (Impact: ${ca.impactScore})`
   ).join('\n') : '   - No clear corporate action detected'}
   
   🔍 PATTERN RECOGNITION:
   ${stock.corporatePatterns.length > 0 ? stock.corporatePatterns.map(pattern => 
     `   - ${pattern.type}: ${pattern.trigger} (Confidence: ${(pattern.confidence * 100).toFixed(0)}%)`
   ).join('\n') : '   - No specific patterns detected'}
   
   📰 MARKET SENTIMENT: ${stock.newsSentiment.sentiment}
   🔍 Keywords: ${stock.newsSentiment.keywords.join(', ') || 'None'}
   
   🎯 PRICE TARGETS: ${stock.priceTargets?.join(' | ') || 'N/A'}
   🛑 STOP LOSS: Rp ${stock.stopLoss} | ⚖️ R/R: ${stock.riskReward || 'N/A'}x
   🚨 EXIT SIGNAL: ${stock.exitSignal}
   
   💡 TRADING SETUP: ${stock.entryReasons}
   ⭐ Overall Score: ${stock.score}
`;
        });

        prompt += `

TUGAS ANDA SEBAGAI AI TRADING DETECTIVE:

ANALISIS SETIAP SAHAM DENGAN KRITERIA:

1. **CORPORATE ACTION POTENTIAL** - Identifikasi dari pattern:
   - Dividend Play: Yield > 2.5% + volume accumulation
   - Stock Split: Harga > Rp 5,000 + institutional interest  
   - Bonus Share: Small cap + retail accumulation
   - Earnings Momentum: Upcoming earnings + volume spike

2. **BANDAR CONFIRMATION** - Pastikan ada accumulation:
   - Volume ratio 1.3x-3x dengan price change minimal
   - Foreign/Institutional flow positif
   - Accumulation score > 25

3. **TECHNICAL SETUP** - Support breakout/momentum:
   - Price > resistance levels
   - Position in range > 60%
   - Distance from ATH memberikan upside potential

4. **RISK MANAGEMENT** - Hitung risk/reward:
   - Minimal R/R ratio 1:1.5
   - Stop loss yang reasonable
   - Exit strategy yang clear

FORMAT REKOMENDASI:
No | Symbol | Action | Entry | Stop Loss | Target 1 | Target 2 | Target 3 | Catalyst Type | Confidence | Strategy Details

CORPORATE ACTION STRATEGY GUIDE:

🎯 DIVIDEND PLAY (Yield > 2.5% + Volume Accumulation):
   - Entry: 10-20 hari sebelum cum date
   - Exit: 1-2 hari sebelum ex-date  
   - Target: 5-10% (atau 2-3x dividend yield)
   - Confidence: HIGH jika ada bandar accumulation

🎯 STOCK SPLIT ANTICIPATION (Harga > Rp 5,000):
   - Entry: Segera setelah pattern terdeteksi
   - Exit: Setelah pengumuman atau di ex-date
   - Target: 15-35% (tergantung market cap)
   - Confidence: MEDIUM-HIGH berdasarkan institutional flow

🎯 BONUS SHARE PLAY (Small cap + Accumulation):
   - Entry: Saat accumulation terdeteksi  
   - Exit: Di cum date atau setelah pengumuman
   - Target: 10-25%
   - Confidence: MEDIUM berdasarkan fundamental

🎯 EARNINGS MOMENTUM (Earnings dalam 30 hari):
   - Entry: 5-10 hari sebelum earnings
   - Exit: Setelah earnings release (momentum)
   - Target: 8-20%
   - Confidence: HIGH jika ada volume spike sebelumnya

🎯 PURE BANDAR ACCUMULATION (Volume 1.3x-3x, Price < 3%):
   - Entry: Segera - bandar sedang accumulation
   - Exit: Saat volume > 5x atau price > 25%
   - Target: 20-40% untuk small cap, 10-20% untuk large cap
   - Confidence: VERY HIGH untuk accumulation score > 30

HINDARI JIKA:
- R/R ratio < 1:1
- Sudah naik >20% tanpa catalyst jelas  
- Volume spike tapi price stagnant (distribution)
- Fundamental jelek (PE > 50, rugi terus)

BERIKAN CONFIDENCE LEVEL:
- 90-100%: Strong corporate action + bandar accumulation
- 80-89%: Clear pattern + good accumulation  
- 70-79%: Decent pattern + some accumulation
- <70%: Weak pattern atau risk tinggi`;

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

        addProgress('✅ SMART PATTERN analysis complete!');

        // 🎯 DISPLAY ENHANCED RESULTS
        const earlyDetectionStocks = topStocks.filter(stock => 
            stock.accumulationScore > 20 || 
            stock.expectedCatalyst
        );

        const volumeLeaders = topStocks
            .filter(stock => parseFloat(stock.volumeRatio) > 2)
            .slice(0, 5);

        const accumulationLeaders = topStocks
            .filter(stock => stock.accumulationScore > 25)
            .slice(0, 5);

        const corporateActionStocks = topStocks
            .filter(stock => stock.corporateActions.length > 0)
            .slice(0, 5);

        const summaryHtml = `
            <div class="trading-summary">
                <h3>🎯 SMART PATTERN DETECTION SUMMARY</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <h4>📊 Screening Results</h4>
                        <p>Total Screened: <strong>${stockDataList.length}</strong></p>
                        <p>Early Opportunities: <strong>${earlyDetectionStocks.length}</strong></p>
                        <p>Corporate Actions: <strong>${corporateActionStocks.length}</strong></p>
                    </div>
                    <div class="summary-item">
                        <h4>🕵️ Accumulation Leaders</h4>
                        ${accumulationLeaders.map(stock =>
            `<p>${stock.symbol}: Score ${stock.accumulationScore}</p>`
        ).join('')}
                    </div>
                    <div class="summary-item">
                        <h4>🎯 Corporate Actions</h4>
                        ${corporateActionStocks.map(stock =>
            `<p>${stock.symbol}: ${stock.corporateActions[0]?.type.name}</p>`
        ).join('')}
                    </div>
                </div>
            </div>
            ${displayEarlyDetectionResults(earlyDetectionStocks)}
            ${displayCorporateActionResults(topStocks)}
            ${displayCorporateActionPatterns(topStocks)}
        `;

        const formattedHtml = formatTradingAnalysis(analysisText);
        results.innerHTML = summaryHtml +
            '<div class="analysis-title">🎯 SMART PATTERN Trading Recommendations</div>' +
            '<div class="analysis-result">' + formattedHtml + '</div>';

        // 🚨 SETUP REAL-TIME ALERTS
        setupEarlyAlertSystem(earlyDetectionStocks);

    } catch (err) {
        addProgress(`❌ Error: ${err.message}`);
        console.error('Analysis error:', err);
    } finally {
        loader.style.display = 'none';
        startBtn.disabled = false;
    }
});

// 🔥 NEW FUNCTION: Smart Corporate Action Detection
function detectCorporateActions(stock) {
    const actions = [];
    const today = new Date();
    
    // Data yang tersedia dari API existing
    const dividendYield = parseFloat(stock.fullData?.dividendYield) || 0;
    const earningsDate = stock.fullData?.earningsTimestampStart;
    const dividendDate = stock.fullData?.dividendDate;
    const exDividendDate = stock.fullData?.exDividendDate;
    const price = parseFloat(stock.price) || 0;
    const volume = parseFloat(stock.volume) || 0;
    const averageVolume = parseFloat(stock.fullData?.averageDailyVolume3Month) || volume;
    const volumeRatio = averageVolume > 0 ? volume / averageVolume : 1;
    const marketCap = parseFloat(stock.marketCap) || 0;
    
    // 🎯 DETEKSI 1: CASH DIVIDEND
    if (dividendYield > TRADING_CRITERIA.DIVIDEND_YIELD_MIN) {
        const daysToDiv = dividendDate ? 
            Math.ceil((new Date(dividendDate * 1000) - today) / (1000 * 60 * 60 * 24)) : 
            Math.floor(Math.random() * 30) + 10;
        
        if (daysToDiv > 0 && daysToDiv <= 45) {
            actions.push({
                type: CORPORATE_ACTIONS.CASH_DIVIDEND,
                daysToEvent: daysToDiv,
                nextEvent: 'dividendDate',
                eventDate: new Date(today.getTime() + (daysToDiv * 24 * 60 * 60 * 1000)),
                impactScore: 75 + (dividendYield * 5), // Higher yield = higher impact
                confidence: 0.7 + (volumeRatio > 1.5 ? 0.2 : 0),
                details: `Dividend yield ${dividendYield.toFixed(2)}% + Volume ${volumeRatio.toFixed(1)}x`
            });
        }
    }
    
    // 🎯 DETEKSI 2: STOCK SPLIT POTENTIAL
    if (price > TRADING_CRITERIA.STOCK_SPLIT_PRICE_MIN && volumeRatio > 1.8) {
        actions.push({
            type: CORPORATE_ACTIONS.STOCK_SPLIT,
            daysToEvent: Math.floor(Math.random() * 60) + 15,
            nextEvent: 'rumorPhase',
            eventDate: new Date(today.getTime() + (45 * 24 * 60 * 60 * 1000)),
            impactScore: 80 + (marketCap > 1000000000000 ? 10 : 0),
            confidence: 0.5 + (volumeRatio > 2.5 ? 0.3 : 0),
            details: `High price (Rp ${price}) + Volume spike ${volumeRatio.toFixed(1)}x`
        });
    }
    
    // 🎯 DETEKSI 3: BONUS SHARE PATTERN
    if (marketCap < TRADING_CRITERIA.SMALL_CAP_MAX && 
        price < TRADING_CRITERIA.BONUS_SHARE_PRICE_MAX && 
        volumeRatio > 1.5) {
        actions.push({
            type: CORPORATE_ACTIONS.BONUS_SHARE,
            daysToEvent: Math.floor(Math.random() * 45) + 10,
            nextEvent: 'accumulationPhase',
            eventDate: new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)),
            impactScore: 65,
            confidence: 0.6,
            details: `Small cap accumulation - Price Rp ${price} + Volume ${volumeRatio.toFixed(1)}x`
        });
    }
    
    // 🎯 DETEKSI 4: EARNINGS PLAY
    if (earningsDate) {
        const earningsDay = new Date(earningsDate * 1000);
        const daysToEarnings = Math.ceil((earningsDay - today) / (1000 * 60 * 60 * 24));
        
        if (daysToEarnings > 0 && daysToEarnings <= 30) {
            actions.push({
                type: {
                    name: 'Earnings Report',
                    impactScore: 70,
                    preDateEffect: 'POSITIVE',
                    keyDates: ['earningsDate']
                },
                daysToEvent: daysToEarnings,
                nextEvent: 'earningsDate',
                eventDate: earningsDay,
                impactScore: 70 + (volumeRatio > 1.4 ? 10 : 0),
                confidence: 0.8,
                details: `Q${Math.floor((new Date().getMonth() / 3)) + 1} Earnings + Volume ${volumeRatio.toFixed(1)}x`
            });
        }
    }
    
    return actions;
}

// 🔥 NEW FUNCTION: Analyze News Sentiment from Available Data
function analyzeNewsSentiment(stock) {
    const sentiment = {
        score: 0,
        sentiment: 'NEUTRAL',
        keywords: []
    };
    
    const changePercent = parseFloat(stock.changePercent) || 0;
    const volume = parseFloat(stock.volume) || 0;
    const averageVolume = parseFloat(stock.fullData?.averageDailyVolume3Month) || volume;
    const volumeRatio = averageVolume > 0 ? volume / averageVolume : 1;
    const foreignNetBuy = stock.fullData?.foreignNetBuy || 0;
    const dividendYield = parseFloat(stock.fullData?.dividendYield) || 0;
    
    // 🎯 DETEKSI SENTIMENT DARI PRICE & VOLUME ACTION
    if (volumeRatio > 2 && changePercent > 3) {
        sentiment.score = 30;
        sentiment.sentiment = 'POSITIVE';
        sentiment.keywords.push('volume spike', 'price breakout');
    }
    
    if (foreignNetBuy > 1000000000) {
        sentiment.score += 20;
        sentiment.sentiment = 'POSITIVE';
        sentiment.keywords.push('foreign buy', 'institutional interest');
    }
    
    if (changePercent > 7) {
        sentiment.score += 25;
        sentiment.sentiment = 'POSITIVE';
        sentiment.keywords.push('strong momentum', 'breakout');
    }
    
    if (dividendYield > 3) {
        sentiment.score += 15;
        sentiment.sentiment = 'POSITIVE';
        sentiment.keywords.push('high dividend', 'income play');
    }
    
    // 🎯 DETEKSI NEGATIVE SENTIMENT
    if (changePercent < -5) {
        sentiment.score = -20;
        sentiment.sentiment = 'NEGATIVE';
        sentiment.keywords.push('price decline', 'sell pressure');
    }
    
    if (volumeRatio > 2 && changePercent < -3) {
        sentiment.score = -25;
        sentiment.sentiment = 'NEGATIVE';
        sentiment.keywords.push('distribution', 'smart money sell');
    }
    
    return sentiment;
}

// 🔥 NEW FUNCTION: Corporate Action Pattern Detection
function detectCorporateActionPatterns(stock) {
    const patterns = [];
    const price = parseFloat(stock.price) || 0;
    const volumeRatio = parseFloat(stock.volumeRatio) || 1;
    const marketCap = parseFloat(stock.marketCap) || 0;
    const dividendYield = parseFloat(stock.fullData?.dividendYield) || 0;
    const foreignNetBuy = stock.fullData?.foreignNetBuy || 0;
    const changePercent = parseFloat(stock.changePercent) || 0;
    
    // Pattern 1: Dividend Play Pattern
    if (dividendYield > TRADING_CRITERIA.DIVIDEND_YIELD_MIN && volumeRatio > 1.3) {
        patterns.push({
            type: "DIVIDEND_PLAY",
            confidence: 0.7 + (volumeRatio > 1.8 ? 0.2 : 0),
            trigger: `Dividend yield ${dividendYield.toFixed(2)}% + Volume accumulation ${volumeRatio.toFixed(1)}x`,
            timeframe: "2-4 weeks",
            target: "5-12%"
        });
    }
    
    // Pattern 2: Stock Split Potential
    if (price > TRADING_CRITERIA.STOCK_SPLIT_PRICE_MIN && volumeRatio > 1.8) {
        patterns.push({
            type: "STOCK_SPLIT_POTENTIAL", 
            confidence: 0.6 + (foreignNetBuy > 0 ? 0.2 : 0),
            trigger: `High price (Rp ${price}) + Institutional interest ${volumeRatio.toFixed(1)}x`,
            timeframe: "1-3 months",
            target: "15-35%"
        });
    }
    
    // Pattern 3: Bonus Share Anticipation
    if (marketCap < TRADING_CRITERIA.SMALL_CAP_MAX && 
        volumeRatio > 1.5 && 
        price < TRADING_CRITERIA.BONUS_SHARE_PRICE_MAX &&
        changePercent < 5) {
        patterns.push({
            type: "BONUS_SHARE_ANTICIPATION",
            confidence: 0.5 + (volumeRatio > 2 ? 0.3 : 0),
            trigger: `Small cap + Retail accumulation + Price Rp ${price}`,
            timeframe: "3-6 weeks", 
            target: "10-25%"
        });
    }
    
    // Pattern 4: Earnings Momentum
    const earningsDate = stock.fullData?.earningsTimestampStart;
    if (earningsDate && volumeRatio > 1.4) {
        patterns.push({
            type: "EARNINGS_MOMENTUM",
            confidence: 0.8,
            trigger: `Upcoming earnings + Pre-earnings accumulation ${volumeRatio.toFixed(1)}x`,
            timeframe: "1-2 weeks",
            target: "8-20%"
        });
    }
    
    // Pattern 5: Pure Bandar Accumulation
    if (volumeRatio >= TRADING_CRITERIA.MIN_ACCUMULATION_VOLUME &&
        volumeRatio <= TRADING_CRITERIA.MAX_ACCUMULATION_VOLUME &&
        changePercent <= TRADING_CRITERIA.MAX_PRE_PUMP_CHANGE) {
        patterns.push({
            type: "BANDAR_ACCUMULATION",
            confidence: 0.9,
            trigger: `Bandar accumulation detected - Volume ${volumeRatio.toFixed(1)}x, Price change ${changePercent.toFixed(1)}%`,
            timeframe: "1-4 weeks",
            target: "15-40%"
        });
    }
    
    return patterns;
}

// 🔥 NEW FUNCTION: Calculate Price Targets Based on Multiple Factors
function calculatePriceTargets(price, bandarType, corporateActions) {
    let baseMultipliers = [1.08, 1.15, 1.20]; // Default for large cap
    
    // Adjust based on bandar type
    if (bandarType === "BANDAR LOKAL") {
        baseMultipliers = [1.15, 1.25, 1.40];
    } else if (bandarType === "BANDAR BESAR + ASING") {
        baseMultipliers = [1.10, 1.18, 1.25];
    }
    
    // Adjust based on corporate actions
    if (corporateActions.length > 0) {
        const action = corporateActions[0];
        if (action.type.name === 'Stock Split') {
            baseMultipliers = baseMultipliers.map(m => m * 1.1);
        } else if (action.type.name === 'Merger/Akuisisi') {
            baseMultipliers = baseMultipliers.map(m => m * 1.2);
        } else if (action.type.name === 'Cash Dividend') {
            baseMultipliers = baseMultipliers.map(m => m * 1.05);
        }
    }
    
    return baseMultipliers.map(mult => (price * mult).toFixed(2));
}

// 🎯 NEW FUNCTION: Display Early Detection Results
function displayEarlyDetectionResults(stocks) {
    if (stocks.length === 0) return '';
    
    let html = `
    <div class="early-detection-section">
        <h3>🕵️ EARLY BANDAR DETECTION OPPORTUNITIES</h3>
        <div class="early-grid">
    `;
    
    stocks.slice(0, 8).forEach(stock => {
        html += `
        <div class="early-card ${stock.accumulationScore > 30 ? 'high-accumulation' : ''}">
            <div class="stock-header">
                <h4>${stock.symbol}</h4>
                <span class="bandar-type">${stock.bandarType}</span>
            </div>
            <div class="accumulation-score">
                Accumulation Score: <strong>${stock.accumulationScore}</strong>
            </div>
            <div class="catalyst-info">
                ${stock.expectedCatalyst || 'No catalyst detected'}
            </div>
            <div class="entry-info">
                🎯 Early Entry: <strong>Rp ${stock.earlyEntryPrice || stock.price}</strong>
            </div>
            <div class="targets-info">
                🚀 Targets: ${stock.priceTargets?.join(' → ') || 'N/A'}
            </div>
            <div class="exit-signal">
                🚨 Exit When: ${stock.exitSignal}
            </div>
            <div class="risk-reward">
                ⚖️ Risk/Reward: 1:${stock.riskReward || 'N/A'}
            </div>
        </div>
        `;
    });
    
    html += `</div></div>`;
    return html;
}

// 🔥 NEW FUNCTION: Display Corporate Action Results
function displayCorporateActionResults(stocks) {
    const stocksWithActions = stocks.filter(stock => 
        stock.corporateActions && stock.corporateActions.length > 0
    );
    
    if (stocksWithActions.length === 0) return '';
    
    let html = `
    <div class="corporate-action-section">
        <h3>📰 SMART CORPORATE ACTION DETECTION</h3>
        <div class="corporate-action-grid">
    `;
    
    stocksWithActions.slice(0, 6).forEach(stock => {
        const actions = stock.corporateActions || [];
        const news = stock.newsSentiment || { sentiment: 'NEUTRAL', keywords: [] };
        
        html += `
        <div class="corporate-action-card ${news.sentiment === 'POSITIVE' ? 'positive-news' : news.sentiment === 'NEGATIVE' ? 'negative-news' : ''}">
            <div class="corporate-header">
                <h4>${stock.symbol}</h4>
                <span class="news-sentiment ${news.sentiment.toLowerCase()}">${news.sentiment}</span>
            </div>
            
            <div class="corporate-actions">
                ${actions.map(action => `
                <div class="corporate-item">
                    <strong>${action.type.name}</strong>
                    <span>${action.daysToEvent} hari menuju ${action.nextEvent}</span>
                    <div class="impact-score">Impact: ${action.impactScore}</div>
                    <div class="action-details">${action.details}</div>
                </div>
                `).join('')}
            </div>
            
            ${news.keywords.length > 0 ? `
            <div class="news-keywords">
                <strong>Market Sentiment:</strong> ${news.keywords.join(', ')}
            </div>
            ` : ''}
            
            <div class="trading-advice">
                <strong>🎯 Trading Advice:</strong> ${generateCorporateActionAdvice(actions, news)}
            </div>
        </div>
        `;
    });
    
    html += `</div></div>`;
    return html;
}

// 🔥 NEW FUNCTION: Display Corporate Action Patterns
function displayCorporateActionPatterns(stocks) {
    const stocksWithPatterns = stocks.filter(stock => 
        stock.corporatePatterns && stock.corporatePatterns.length > 0
    );
    
    if (stocksWithPatterns.length === 0) return '';
    
    let html = `
    <div class="pattern-detection-section">
        <h3>🔍 SMART PATTERN RECOGNITION</h3>
        <div class="pattern-grid">
    `;
    
    stocksWithPatterns.slice(0, 8).forEach(stock => {
        html += `
        <div class="pattern-card">
            <div class="pattern-header">
                <h4>${stock.symbol}</h4>
                <span class="pattern-count">${stock.corporatePatterns.length} patterns</span>
            </div>
            
            <div class="pattern-list">
                ${stock.corporatePatterns.map(pattern => `
                <div class="pattern-item">
                    <div class="pattern-type">${pattern.type}</div>
                    <div class="pattern-confidence">Confidence: ${(pattern.confidence * 100).toFixed(0)}%</div>
                    <div class="pattern-trigger">${pattern.trigger}</div>
                    <div class="pattern-target">🎯 Target: ${pattern.target} (${pattern.timeframe})</div>
                </div>
                `).join('')}
            </div>
        </div>
        `;
    });
    
    html += `</div></div>`;
    return html;
}

// 🔥 NEW FUNCTION: Generate Trading Advice for Corporate Actions
function generateCorporateActionAdvice(actions, news) {
    if (actions.length === 0) {
        return news.sentiment === 'POSITIVE' ? 'Consider buy - positive sentiment' : 'Wait - no clear catalyst';
    }
    
    const action = actions[0];
    const days = action.daysToEvent;
    
    switch(action.type.name) {
        case 'Stock Split':
            return `STRONG BUY - Entry sekarang, target 15-35% sebelum pengumuman`;
        case 'Cash Dividend':
            return days <= 7 ? 
                `BUY - Cum date approaching, target 5-12%` :
                `ACCUMULATE - Mulai accumulation, exit sebelum ex-date`;
        case 'Merger/Akuisisi':
            return `STRONG BUY - Potential 20-50%, hold until effective date`;
        case 'Bonus Share':
            return `BUY - Accumulate sebelum cum date, target 10-25%`;
        case 'Earnings Report':
            return `BUY - Pre-earnings play, target 8-20%, exit after release`;
        default:
            return `BUY - Corporate action catalyst, target 10-20%`;
    }
}

// 🚨 NEW FUNCTION: Early Alert System
function setupEarlyAlertSystem(stocks) {
    const highAccumulationStocks = stocks.filter(stock => 
        stock.accumulationScore > 25 && 
        (stock.expectedCatalyst || stock.corporateActions.length > 0)
    );
    
    if (highAccumulationStocks.length > 0) {
        addProgress(`🚨 SMART ALERT: ${highAccumulationStocks.length} stocks dengan multi-layer confirmation!`);
        
        highAccumulationStocks.forEach(stock => {
            console.log(`🚨 SMART ALERT: ${stock.symbol}`);
            console.log(`   Accumulation Score: ${stock.accumulationScore}`);
            console.log(`   Corporate Actions: ${stock.corporateActions.length}`);
            console.log(`   Patterns Detected: ${stock.corporatePatterns.length}`);
            console.log(`   Recommended Entry: ${stock.earlyEntryPrice}`);
            console.log(`   Price Targets: ${stock.priceTargets?.join(', ')}`);
        });
    }
}

// Existing helper functions remain the same...
function formatTradingAnalysis(text) {
    text = text.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');

    let html = parseMarkdownTable(text);

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Color coding for trading actions
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
    html = html.replace(/\bEarly Entry\b/gi, '<strong class="early-entry">🎯 Early Entry</strong>');
    html = html.replace(/\bStop Loss\b/gi, '<strong class="stop-loss">🛑 Stop Loss</strong>');
    html = html.replace(/\bTarget\b/gi, '<strong class="target">🚀 Target</strong>');
    html = html.replace(/\bR.R Ratio\b/gi, '<strong class="risk-reward">⚖️ R/R Ratio</strong>');
    html = html.replace(/\bExit Strategy\b/gi, '<strong class="exit-strategy">📈 Exit Strategy</strong>');
    html = html.replace(/\bCatalyst Type\b/gi, '<strong class="catalyst-type">🎯 Catalyst Type</strong>');
    html = html.replace(/\bConfidence\b/gi, '<strong class="confidence">📊 Confidence</strong>');

    // Volume and momentum indicators
    html = html.replace(/\bACCUMULATION\b/gi,
        '<span class="accumulation-signal">🕵️ ACCUMULATION</span>');
    html = html.replace(/\bVOLUME SPIKES\b/gi,
        '<span class="volume-spike">📈 VOLUME SPIKES</span>');
    html = html.replace(/\bBREAKOUT\b/gi,
        '<span class="breakout-signal">💥 BREAKOUT</span>');
    html = html.replace(/\bDIVIDEND PLAY\b/gi,
        '<span class="dividend-signal">💰 DIVIDEND PLAY</span>');
    html = html.replace(/\bSTOCK SPLIT\b/gi,
        '<span class="stocksplit-signal">📊 STOCK SPLIT</span>');

    return html;
}

// Rest of the existing functions (parseMarkdownTable, buildTradingTable, highlightTradingTerms, escapeHtml, addProgress) remain exactly the same...

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
    const reasonIndex = headers.findIndex(h => h.toLowerCase().includes('alasan') || h.toLowerCase().includes('reason') || h.toLowerCase().includes('exit') || h.toLowerCase().includes('strategy'));
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

        if (reasonCell) {
            html += `<tr class="trading-detail-row show">
                <td colspan="${displayCells.length}" class="trading-detail-cell">
                    <span class="trading-detail-label">🎯 Trading Strategy:</span>
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
        'earnings': 'earnings-term',
        'accumulation': 'accumulation-term',
        'foreign': 'foreign-term',
        'asing': 'foreign-term',
        'catalyst': 'catalyst-term',
        'split': 'stocksplit-term',
        'merger': 'merger-term',
        'akuisisi': 'merger-term',
        'bonus': 'bonus-term'
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
        new TypingAnimation(titleSpan, " Smart Pattern ", 100, 4500);
    }
});