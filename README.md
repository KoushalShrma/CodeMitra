# CodeMitra

**CodeMitra** is an AI-powered coding education and assessment platform that teaches students **how to think** about problems, not just pass test cases.

## 🎯 Features

### For Students
- **Pattern-Based Learning**: Problems organized by coding patterns (Arrays, Two Pointers, Sliding Window, DP, etc.)
- **Three-Stage Progression**: Progress from Brute Force → Improved → Optimal solutions
- **AI-Powered Hints**: Get contextual hints that guide your thinking (time/attempt gated)
- **Monaco Code Editor**: Full-featured code editor with syntax highlighting
- **Multi-language Support**: Python, Java, JavaScript, C++
- **Gamification**: Streaks, badges, and progress tracking

### For Instructors
- **Secure Assessments**: Create timed coding tests with auto-grading
- **Anti-Cheating**: Tab switch detection and proctoring events
- **Analytics Dashboard**: Track student progress and identify weak patterns
- **Problem Bank Management**: Create and manage coding problems

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React.js (JavaScript), Vite, Tailwind CSS |
| Backend | Java Spring Boot |
| Database | MySQL (H2 for development) |
| Authentication | Clerk |
| Code Execution | Piston API |
| AI Hints | Groq API |

## 📁 Project Structure

```
CodeMitra/
├── backend/                    # Spring Boot Backend
│   ├── src/main/java/com/codemitra/
│   │   ├── config/            # Security & app configuration
│   │   ├── controller/        # REST API controllers
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── filter/            # JWT authentication filter
│   │   ├── model/             # JPA entities
│   │   ├── repository/        # Data access layer
│   │   ├── service/           # Business logic
│   │   └── util/              # Utility classes
│   ├── src/main/resources/
│   │   ├── application.yml    # App configuration
│   │   └── db/migration/      # Flyway migrations
│   └── pom.xml
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # React context
│   │   └── utils/             # Utility functions
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- MySQL 8+ (or use H2 for development)
- Maven 3.8+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Configure environment variables (or use application.yml defaults):
```bash
export DATABASE_URL=jdbc:mysql://localhost:3306/codemitra
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=yourpassword
export CLERK_JWKS_URL=https://your-clerk-instance.clerk.accounts.dev/.well-known/jwks.json
export GROQ_API_KEY=your_groq_api_key
```

3. Run the application:
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your Clerk publishable key:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_API_URL=http://localhost:8080/api
```

5. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 📚 API Endpoints

### Authentication
- `POST /api/users` - Create/sync user from Clerk
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile

### Problems
- `GET /api/problems` - List problems with filters
- `GET /api/problems/{id}` - Get problem details
- `POST /api/problems` - Create problem (Instructor/Admin)

### Submissions
- `POST /api/submissions/run` - Run code (sample test)
- `POST /api/submissions` - Submit code (all tests)

### Hints
- `POST /api/hints/request` - Request AI hint (time/attempt gated)

### Tests
- `GET /api/tests` - List available tests
- `GET /api/tests/{id}` - Get test details
- `POST /api/tests` - Create test (Instructor/Admin)
- `POST /api/tests/{id}/start` - Start test attempt

### Dashboard
- `GET /api/dashboard/student` - Student analytics
- `GET /api/dashboard/instructor` - Instructor analytics

## 🔐 Security

- JWT-based authentication via Clerk
- Role-based access control (Student, Instructor, Admin)
- Sandboxed code execution via Piston API
- Input validation and sanitization
- CORS configuration for API security

## 📈 Database Schema

Key entities:
- `users` - User profiles linked to Clerk
- `problems` - Coding problems with patterns
- `problem_stages` - Brute/Improved/Optimal stage info
- `submissions` - Code submissions and results
- `hints` - AI-generated hints per user/problem
- `user_progress` - Stage completion tracking
- `tests` - Institutional assessments
- `test_participants` - Test attempt tracking

## 🎮 Gamification

- **Streaks**: Track consecutive days of coding
- **Badges**: Earn achievements for milestones
- **Progress Bars**: Pattern-wise completion tracking
- **Leaderboards**: Compare with peers (coming soon)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is part of a college major project.

---

Built with ❤️ by CodeMitra Team