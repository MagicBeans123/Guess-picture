@echo off

echo ============================
echo Creating virtual environment...
echo ============================

python -m venv .venv

echo ============================
echo Activating virtual environment...
echo ============================

call .venv\Scripts\activate

echo ============================
echo Installing dependencies...
echo ============================

pip install -r requirements.txt

echo ============================
echo Setup complete!
echo ============================

pause