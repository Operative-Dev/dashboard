# Agent Control - Social Media Dashboard

A sleek, mission control-style dashboard for monitoring and managing autonomous social media posting agents across multiple clients and platforms.

## 🚀 Features

### Core Functionality
- **Real-time Overview**: Live metrics and stats from all agents and clients
- **Client Management**: Monitor multiple clients across TikTok, Twitter, LinkedIn, Instagram
- **Post Tracking**: Complete post lifecycle from creation to publication with metrics
- **Agent Activity**: Live logs and status updates from autonomous agents
- **Needs Attention**: Smart alerting for failed posts, low engagement, and stale content

### Dashboard Views
1. **Overview** - Mission control dashboard with key metrics and charts
2. **Clients** - Client portfolio management and stats
3. **Posts** - Comprehensive post management and search
4. **Agent Logs** - Real-time agent activity monitoring
5. **Needs Attention** - Issues requiring manual intervention

## 🎨 Design

### Aesthetic
- **Theme**: Dark, Linear/Vercel-inspired mission control interface
- **Typography**: Space Grotesk (display) + JetBrains Mono (data)
- **Colors**: Purple/pink gradients with platform-specific accents
- **Effects**: Glassmorphism, subtle animations, staggered reveals

### Responsive
- Mobile-first design
- Optimized for desktop mission control usage
- Smooth animations and micro-interactions

## 🛠 Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: SQLite (better-sqlite3) for MVP simplicity
- **Charts**: Recharts for data visualizations  
- **Styling**: Tailwind CSS with custom design system
- **Animation**: Framer Motion for smooth interactions
- **Icons**: Lucide React
- **Deployment**: Ready for Vercel/Docker deployment

## 🏗 Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Overview dashboard
│   ├── clients/           # Client management
│   ├── posts/             # Post tracking
│   ├── agent-logs/        # Agent activity
│   ├── needs-attention/   # Alert dashboard
│   └── api/               # API endpoints
├── components/            # Reusable UI components
├── lib/                   # Database and utilities
└── data.sqlite           # SQLite database
```

## 📊 Data Model

### Core Tables
- **clients**: Client accounts and status
- **channels**: Platform channels per client
- **accounts**: Social media account handles
- **posts**: Content with publishing status
- **post_metrics**: Engagement and performance data
- **agent_activity_log**: Real-time agent actions

### Sample Data
Pre-populated with realistic data:
- 4 clients (Woz, Personal Brand, Novi, Mira)
- 11+ social accounts across platforms
- 50+ sample posts with metrics and agent logs

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

The dashboard will be available at `http://localhost:4001`

### First Run
The database auto-initializes with sample data on first startup.

### Production Build
```bash
npm run build
npm start
```

## 🔧 Configuration

### Database
SQLite database automatically created at `./data.sqlite`

### Environment
No environment variables required for MVP - everything self-contained.

### Ports
Default port: 4001 (configurable in package.json)

## 🎯 Current Clients & Accounts

### Woz (TikTok Powerhouse)
- @withwozz - Primary brand account
- @woz_app - Product-focused content
- @lizzycodez6 - Developer personality
- @shanerzfi5m - Community content
- @wozzie - Fun/viral content

### Personal Brand
- LinkedIn professional content
- Twitter/X thought leadership

### Novi
- TikTok creative content
- Instagram visual brand

### Mira
- TikTok creative content  
- Twitter/X engagement

## 📈 Agent System

### Active Agents
- **Hopper**: Coordination and scheduling
- **Scripter**: Trend scanning and content ideas
- **Producer**: Image generation and publishing

### Activity Tracking
- Content generation events
- Publishing status and results  
- Performance metric collection
- Error handling and retries

## 🚨 Monitoring & Alerts

### Needs Attention Categories
- **Critical**: Failed posts requiring immediate action
- **Warning**: Low engagement posts (<1%)
- **Info**: Stale scheduled content (>24h old)

### Quick Actions
- Retry failed posts
- Boost low performers
- Reschedule stale content

## 🔮 Future Enhancements

### Near Term
- Client login system
- Post approval workflows
- Advanced filtering and search
- Export capabilities

### Long Term
- Customer-facing analytics
- Multi-tenant architecture
- Advanced agent configuration
- Content library management
- Billing integration

## 🧰 Development Notes

### Database Migration
SQLite chosen for MVP simplicity - easy PostgreSQL migration later

### Component Architecture
Modular design ready for scaling:
- Reusable UI components
- Separated data layer
- API-first architecture

### Performance
- Optimized for fast loading
- Efficient database queries
- Minimal client-side processing

---

**Built for**: AI consulting agency managing social media via autonomous agents
**Mission**: Transform social media management into a precision operation