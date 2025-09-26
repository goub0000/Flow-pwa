# Flow PWA - College Application Management Platform

A comprehensive Progressive Web Application for managing college applications across multiple user types including students, institutions, counselors, parents, and recommenders.

## 🚀 Features

### Multi-User Platform
- **Students**: Application submission, program search, profile management
- **Institutions**: Onboarding, application review, program management, advanced reporting
- **Counselors**: Student guidance, session management, application assistance
- **Parents**: Child monitoring, communication, resource access
- **Recommenders**: Letter writing, evaluation, form management

### Advanced Reporting System
- 📊 Application trends and statistical analysis
- 📈 Enrollment forecasting and projections
- 🎯 Performance metrics and KPI tracking
- 🔧 Custom report builder with drag-and-drop interface
- 📱 Real-time dashboard with interactive charts
- ⏰ Automated report scheduling and delivery
- 📊 Comparative analysis with peer institutions
- 📤 Export capabilities (PDF, Excel, CSV)

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript ES6+, Canvas API
- **Backend**: Node.js, Express.js, MongoDB
- **Authentication**: JWT-based authentication system
- **Security**: Helmet.js, rate limiting, input validation
- **Hosting**: Firebase Hosting
- **PWA**: Service workers, offline capabilities

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB
- Firebase CLI
- Git

## 🛠 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flow-pwa
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

3. Set up environment variables:
```bash
# Create .env file in server directory
cp server/.env.example server/.env
# Edit the .env file with your configuration
```

4. Start MongoDB:
```bash
mongod --dbpath /data/db
```

## 🚀 Quick Start

### Development Environment
```bash
# Start backend server
cd server
npm start

# Start frontend (new terminal)
firebase serve --only hosting --port 5000
```


## 📊 Project Structure

```
flow-pwa/
├── assets/                 # Static assets
│   ├── css/               # Stylesheets
│   └── js/                # JavaScript modules
├── auth/                  # Authentication pages
├── students/              # Student portal (47 pages)
├── institutions/          # Institution portal (15 pages)
├── counselors/            # Counselor portal (5 pages)
├── parents/               # Parent portal (12 pages)
├── recommenders/          # Recommender portal (2 pages)
├── get-started/           # Onboarding pages
├── server/                # Backend API
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── middleware/       # Custom middleware
│   └── config/           # Configuration files
└── firebase.json         # Firebase configuration
```

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/reset-password` - Password reset

### User Types
- `GET|POST /api/students/*` - Student operations
- `GET|POST /api/institutions/*` - Institution operations
- `GET|POST /api/counselors/*` - Counselor operations
- `GET|POST /api/parents/*` - Parent operations
- `GET|POST /api/recommenders/*` - Recommender operations

### System
- `GET /health` - Health check
- `GET /api/protected/*` - Protected routes

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/flow_pwa

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:3000
```

### Firebase Configuration
```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "destination": "http://localhost:3001/api/**"
      }
    ]
  }
}
```

## 📱 PWA Features

- Offline capability with service workers
- App-like experience on mobile devices
- Push notifications (planned)
- Background sync (planned)
- Add to home screen functionality

## 🔒 Security Features

- JWT-based authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Password encryption with bcrypt

## 📈 Performance

- Optimized for < 3s load times
- API responses < 1000ms average
- Canvas-based charts for smooth interactions
- Lazy loading for better performance
- Efficient database queries


## 🚀 Deployment

### Staging
```bash
firebase deploy --only hosting --project staging-project-id
```

### Production
```bash
firebase deploy --only hosting --project production-project-id
```

## 📚 Documentation

- [API Documentation](docs/api.md) (planned)
- [User Guides](docs/users/) (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Bug Reports

Please use the issue tracker to report bugs with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for educational institutions
- Focused on user experience and accessibility

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation

---

**Flow PWA** - Streamlining college applications for everyone involved in the process.