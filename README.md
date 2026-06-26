# Secure Notes Dashboard

A responsive notes management app with authentication, search, and note CRUD operations.

## Run locally

Prerequisites: Node.js

1. Install dependencies:
   `npm install`
2. Start the app:
   `npm run dev`

## Deployment

### Render (backend)
1. Push this repository to GitHub.
2. Create a new Web Service on Render.
3. Connect the repo and choose the root folder.
4. Set the build command to `npm install && npm run build`.
5. Set the start command to `npm start`.
6. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `JWT_SECRET=<your-secret>`
   - `MONGODB_URI=<your-mongodb-connection-string>`
   - `DIRECT_MONGODB_URI=<optional-direct-connection-string>`

### Vercel (frontend)
1. Import the same repo into Vercel.
2. Set the project root to the repository root.
3. Add environment variable:
   - `VITE_API_URL=https://your-render-app-url.onrender.com`
4. Deploy.

### Notes
- The app uses MongoDB when a connection string is provided; otherwise it falls back to local JSON storage.
- For Vercel, the frontend will call your Render backend through `VITE_API_URL`.
