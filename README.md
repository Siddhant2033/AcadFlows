# 🏫 School Platform MVP - Complete Documentation

> A production-ready Multi-Tenant School Management System built with MERN Stack

[https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge\&logo=typescript\&logoColor=white)
[https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
[https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge\&logo=node.js\&logoColor=white)
[https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge\&logo=mongodb\&logoColor=white)
[https://img.shields.io/badge/Tailwind\_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)

---

## 📋 Table of Contents

- Overview
- Features
- Technology Stack
- Project Structure
- Installation
- Environment Variables
- Database Seeding
- Test Credentials
- API Documentation
- Deployment
- Contributing
- License

---

## 🎯 Overview

**School Platform** is a complete, production-ready multi-tenant school management system built as an MVP to validate the product concept. The platform allows schools to manage students, teachers, attendance, fees, assignments, timetables, and communication in one centralized system.

### Key Features

- 🏫 **Multi-tenant Architecture** - Each school has isolated data
- 👥 **Role-based Access** - Admin, Teacher, Student, Guardian
- 🌓 **User-friendly Design** - Modern UI with light/dark themes
- 🚀 **Scalable Foundation** - Built to migrate to microservices later
- 🇮🇳 **India-Ready** - Configured for Indian schools with INR, IST, and Indian phone codes

---

## ✨ Features

### ✅ Completed Features

| **Module** | **Features**       |                                                                               |
| ------------------------ | ----------------------------------------------------------------------------- |
| **Authentication**       | JWT with refresh tokens, HTTP-only cookies, Role-based access, Password reset |
| **Multi-Tenant**         | Tenant isolation, 10-digit school codes, Subdomain support                    |
| **Registration**         | 3-step flow (School Code → Role → Details), Role-specific forms               |
| **School Management**    | School registration, Auto-generated school codes                              |
| **Student Management**   | CRUD, Roll number system, Guardian verification, Bulk import (CSV)            |
| **Teacher Management**   | CRUD, Employee records, Subject assignments, Leave management                 |
| **Academic Management**  | Academic Years, Grades, Sections, Subjects, Class schedules                   |
| **Attendance System**    | Daily attendance, Reports, Student/Teacher tracking, Notifications            |
| **Fee Management**       | Fee structures, Invoice generation, Payment tracking, Discounts               |
| **Assignment & Grading** | Create assignments, Submit work, Grade submissions, Report cards              |
| **Timetable Management** | Create timetables, Room allocation, Conflict detection, Week/Day view         |
| **Communication**        | In-app notifications, Announcements, Parent-teacher messaging                 |
| **Profile Management**   | Profile picture upload, Change password, Update personal info                 |
| **Dashboard**            | Role-specific dashboards, Quick actions, Statistics cards                     |
| **Theme System**         | Light/Dark mode, Persistent preference                                        |

---

## 🛠️ Technology Stack

### Frontend

| **Technology** | **Purpose** |               |
| --------------------- | ------------- |
| React 18              | UI Framework  |
| TypeScript            | Type Safety   |
| Vite                  | Build Tool    |
| Tailwind CSS          | Styling       |
| React Router v6       | Routing       |
| Axios                 | API Client    |
| React Hook Form       | Form Handling |
| Zod                   | Validation    |

### Backend

| **Technology** | **Purpose** |                  |
| --------------------- | ---------------- |
| Node.js               | Runtime          |
| Express               | Web Framework    |
| TypeScript            | Type Safety      |
| MongoDB               | Database         |
| Mongoose              | ODM              |
| JWT                   | Authentication   |
| Bcrypt                | Password Hashing |
| Multer                | File Upload      |

### Deployment

- **Frontend**: Vercel (Free Tier)
- **Backend**: Render (Free Tier)
- **Database**: MongoDB Atlas (M0 Free Tier)

---

## 📁 Project Structure

```text
school-platform/
├── apps/
│   ├── api/                      # Backend (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── config/           # Configuration files
│   │   │   ├── middleware/       # Auth, tenant, error handling
│   │   │   ├── models/           # MongoDB schemas
│   │   │   ├── modules/          # Feature modules
│   │   │   │   ├── auth/         # Authentication
│   │   │   │   ├── tenants/      # Multi-tenant management
│   │   │   │   ├── users/        # User management
│   │   │   │   ├── students/     # Student management
│   │   │   │   ├── teachers/     # Teacher management
│   │   │   │   ├── academics/    # Academic management
│   │   │   │   ├── attendance/   # Attendance system
│   │   │   │   ├── fees/         # Fee management
│   │   │   │   ├── assignments/  # Assignment & grading
│   │   │   │   ├── timetable/    # Timetable management
│   │   │   │   └── communication/# Notifications & messaging
│   │   │   ├── scripts/          # Seed scripts
│   │   │   └── utils/            # Utility functions
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── web/                      # Frontend (React + TypeScript)
│       ├── src/
│       │   ├── components/       # Reusable components
│       │   ├── contexts/         # React contexts (Auth, Theme, Tenant)
│       │   ├── lib/              # API client, utilities
│       │   ├── pages/            # Page components
│       │   └── styles/           # Theme configuration
│       ├── .env.example
│       └── package.json
│
├── packages/
│   └── shared/                   # Shared TypeScript types
│       └── src/types/
│
├── .github/workflows/            # CI/CD workflows
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB 6+
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/school-platform.git
cd school-platform

# 2. Install pnpm (if not installed)
npm install -g pnpm

# 3. Install all dependencies
pnpm install

# 4. Build shared types
pnpm build --filter @school-platform/shared

# 5. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 6. Edit .env files with your configuration

# 7. Start MongoDB (local)
mongod --dbpath /path/to/data

# 8. Seed the database with India test data
cd apps/api
pnpm seed:india

# 9. Start development servers
cd ../..
pnpm dev

# 10. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
```

---

## 🔧 Environment Variables

### Backend (`apps/api/.env`)

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/school-platform

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# India Specific Settings
TIMEZONE=Asia/Kolkata
CURRENCY=INR
CURRENCY_SYMBOL=₹
COUNTRY=India
PHONE_CODE=+91
DATE_FORMAT=DD/MM/YYYY
```


### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🗄️ Database Seeding

### Seed with India Test Data

```bash
cd apps/api
pnpm seed:india
```


This creates:

- **School**: Delhi Public School, Noida
- **Academic Year**: 2024-25
- **Grades**: Class 1 to Class 12
- **Sections**: A & B for each class
- **Subjects**: Mathematics, Science, English, Hindi, Social Studies, etc.
- **Users**: 1 Admin, 6 Teachers, 10 Students, 5 Guardians

### Seed Commands

| **Command** | **Description** |                            |
| ---------------------- | -------------------------- |
| `pnpm seed:india`      | Complete India test data   |
| `pnpm seed:tenant`     | Create default tenant only |
| `pnpm seed:schools`    | Create multiple schools    |

---

## 🔑 Test Credentials

| **Role** | **Email** | **Password** |                                       |                 |
| --------------------- | ------------------------------------- | --------------- |
| **Admin**             | `principal@dpsnoida.edu.in`           | `Admin@2024`    |
| **Teacher**           | `priya.sharma@dpsnoida.edu.in`        | `Teacher@2024`  |
| **Student**           | `arjun.mehta@student.dpsnoida.edu.in` | `Student@2024`  |
| **Guardian**          | `guardian1@dpsnoida.edu.in`           | `Guardian@2024` |

### School Code

```text
AB12-CD34-EF
```


(Replace with the actual code shown after seeding)

---

## 📡 API Documentation

### Authentication Endpoints

| **Method** | **Endpoint** | **Description** |                                |                        |
| ----------------------------- | ------------------------------ | ---------------------- |
| POST                          | `/api/v1/auth/register`        | Register new user      |
| POST                          | `/api/v1/auth/login`           | Login user             |
| POST                          | `/api/v1/auth/refresh`         | Refresh access token   |
| POST                          | `/api/v1/auth/logout`          | Logout user            |
| GET                           | `/api/v1/auth/me`              | Get current user       |
| POST                          | `/api/v1/auth/forgot-password` | Request password reset |
| POST                          | `/api/v1/auth/reset-password`  | Reset password         |

### Core Endpoints

| **Module** | **Endpoint Prefix** |                         |
| ------------------------- | ----------------------- |
| Tenants                   | `/api/v1/tenants`       |
| Users                     | `/api/v1/users`         |
| Students                  | `/api/v1/students`      |
| Teachers                  | `/api/v1/teachers`      |
| Academics                 | `/api/v1/academic`      |
| Attendance                | `/api/v1/attendance`    |
| Fees                      | `/api/v1/fees`          |
| Assignments               | `/api/v1/assignments`   |
| Timetable                 | `/api/v1/timetable`     |
| Communication             | `/api/v1/communication` |
| Dashboard                 | `/api/v1/dashboard`     |

---

## 🚢 Deployment

### Backend (Render)

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set build command: `pnpm install && pnpm build:api`
5. Set start command: `pnpm start:api`
6. Add environment variables

### Frontend (Vercel)

1. Push your code to GitHub
2. Import repository in Vercel
3. Set build command: `pnpm build:web`
4. Set output directory: `apps/web/dist`
5. Add environment variables

### Deployment Files

```yaml
# render.yaml
services:
  - type: web
    name: school-platform-api
    env: node
    buildCommand: pnpm install && pnpm build:api
    startCommand: pnpm start:api
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
```

---

## 📊 Feature Roadmap

### ✅ Completed (MVP)

- Authentication System
- Multi-tenant Architecture
- Registration Flow
- Student Management
- Teacher Management
- Academic Management
- Profile Management
- Dashboard System
- Theme System
- Attendance System
- Fee Management
- Assignment & Grading
- Timetable Management
- Communication System

### 🚧 Future Enhancements

- Mobile App (React Native)
- Live Payment Gateway
- Advanced Analytics
- AI-powered Recommendations
- Mobile Push Notifications
- WhatsApp Integration
- Multi-Campus Support
- Internationalization (i18n)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow TypeScript strict mode
- **Commits**: Conventional commits
- **Testing**: Write tests for new features
- **Documentation**: Update README for API changes

---

## 📄 License

This project is proprietary and confidential.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 📞 Support

### Documentation

- [MongoDB Docs](https://docs.mongodb.com/)
- [Express Docs](https://expressjs.com/)
- [React Docs](https://reactjs.org/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

## 🎉 Summary

**School Platform** is a complete, production-ready school management system with:

✅ 15+ Core Features
✅ Multi-tenant Architecture
✅ Role-based Access Control
✅ India-Ready Configuration
✅ Light/Dark Theme
✅ Complete REST API
✅ Modern React Frontend
✅ TypeScript Throughout

---

## 📸 Screenshots

### Landing Page

[https://via.placeholder.com/800x400?text=Landing+Page](https://via.placeholder.com/800x400?text=Landing+Page)

### Admin Dashboard

[https://via.placeholder.com/800x400?text=Admin+Dashboard](https://via.placeholder.com/800x400?text=Admin+Dashboard)

### Student Management

[https://via.placeholder.com/800x400?text=Student+Management](https://via.placeholder.com/800x400?text=Student+Management)

### Dark Mode

[https://via.placeholder.com/800x400?text=Dark+Mode](https://via.placeholder.com/800x400?text=Dark+Mode)

---

**Made with ❤️ for Indian Schools**

---

## 🏷️ Tags

`school-management` `education` `react` `nodejs` `mongodb` `typescript` `multi-tenant` `india` `mern-stack` `tailwindcss` `attendance` `fee-management` `grading-system` `timetable` `communication` `school-erp`
