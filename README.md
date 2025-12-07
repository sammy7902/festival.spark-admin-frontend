# Billify Frontend

Production-ready React + TypeScript frontend for the Billify bill management system.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Zod** - Schema validation
- **Sonner** - Toast notifications
- **Lucide React** - Icons
- **Radix UI** - Accessible UI primitives

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Installation

1. Install dependencies:

```bash
pnpm install
# or
npm install
```

2. Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:

```env
VITE_API_BASE_URL=http://localhost:5004/api
```

For production, replace with your backend URL:
```env
VITE_API_BASE_URL=https://your-backend-url.com/api
```

### Development

Start the development server:

```bash
pnpm dev
# or
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

### Build

Build for production:

```bash
pnpm build
# or
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
pnpm preview
# or
npm run preview
```

## Project Structure

```
billify-frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (Button, Input, Card, etc.)
│   │   ├── layout/       # Layout components (Sidebar, Header, AppLayout)
│   │   ├── forms/        # Form components (BillStepper)
│   │   └── charts/       # Chart components (SimpleArea)
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Earnings.tsx
│   │   └── GenerateBill.tsx
│   ├── routes/           # Route configuration
│   ├── store/            # State management (auth store)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Library configurations (axios, queryClient)
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global styles
├── .env.example          # Environment variables template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Features

### Authentication
- JWT-based authentication
- Protected routes
- Auto-logout on 401 errors
- Token stored in localStorage

### Dashboard
- Overview cards (Total bills, Total revenue, Today's revenue, Last 7 days)
- Revenue trend chart (last 7 days)

### Earnings
- Date range filtering
- Paginated bill list
- Total earnings summary

### Generate Bill
- 3-step wizard:
  1. Select Category & Subcategory
  2. Add Items (with runtime price/quantity)
  3. Customer Details & Review
- PDF download
- Copy PDF link
- Email notifications (via backend)

## API Integration

The frontend communicates with the backend API at the URL specified in `VITE_API_BASE_URL`.

### Endpoints Used

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/categories` - List categories
- `GET /api/categories/:id/subcategories` - List subcategories
- `GET /api/items?subcategoryId=...` - List items
- `POST /api/bills` - Create bill
- `GET /api/earnings/summary` - Get earnings summary
- `GET /api/earnings/total` - Get total earnings

## CORS Configuration

Ensure your backend CORS settings allow requests from your frontend origin.

For local development:
- Frontend: `http://localhost:5173`
- Backend CORS should allow: `http://localhost:5173`

For production:
- Update `FRONTEND_URL` in backend `.env` to match your frontend URL
- Or use `CORS_ALLOWED_ORIGINS` (comma-separated) in backend `.env`

See `ANALYSIS.md` in the backend folder for CORS configuration details.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5004/api` |

## TypeScript

The project uses strict TypeScript. All API types are defined in `src/types/api.ts` based on the backend API structure.

## Styling

- Tailwind CSS for utility-first styling
- No gradients (as per requirements)
- Neutral color palette
- High contrast for accessibility
- Responsive design (360px+)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment to Netlify

### Prerequisites

1. Push your code to GitHub repository
2. Have a Netlify account (sign up at https://netlify.com)

### Steps

1. **Push code to GitHub:**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/sammy7902/festival.spark-admin-frontend.git
git push -u origin main
```

2. **Connect to Netlify:**

   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Netlify will auto-detect the build settings from `netlify.toml`

3. **Configure Environment Variables:**

   - In Netlify dashboard, go to Site settings → Environment variables
   - Add the following variable:
     - `VITE_API_BASE_URL` = `https://your-backend-url.com/api`
     - Replace with your actual backend URL (e.g., `https://festive-spark-admin-backend.onrender.com/api`)

4. **Deploy:**

   - Netlify will automatically build and deploy
   - Build command: `npm run build` (from netlify.toml)
   - Publish directory: `dist` (from netlify.toml)

5. **Update Backend CORS:**

   - In your backend `.env`, update `FRONTEND_URL` to include your Netlify URL:
   ```env
   FRONTEND_URL=https://your-netlify-site.netlify.app
   ```

### Netlify Configuration

The `netlify.toml` file is already configured with:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirects (all routes → index.html)
- Security headers
- Cache headers for assets

### Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow Netlify's DNS configuration instructions

## License

ISC

