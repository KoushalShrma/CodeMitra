# Judge0 Integration Setup

## Overview
Migrated from Piston API to Judge0 API for code execution.

## Environment Setup

### 1. Get Judge0 API Key
- Go to https://rapidapi.com/judge0-official/api/judge0-ce
- Click "Subscribe" (free tier available)
- Copy your **RapidAPI Key**

### 2. Update `.env`
```bash
VITE_JUDGE0_RAPIDAPI_KEY=your_rapidapi_key_here
VITE_JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
```

### 3. Restart Dev Server
```bash
npm run dev
```

## What Changed

### Files Created
- `src/services/judge0Api.js` - New Judge0 service layer

### Files Modified
- `src/pages/PracticeWorkspacePage.jsx` - Now uses `executeCodeWithJudge0`
- `src/components/TestCasePanel.jsx` - Updated error messages for Judge0
- `.env` - Added Judge0 credentials

### Key Differences

**Execution Flow:**
1. **Piston**: Single synchronous request → Returns result immediately
2. **Judge0**: Async polling → Submit code → Poll for result (up to 30 seconds)

**Language Support:**
- Python: 71
- JavaScript (Node.js): 63
- C++: 54
- Java: 62

**Error Handling:**
- Judge0 returns specific status codes for different error types
- Automatically detects: Compilation Error, Runtime Error, Wrong Answer, Time Limit, etc.

## Features

✅ **Automatic Polling**: Code waits up to 30 seconds for execution result  
✅ **Error Detection**: Distinguishes between compilation errors, runtime errors, and wrong output  
✅ **Timeout Handling**: Gracefully handles cases where execution takes longer than 30s  
✅ **Responsive UI**: Shows "Running..." indicator during polling  

## Troubleshooting

**Error: "Judge0 RapidAPI key not configured"**
- Ensure `VITE_JUDGE0_RAPIDAPI_KEY` is set in `.env`
- Restart dev server

**Error: "Judge0 authentication failed"**
- Verify RapidAPI key is correct
- Check `VITE_JUDGE0_RAPIDAPI_HOST` is `judge0-ce.p.rapidapi.com`

**Code execution timeout**
- Judge0 is free tier with limited resources
- Complex code may take longer than 30 seconds
- Consider upgrading RapidAPI subscription for priority
