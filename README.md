# FoodShare

A Progressive Web App (PWA) prototype designed for community-based surplus food sharing to reduce food waste.

## Overview

FoodShare is a client-side web application built with vanilla JavaScript and Firebase. It provides a platform for individuals and local businesses to list surplus food for pickup.

## Features

- **Surplus Listings**: Post and browse available food items with pickup location and expiration info.
- **Firebase Integration**: User authentication and real-time Firestore database queries.
- **Progressive Web App**: Service Worker caching (`sw.js`) and web app manifest (`manifest.json`) for installability.
- **Static Express Server**: Lightweight Node.js server for serving static assets and handling SPA fallback.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend Services**: Firebase Authentication, Cloud Firestore
- **Server**: Node.js, Express
- **Deployment**: Vercel

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ItzSaurav/FoodShare.git
   cd FoodShare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

## License

MIT License.
