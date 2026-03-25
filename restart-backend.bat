@echo off
REM Restart backend with FSRS fix

echo Stopping old backend...
FOR /F "tokens=5" %%A IN ('netstat -ano ^| findstr ":8080 "') DO taskkill /PID %%A /F

echo Waiting 3 seconds...
timeout /t 3 /nobreak

echo Building new backend...
cd /d C:\Workspace\FPT\github\KhaLeo\backend
mvn package -DskipTests -q

echo Starting new backend...
java -jar target\flashcard-backend-0.1.0-SNAPSHOT.jar

pause
