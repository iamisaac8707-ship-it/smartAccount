const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const yahooFinance = require('yahoo-finance2').default; // Yahoo Finance Import

const app = express();
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ... (DB Connection Code) ...

// API: Stock Search (Yahoo Finance)
app.get('/api/stock/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "검색어가 필요합니다." });

    try {
        let symbol = query;
        
        // 1. 단순 검색 (티커나 이름으로 검색)
        // 한국 종목 코드(6자리 숫자)인 경우 .KS(코스피) 또는 .KQ(코스닥) 접미사 시도
        if (/^\d{6}$/.test(query)) {
            // 우선 코스피(.KS)로 가정하고 시도, 실패하면 코스닥(.KQ) 고려 (여기서는 단순화)
            symbol = `${query}.KS`; 
        } else {
            const searchResult = await yahooFinance.search(query);
            if (searchResult.quotes.length > 0) {
                symbol = searchResult.quotes[0].symbol;
            } else {
                return res.status(404).json({ message: "종목을 찾을 수 없습니다." });
            }
        }

        // 2. 시세 조회
        const quote = await yahooFinance.quote(symbol);
        
        if (!quote) {
             // 만약 .KS로 실패했다면 .KQ로 재시도 (숫자 6자리였던 경우만)
             if (symbol.endsWith('.KS')) {
                try {
                    const kqSymbol = symbol.replace('.KS', '.KQ');
                    const kqQuote = await yahooFinance.quote(kqSymbol);
                    if (kqQuote) {
                        return res.json({
                            price: kqQuote.regularMarketPrice,
                            currency: kqQuote.currency,
                            name: kqQuote.longName || kqQuote.shortName,
                            ticker: kqSymbol
                        });
                    }
                } catch (e) {}
             }
             return res.status(404).json({ message: "시세 정보를 가져올 수 없습니다." });
        }

        res.json({
            price: quote.regularMarketPrice,
            currency: quote.currency,
            name: quote.longName || quote.shortName,
            ticker: symbol
        });

    } catch (err) {
        console.error("Stock fetch error:", err);
        res.status(500).json({ message: "시세 조회 중 오류 발생" });
    }
});

// MongoDB 연결
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ MongoDB connected successfully'))
        .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
    console.warn('⚠️ MONGODB_URI is not defined. Data will not be persisted.');
}

// Mongoose 스키마 정의
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true }
});

const userDataSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    transactions: { type: Array, default: [] },
    assets: { type: Array, default: [] },
    insights: { type: Array, default: [] },
    lastUpdated: { type: String, default: () => new Date().toISOString() }
});

const User = mongoose.model('User', userSchema);
const UserData = mongoose.model('UserData', userDataSchema);

// API 서버 상태 확인
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        message: "Smart Account API Server (MongoDB) is running", 
        time: new Date().toISOString(),
        dbConnected: mongoose.connection.readyState === 1
    });
});

// API들
app.post('/auth/signup', async (req, res) => {
    try {
        const { username, password, name } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(409).json({ message: "이미 존재하는 아이디" });
        
        const newUser = new User({ username, password, name });
        await newUser.save();
        
        const newUserData = new UserData({ 
            userId: newUser._id.toString(), 
            transactions: [], 
            assets: [], 
            insights: [] 
        });
        await newUserData.save();
        
        res.status(201).json({ message: "성공" });
    } catch (err) {
        res.status(500).json({ message: "서버 오류: " + err.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user) return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
        res.json({ id: user._id.toString(), email: user.username, name: user.name });
    } catch (err) {
        res.status(500).json({ message: "서버 오류: " + err.message });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ message: "userId 누락" });
        const data = await UserData.findOne({ userId });
        res.json(data || { transactions: [], assets: [], insights: [] });
    } catch (err) {
        res.status(500).json({ message: "서버 오류: " + err.message });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        const { userId, transactions, assets, insights } = req.body;
        const update = { 
            transactions: transactions || [], 
            assets: assets || [], 
            insights: insights || [], 
            lastUpdated: new Date().toISOString() 
        };
        await UserData.findOneAndUpdate({ userId }, update, { upsert: true });
        res.json({ message: "저장 성공" });
    } catch (err) {
        res.status(500).json({ message: "서버 오류: " + err.message });
    }
});

// HTTP 서버 기동
http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API 서버가 포트 ${PORT}에서 활성화됨 (MongoDB Mode)`);
});