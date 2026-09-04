# FoodShare

A community-driven Progressive Web App (PWA) designed to connect people with surplus food to locals, student hostels, and shelters to reduce food waste.

Live Demo: [idp-blush.vercel.app](https://idp-blush.vercel.app/)

---

## Why I Built This

A lot of prepared food in college canteens and hostel messes gets thrown away at the end of the day simply because there is no quick way to let people nearby know it is available. I built FoodShare to make food donations and surplus pickups as simple as posting a quick notice on a board.

---

## What It Does

- **List Surplus Food**: Users can quickly post available food items with quantity, prepared time, pickup location, and expiry notes.
- **Browse & Claim**: Anyone nearby can browse active listings on a map-friendly feed and coordinate pickups.
- **Progressive Web App**: Can be added directly to a phone's home screen with offline asset caching via a custom Service Worker.
- **Mobile First**: Built with responsive CSS so it looks and feels like a native mobile app without downloading from an app store.

---

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Offline & PWA**: Web App Manifest, Service Worker (`sw.js`)
- **Backend / Server**: Node.js, Express (static asset serving and SPA routing)
- **Database**: Cloud Firestore for listing state
- **Deployment**: Vercel serverless integration

---

## Project Structure

```text
FoodShare/
├── public/
│   ├── index.html        # Main app single-page layout
│   ├── index.css         # Styling and mobile responsiveness
│   ├── app.js            # UI interactions and Firestore listing handlers
│   ├── manifest.json     # PWA metadata for home screen install
│   └── sw.js             # Service worker cache strategy
├── server.js             # Express static server and fallback routing
├── package.json          # Node.js dependencies and start scripts
├── vercel.json           # Serverless route rules
└── README.md             # Project documentation
```

---

## Running Locally

### 1. Clone the Repository
```bash
git clone https://github.com/ItzSaurav/FoodShare.git
cd FoodShare
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
The server will start at `http://localhost:3000`.

---

## License

MIT License. Free for open-source community use.
