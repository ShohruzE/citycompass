# 🚀 Backend Quick Start Guide

## Step 1: Install Dependencies

```bash
cd backend
uv sync
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/citycompass
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

## Step 3: Create Database Tables

```bash
python -m app.create_tables
```

You should see:

```
INFO:__main__:Creating database tables...
INFO:__main__:✅ All tables created successfully!
INFO:__main__:Tables created: users, survey_responses
```

## Step 4: Start the Server

```bash
fastapi dev app/main.py
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## Step 5: Test the API

### Option A: Interactive Docs (Recommended)

1. Open browser: http://localhost:8000/docs
2. Try the `/api/survey/stats` endpoint (no auth required)
3. You should see:
   ```json
   {
     "total_surveys": 0,
     "borough_breakdown": []
   }
   ```

### Option B: cURL

```bash
curl http://localhost:8000/api/survey/stats
```

### Option C: Python Test Script

```bash
python test_survey_endpoint.py
```

You should see all tests pass:

```
🧪 Testing Survey Pydantic Validation
================================================================================
✅ PASS: Valid survey data
✅ PASS: Invalid age
✅ PASS: Invalid zip code
✅ PASS: Invalid enum value
✅ PASS: Missing required field

5/5 tests passed

🎉 All validation tests passed! Backend is working correctly.
```

## Step 6: Test with Frontend

1. **Start Frontend** (in separate terminal):

   ```bash
   cd citycompass
   npm run dev
   ```

2. **Login via OAuth**:

   - Visit http://localhost:3000
   - Click login (Google or Microsoft)

3. **Go to Survey Page**:

   - Navigate to http://localhost:3000/survey
   - Fill out the multi-step form
   - Submit

4. **Check Database**:

   ```bash
   # Connect to your PostgreSQL database
   psql -d citycompass

   # Query surveys
   SELECT id, borough, neighborhood, overall_rating, created_at
   FROM survey_responses
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## 🎉 Success!

If all steps worked, your backend is fully functional!

## 🐛 Troubleshooting

### Database Connection Error

**Error**: `sqlalchemy.exc.OperationalError: could not connect to server`

**Fix**:

- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `createdb citycompass`

### Import Error

**Error**: `ModuleNotFoundError: No module named 'app'`

**Fix**:

- Run from backend directory
- Use: `python -m app.create_tables` (not `python app/create_tables.py`)

### OAuth Not Working

**Error**: Session not found / 401 Unauthorized

**Fix**:

- Ensure you've logged in via OAuth first
- Check browser has cookies enabled
- Verify OAuth credentials in .env

### Port Already in Use

**Error**: `Address already in use`

**Fix**:

```bash
# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
fastapi dev app/main.py --port 8001
```

## 📖 Next Steps

- Read [SURVEY_API.md](./SURVEY_API.md) for API details
- Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture
- Check out http://localhost:8000/docs for interactive API exploration

## 🔍 Useful Commands

```bash
# View all tables in database
psql -d citycompass -c "\dt"

# Count survey responses
psql -d citycompass -c "SELECT COUNT(*) FROM survey_responses;"

# View recent surveys
psql -d citycompass -c "SELECT neighborhood, borough, overall_rating FROM survey_responses ORDER BY created_at DESC LIMIT 10;"

# Reset database (CAREFUL!)
python -m app.create_tables  # Recreates tables

# View logs
tail -f fastapi.log  # If logging to file
```

## 💡 Tips

1. **Use Interactive Docs**: http://localhost:8000/docs is your friend
2. **Check Logs**: Watch the terminal for request/response logs
3. **Test Auth First**: Make sure OAuth login works before testing survey
4. **Browser DevTools**: Check Network tab for API calls and responses
5. **Database Client**: Use pgAdmin or DBeaver to inspect data

Happy coding! 🎊
