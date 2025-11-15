# SmartForge - Web3 Contract Builder

A platform similar to Supabase but for smart contracts. Developers can sign up with their wallets, create projects, choose smart-contract templates, edit contract logic in a structured editor, and deploy using gasless transactions.

## Features

- 🔐 **Wallet Authentication** - Sign in with Privy (wallet, email, SMS)
- 📝 **Contract Editor** - Full-screen Solidity editor with syntax highlighting
- 🎨 **Templates** - ERC20, ERC721, and Custom contract templates
- 🚀 **Gasless Deployment** - Deploy contracts without paying gas fees
- 💰 **Pricing Tiers** - Free (1 project) and Pro (unlimited) plans
- 🎯 **Project Management** - Create, edit, and manage your smart contracts

## Tech Stack

### Frontend

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** components
- **Privy** for authentication
- **TanStack Query** for data fetching
- **Zod** for validation

### Backend

- **Express.js** with TypeScript
- **MongoDB** with Mongoose
- **Privy Server SDK** for auth validation

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- MongoDB (local or cloud)
- Privy account (for authentication)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smartforge
   ```

2. **Install frontend dependencies**

   ```bash
   pnpm install
   ```

3. **Install backend dependencies**

   ```bash
   cd backend
   pnpm install
   cd ..
   ```

4. **Set up environment variables**

   Create `.env.local` in the root directory:

   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

   Create `backend/.env`:

   ```env
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_app_secret
   MONGODB_URI=mongodb://localhost:27017/smartforge
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

5. **Set up Privy**

   - Sign up at [privy.io](https://privy.io)
   - Create a new app
   - Copy your App ID and App Secret
   - Add `http://localhost:3000` to allowed origins

6. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod
   ```

7. **Start the development servers**

   Terminal 1 (Backend):

   ```bash
   cd backend
   pnpm dev
   ```

   Terminal 2 (Frontend):

   ```bash
   pnpm dev
   ```

8. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
smartforge/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── project/           # Project pages
│   │   │   └── [id]/
│   │   │       └── editor/   # Contract editor
│   │   ├── pricing/           # Pricing page
│   │   └── page.tsx           # Home page (project list)
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities
│   ├── providers/             # Context providers
│   └── schemas/               # Zod schemas
├── backend/
│   └── src/
│       ├── controllers/       # Route controllers
│       ├── models/            # MongoDB models
│       ├── routes/            # Express routes
│       ├── services/          # Business logic
│       ├── middleware/        # Auth middleware
│       └── config/            # Configuration
└── public/                     # Static assets
```

## API Endpoints

### Projects

- `POST /api/projects` - Create a new project
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/deploy` - Deploy contract (gasless)

All endpoints require Privy authentication token in the `Authorization: Bearer <token>` header.

## Pricing Plans

### Free Tier

- 1 project maximum
- Basic templates (ERC20, ERC721, Custom)
- Community support
- Standard deployments

### Pro Tier ($29/month)

- Unlimited projects
- Advanced templates
- Faster deployments
- Priority support
- Gasless transactions
- Collaborative editing (coming soon)
- Version history

## Development

### Frontend Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

### Backend Scripts

```bash
cd backend
pnpm dev      # Start development server with hot reload
pnpm build    # Build TypeScript
pnpm start    # Start production server
```

## Environment Variables

### Frontend (.env.local)

- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy App ID
- `NEXT_PUBLIC_API_URL` - Backend API URL

### Backend (.env)

- `PRIVY_APP_ID` - Privy App ID
- `PRIVY_APP_SECRET` - Privy App Secret
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
