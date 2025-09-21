# 🏆 Predictio - Football Prediction Game

A modern web application for football prediction games with friends, built with Next.js and TypeScript.

## ✨ Features

- **Simple Login System**: Players join by entering their name
- **100% Real Data Only**: No mock data! Gets actual current matches from live football APIs
- **Real Odds from Bookmakers**: Live odds from 20+ bookmakers via The Odds API
- **Real-time Predictions**: Click to predict match results (1, X, 2)
- **Smart Scoring**: Calculates cumulative odds for correct predictions
- **Color-coded Results**: Green for correct predictions, red for incorrect
- **Modern UI**: Beautiful, responsive design with gamification elements
- **Admin Controls**: Set match results and refresh fixtures
- **Multiple API Support**: Fallbacks to ensure data availability

## 🎮 How to Play

⚠️ **First, you need API keys to see any matches! No demo data is provided.**

1. **Get API Keys**: Sign up at the-odds-api.com or rapidapi.com (both have free tiers)
2. **Add to .env.local**: Copy `env.example` and add your real API keys
3. **Join the Game**: Enter your name to create a player column
4. **Make Predictions**: Click 1, X, or 2 buttons for each match (real matches like Dinamo vs Craiova!)
5. **Wait for Results**: Admin sets results after matches finish
6. **See Your Score**: Total odds accumulated from correct predictions
7. **Compete**: Compare scores with friends!

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <your-repo-url>
cd predictio
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. (Optional) Set up API keys for live data in \`.env.local\`:
\`\`\`env
# Optional - App works with real fixture data without these
FOOTBALL_API_KEY=your_football_data_key    # football-data.org (free: 10 req/min)
RAPIDAPI_KEY=your_rapidapi_key            # RapidAPI API-Football (free: 100 req/day)  
ODDS_API_KEY=your_odds_api_key            # The Odds API (free: 500 req/month)
\`\`\`

**🎯 Note: The app works perfectly without API keys using real weekend fixtures and realistic odds!**

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3001](http://localhost:3001) in your browser

## 🧪 Testing Real APIs

The app includes a built-in API testing system:

1. **Click "Test APIs"** in the application to check your API connections
2. **Without API keys**: Shows no matches (encourages getting real data)
3. **With API keys**: Gets real matches and odds from live APIs (September 2025)

⚠️ **Important**: This app no longer uses mock/demo data. You need API keys to see matches!

### 📊 Free API Options:

| API | What You Get | Free Limits | Get Key |
|-----|-------------|-------------|---------|
| **The Odds API** | Real odds from 20+ bookmakers | 500 requests/month | [the-odds-api.com](https://the-odds-api.com) |
| **API-Sports** | Live fixtures, standings, stats | 100 requests/day | [rapidapi.com](https://rapidapi.com/api-sports/api/api-football/) |

### 🔧 Setup API Keys:

Create `.env.local` and add:
```env
# Get real odds (optional)
ODDS_API_KEY=your_odds_api_key_here

# Get real fixtures (optional)
RAPIDAPI_KEY=your_rapidapi_key_here
```

**⚠️ Important**: You need at least one API key to see matches. No mock data is used!

## 🏗️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with better-sqlite3
- **Icons**: Lucide React
- **API**: Football-data.org (free tier)
- **Date Handling**: date-fns

## 📊 Database Schema

The application uses SQLite with three main tables:
- \`users\`: Player information
- \`matches\`: Match fixtures, odds, and results
- \`predictions\`: Player predictions linked to matches and users

## 🎨 Design Features

- **Gradient Backgrounds**: Beautiful green-to-blue gradients
- **Glass Morphism**: Frosted glass effect with backdrop blur
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode Support**: Automatic dark/light theme detection
- **Smooth Animations**: Hover effects and transitions
- **Modern Typography**: Clean, readable fonts

## 🔧 API Endpoints

- \`GET/POST /api/users\`: User management
- \`GET/POST /api/matches\`: Match data and result updates  
- \`GET/POST /api/predictions\`: Player predictions

## 📱 Mobile Responsive

The application is fully responsive with:
- Horizontal scrolling for the prediction table on mobile
- Touch-friendly buttons and interactions
- Optimized spacing and typography for small screens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Enhancements

- Real-time updates with WebSockets
- League standings and statistics
- Player profiles and history
- Tournament modes
- Mobile app with React Native
- Social features and sharing

---

Made with ❤️ for football fans who love predicting match results!