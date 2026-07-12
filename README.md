# 🍲 FoodShare

> **Connecting communities, one meal at a time.**

FoodShare is a community-driven web application designed to reduce food waste and help those in need by allowing locals to share surplus food. It's built with a focus on simplicity, responsiveness, and performance as a Progressive Web App (PWA).

## 🚀 What It Does

FoodShare gives users a platform to:
- Browse available food listings in their local area.
- Share their own surplus food to prevent waste.
- Experience a seamless app-like interface directly in the browser.

## 🛠 Tech Stack

I kept things lightweight and modern for this one:
- **Architecture:** Client-side PWA interfacing with Firebase.
- **Static Server:** Node.js, Express 5 (used purely for serving static assets and handling SPA fallback routing).
- **Frontend:** Vanilla HTML/CSS/JS (PWA-enabled with a custom Service Worker and Manifest).
- **Deployment:** Vercel (serverless configuration out of the box).

## 💻 Getting Started Locally

Want to run it on your own machine? It's as simple as it gets.

1. **Clone the repo:**
   ```bash
   git clone https://github.com/ItzSaurav/FoodShare.git
   cd FoodShare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   *The app will be running at `http://localhost:3000` (or whatever port you set in your environment).*

## 🌍 Deployment

This project is configured for seamless deployment on Vercel. 
Just connect your GitHub repo to Vercel, and the `vercel.json` file handles routing all requests to the Express server function (`server.js`).

---
*Built by [Saurav](https://github.com/ItzSaurav) – Backend Developer & Automation Enthusiast.*