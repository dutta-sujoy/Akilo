# Akilo - Fitness & Nutrition Tracking App

<p align="center">
  <img src="frontend/assets/logo.png" alt="Akilo Logo" width="120" />
</p>

<p align="center">
  A beautiful, open-source fitness and nutrition tracking app built with React Native and FastAPI.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-documentation">API Docs</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## ✨ Features

- 📊 **Calorie & Macro Tracking** - Log meals and track your daily nutrition
- 💧 **Water Intake** - Quick-add buttons for hydration tracking
- ⚖️ **Weight Logging** - Track your weight with trend visualization
- 📈 **Analytics** - Beautiful charts showing your weekly progress
- 🔥 **Streak System** - Stay motivated with daily logging streaks
- 🎨 **Modern UI** - Premium dark theme with smooth animations
- 🔐 **Secure Auth** - Supabase authentication with session persistence

## 🛠 Tech Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| React Native | FastAPI | Supabase (PostgreSQL) |
| Expo SDK 54 | Pydantic | Row Level Security |
| TypeScript | Python 3.10+ | Real-time subscriptions |
| React Native Gifted Charts | uvicorn | |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- [Supabase](https://supabase.com) account (free tier works!)
- Expo Go app on your phone

### 1. Clone the Repository

```bash
git clone https://github.com/dutta-sujoy/Akilo.git
cd Akilo
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database/schema.sql` in the SQL editor
3. Get your credentials from **Settings > API**:
   - Project URL
   - Anon/Public Key
   - JWT Secret

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials and backend URL

# Start Expo
npx expo start
```

### 5. Run on Device

Scan the QR code with Expo Go (Android) or Camera app (iOS).

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Frontend (`frontend/.env`)

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://YOUR_IP:8000
```

> ⚠️ **Security Note**: Never commit `.env` files. They are gitignored by default.

## 📁 Project Structure

```
Akilo/
├── backend/                  # FastAPI server
│   ├── app/
│   │   ├── api/endpoints/    # API routes
│   │   ├── core/             # Config & security
│   │   ├── db/               # Database client
│   │   └── models/           # Pydantic schemas
│   └── main.py
│
├── frontend/                 # React Native app
│   ├── app/                  # Expo Router pages
│   │   ├── (auth)/           # Login, Signup, Onboarding
│   │   └── (tabs)/           # Main app screens
│   ├── components/           # Reusable components
│   └── core/                 # API client, Supabase, Theme
│
└── database/
    └── schema.sql            # Supabase schema
```

## 📖 API Documentation

Once the backend is running, visit: `http://localhost:8000/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/` | Get user profile |
| PUT | `/api/profile/` | Update profile |
| GET | `/api/food/search?q=` | Search foods |
| POST | `/api/food/log` | Log food entry |
| POST | `/api/water/` | Log water intake |
| POST | `/api/weight/` | Log weight |
| GET | `/api/analytics/daily?date=` | Daily summary |
| GET | `/api/analytics/weekly?days=` | Weekly analytics |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/dutta-sujoy">Sujoy Dutta</a>
</p>
