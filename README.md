# ChefAI

使用 Groq AI 技術開發的智慧食譜生成應用，採用聊天式介面，讓用戶輸入指令來生成食物名稱和詳細食譜。

## 功能特色

- 聊天式對話介面
- 根據用戶指令生成食物名稱和完整食譜
- 顯示食材清單和製作步驟
- 對話歷史記錄
- 響應式設計

## 技術架構

- **前端**: Vue 3 + Vite
- **後端**: Node.js + Express
- **AI API**: Groq AI

## 安裝步驟

### 後端設定

1. 進入後端目錄：
```bash
cd backend
```

2. 安裝依賴：
```bash
npm install
```

3. 確認 `.env` 檔案已設定正確的 API key：
```
GROQ_API_KEY=your_api_key_here
PORT=3000
```

4. 啟動後端伺服器：
```bash
npm start
```

後端伺服器將運行在 `http://localhost:3000`

### 前端設定

1. 開啟新的終端視窗，進入前端目錄：
```bash
cd frontend
```

2. 安裝依賴：
```bash
npm install
```

3. 啟動開發伺服器：
```bash
npm dev
```

前端應用將運行在 `http://localhost:5173`

## 使用方式

1. 確保後端和前端都已啟動
2. 在瀏覽器中開啟前端應用
3. 在輸入框中輸入您想要的食物或料理類型（例如：「我想吃義大利麵」、「做一道中式料理」）
4. 按下 Enter 或點擊發送按鈕
5. AI 將生成食物名稱和詳細食譜，包含食材清單和製作步驟

## 專案結構

```
aibuild/
├── frontend/          # Vue 前端應用
├── backend/           # Node.js 後端 API
└── README.md          # 專案說明文件
```

## 注意事項

- 確保後端伺服器在啟動前端之前已運行
- API key 請妥善保管，不要提交到版本控制系統
- 所有文字使用繁體中文

