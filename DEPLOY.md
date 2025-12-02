# ChefAI 部署指南

## Vercel 部署（推薦）

### 前端部署

1. 在 Vercel 中導入專案
2. 設置根目錄為 `frontend`
3. 構建命令：`npm run build`
4. 輸出目錄：`dist`
5. 環境變數（如果需要分離部署後端）：
   - `VITE_API_BASE_URL`: 後端 API 的完整 URL

### 後端部署

1. 在 Vercel 中創建另一個專案用於後端
2. 設置根目錄為 `backend`
3. 環境變數：
   - `GROQ_API_KEY`: 您的 Groq API Key
   - `PORT`: 端口（可選，默認 3000）

### 同域部署（前端 + 後端）

如果使用 Vercel 的 serverless 函數：

1. 將 `backend/api/recipe.js` 複製到 `api/recipe.js`
2. 在根目錄的 `vercel.json` 中配置路由

## Netlify 部署

### 前端部署

1. 在 Netlify 中導入專案
2. 構建命令：`cd frontend && npm install && npm run build`
3. 發布目錄：`frontend/dist`
4. 確保 `frontend/dist/_redirects` 文件存在

### 後端部署

使用 Netlify Functions 或單獨部署到其他平台

## 修復 404 錯誤

如果部署後出現 404 錯誤，確保：

1. **SPA 路由重定向**：所有路由都應該重定向到 `index.html`
   - Vercel: 使用 `vercel.json` 中的 `rewrites`
   - Netlify: 使用 `_redirects` 文件

2. **API 路由**：如果前後端分離部署，確保：
   - 前端 API 配置指向正確的後端 URL
   - CORS 設置正確

3. **構建輸出**：確保 `dist` 目錄包含所有必要文件

## 環境變數設置

### 前端（可選）

如果前後端分離部署，在部署平台設置：
```
VITE_API_BASE_URL=https://your-backend-url.com/api
```

### 後端（必需）

```
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

