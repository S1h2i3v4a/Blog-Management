# 📝 Blog Management System (BMS)

Full-stack Blog Management System split into **Frontend** and **Backend** for seamless deployment on **Vercel** and **Render**.

```
Blog-Management/
├── backend/            # Express.js REST API + Socket.io + MongoDB (Deploy on Render)
├── frontend/           # Static HTML/CSS/JS frontend (Deploy on Vercel)
├── .gitignore
└── README.md
```

---

## 🚀 Deployment

### 1. Backend (Render)
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node index.js`
- **Environment Variables:**
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `SESSION_SECRET`
  - `EMAIL_USER`
  - `EMAIL_PASSWORD`
  - `FRONTEND_URL`

### 2. Frontend (Vercel)
- **Root Directory:** `frontend`
- **Framework Preset:** `Other`
- **Configuration:** Handled via `vercel.json`
- Update `frontend/js/config.js` with your Render backend URL.

---

## 🛠️ Tech Stack
- **Frontend:** Vanilla HTML5, CSS3, Bootstrap 5, JavaScript (Fetch API + Socket.io Client)
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT Authentication, Multer, Winston
