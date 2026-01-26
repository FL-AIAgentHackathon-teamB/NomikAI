import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mealsRouter from './routes/meals';

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9002';

// ミドルウェア
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json({limit: '10mb'})); // 画像データのため制限を上げる
app.use(express.urlencoded({extended: true, limit: '10mb'}));

// ルーティング
app.use('/api/v1/meals', mealsRouter);

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    message: 'NomikAI Backend API',
    version: '1.0.0',
    endpoints: {
      meals: '/api/v1/meals/analyze',
      health: '/api/v1/meals/health'
    }
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/`);
  console.log(`🔗 CORS enabled for: ${FRONTEND_URL}`);
});

export default app;
