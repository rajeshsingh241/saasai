# 🤖 AI Multi-Model SaaS Platform

> Your personal AI workspace powered by multiple AI models ✨

🎬 **App Demo:**

https://github.com/user-attachments/assets/24619db7-4db8-4081-bea9-0c41799c3d2b

---
## 🚀 Live Demo
👉 [Click here to try the live app](https://saasai-mutli-modal-l7wf8k0q5-rajeshs-projects-d4731235.vercel.app/)

An advanced **AI-powered multi-model SaaS platform** that brings together multiple AI models (ChatGPT, Claude, Gemini, etc.) into a single chat experience.  
Built with **Next.js, Shadcn UI, Clerk, Arcjet, and Firebase**, this app combines performance, security, and intelligent automation — all in one place.

---

## ✨ Key Features

- 💬 **Multi-AI Chat System** — Seamlessly chat with different AI models from a unified interface.
- 👤 **User Authentication** — Secure login and registration powered by [Clerk](https://clerk.com).
- 🔐 **Rate Limiting & Protection** — Managed by [Arcjet](https://arcjet.com) to prevent abuse and spam.
- 🧠 **AI Utilities** — Generate content, summarize text, analyze data, and more.
- 🌗 **Dark / Light Mode** — Modern theme toggle using Shadcn/UI components.
- ⚡ **Real-Time Database** — Integrated with [Firebase Firestore](https://firebase.google.com) for fast, scalable data handling.
- 🧩 **Modular Architecture** — Clean and maintainable SaaS folder structure.
- 🚀 **Deployed on Vercel** — Optimized for scalability and production readiness.

---

## 🧰 Tech Stack

| Layer | Technology Used |
|--------|----------------|
| **Frontend** | [Next.js 14](https://nextjs.org) + [React](https://react.dev) |
| **UI / Styling** | [Shadcn/UI](https://ui.shadcn.com), [TailwindCSS](https://tailwindcss.com) |
| **Authentication** | [Clerk](https://clerk.com) |
| **Database** | [Firebase Firestore](https://firebase.google.com) |
| **Security / Rate Limiting** | [Arcjet](https://arcjet.com) |
| **Hosting** | [Vercel](https://vercel.com) |
| **Language** | JavaScript / TypeScript |
| **Developer** | [@kravixstudio](https://github.com/kravixstudio) (Rajesh Kumar) |

---

## ⚙️ Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/rajeshsingh241/AI-Multi-Model-Saas-.git
cd AI-Multi-Model-Saas-
npm install
# 2️ Create .env file
Create a `.env.local` file in the root folder and add your keys:

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
ARCJET_API_KEY=your_arcjet_key
and many more api involved ...

# 3️ Run the development server
npm run dev
