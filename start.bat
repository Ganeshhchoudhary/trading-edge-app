@echo on
echo Starting Backend Server on http://localhost:8000
start /B .\backend\venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

echo Starting Frontend Server on http://localhost:3000
start /B python -m http.server 3000

echo.
echo =======================================================
echo Trading Edge App is starting!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo =======================================================
echo.
pause
