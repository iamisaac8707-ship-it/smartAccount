const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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