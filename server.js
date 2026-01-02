const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 8000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 서버 상태 확인용 루트 경로
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px; line-height: 1.6;">
            <h1 style="color: #4f46e5; font-size: 40px;">✅ 서버 연결 성공!</h1>
            <p style="font-size: 20px;">로컬 개발 모드 (HTTP)로 동작 중입니다.</p>
        </div>
    `);
});

// DB 관리
const initDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = { users: [], userData: {} };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};
let db = initDB();
const saveToDB = () => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

// API들
app.post('/auth/signup', (req, res) => {
    const { username, password, name } = req.body;
    const existingUser = db.users.find(u => u.username === username);
    if (existingUser) return res.status(409).json({ message: "이미 존재하는 아이디" });
    const newUser = { id: Date.now().toString(), username, password, name };
    db.users.push(newUser);
    db.userData[newUser.id] = { transactions: [], assets: [], insights: [], lastUpdated: new Date().toISOString() };
    saveToDB();
    res.status(201).json({ message: "성공" });
});

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
    res.json({ id: user.id, email: user.username, name: user.name });
});

app.get('/api/data', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId 누락" });
    res.json(db.userData[userId] || { transactions: [], assets: [], insights: [] });
});

app.post('/api/data', (req, res) => {
    const { userId, transactions, assets, insights } = req.body;
    db.userData[userId] = { 
        transactions: transactions || [], 
        assets: assets || [], 
        insights: insights || [], 
        lastUpdated: new Date().toISOString() 
    };
    saveToDB();
    res.json({ message: "저장 성공" });
});

// HTTP 서버 기동 (openssl 불필요)
http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`
---------------------------------------------------
`);
    console.log(`🚀 API 서버가 http://localhost:${PORT} 에서 활성화됨`);
    console.log(`---------------------------------------------------
`);
});