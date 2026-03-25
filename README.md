# vision-realized-capstone

# Project Setup Guide

Within the root folder, follow the commands below depending on whether you are using Linux/macOS or PowerShell (Windows).

## Prerequisites

- Python 3.x  
- npm  

## Backend Setup

### 1. Create and activate virtual environment

#### Linux / macOS
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

#### PowerShell (Windows)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

## Frontend Setup

### 1. Open a new terminal

### 2. Install dependencies
```bash
cd frontend
npm install
```

### 3. Run the development server
```bash
npm run dev
```
