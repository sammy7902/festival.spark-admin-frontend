# Quick Fix for Network Error

## Issue
Frontend can't connect to backend - network error.

## Solution

### 1. Frontend `.env` File
Make sure your `billify-frontend/.env` has:
```env
VITE_API_BASE_URL=http://localhost:5004/api
```

**Important:** 
- Port should be `5004` (backend port)
- Must include `/api` at the end
- After changing, **restart your frontend dev server**

### 2. Backend `.env` File
Make sure your `billify-backend/.env` has:
```env
FRONTEND_URL=http://localhost:5174,http://192.168.0.104:5714
```

**Important:**
- Include `http://localhost:5174` (your frontend URL)
- After changing, **restart your backend server**

### 3. Restart Both Servers

**Frontend:**
```bash
cd billify-frontend
npm run dev
```

**Backend:**
```bash
cd billify-backend
npm run dev
# or
npm start
```

### 4. Verify

After restarting:
- Check backend console: Should see `🌐 CORS configured. Allowed origins: [...]`
- Check frontend console: Should see request logs when you try to login
- Network tab: Login request should succeed (200 status)

## Current Configuration

- **Frontend running on:** `http://localhost:5174`
- **Backend running on:** `http://localhost:5004`
- **Backend API:** `http://localhost:5004/api`

