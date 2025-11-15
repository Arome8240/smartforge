# Setup Instructions

## Quick Start

1. **Install dependencies**

   ```bash
   # Frontend
   pnpm install

   # Backend
   cd backend
   pnpm install
   cd ..
   ```

2. **Set up Privy**

   - Go to [privy.io](https://privy.io) and create an account
   - Create a new app
   - Copy your App ID and App Secret
   - Add `http://localhost:3000` to allowed origins

3. **Configure environment variables**

   - Copy `.env.example` to `.env.local` in root
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your Privy credentials

4. **Start MongoDB**

   ```bash
   mongod
   # Or use MongoDB Atlas cloud service
   ```

5. **Run the application**

   ```bash
   # Terminal 1 - Backend
   cd backend
   pnpm dev

   # Terminal 2 - Frontend
   pnpm dev
   ```

6. **Open browser**
   - Navigate to http://localhost:3000
   - Connect your wallet or sign in with email

## Installing Privy Packages

If you see errors about missing `@privy-io/react-auth`, run:

```bash
pnpm add @privy-io/react-auth @privy-io/wagmi viem wagmi
```

## Database Setup

The app uses MongoDB. You can either:

1. **Local MongoDB**: Install and run `mongod`
2. **MongoDB Atlas**: Use the cloud service and update `MONGODB_URI` in `backend/.env`

## Troubleshooting

### Privy Authentication Errors

- Ensure your Privy App ID is correct
- Check that `http://localhost:3000` is in allowed origins
- Verify your App Secret matches in backend `.env`

### API Connection Errors

- Make sure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Verify CORS settings in `backend/src/app.ts`

### Database Connection Errors

- Ensure MongoDB is running
- Check `MONGODB_URI` in `backend/.env`
- Verify network connectivity if using Atlas
