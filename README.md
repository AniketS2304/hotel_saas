# ScanDine (Hotel Management SaaS)

ScanDine is a multi-tenant SaaS application designed to streamline restaurant and hotel dining operations. It features QR-code based menu browsing and ordering for customers, and real-time order management for staff.

## Architecture

The application is built with a modern stack separated into a frontend and backend:

### Frontend
- **Framework:** React with Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** React Query (@tanstack/react-query)
- **Routing:** React Router
- **Real-time:** Native WebSockets

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL with SQLAlchemy (Async)
- **Real-time:** WebSockets for live order updates
- **Server:** Uvicorn

## Features

- **Multi-Tenancy:** Single codebase and deployment serving multiple restaurants. Data is strictly isolated using `restaurant_id` foreign keys.
- **Role-Based Access Control:**
  - **Admin:** Can manage menus, tables, view analytics, and approve/cancel incoming orders.
  - **Waiter:** Can view active orders and mark approved orders as served.
  - **Customer:** Can browse menus via QR code, place orders, and track order status in real-time.
  - *(Kitchen role is currently disabled in the simplified workflow).*
- **Real-Time Updates:** Orders and status changes are broadcasted live to the respective restaurant's dashboard via WebSockets.
- **Order Lifecycle (Simplified Workflow):**
  1. Customer places an order (`pending`).
  2. Admin approves the order (`accepted`).
  3. Waiter delivers the order to the table and marks it (`served`).

## Setup and Development

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (or Docker for running a local instance)

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Configure your `.env` file with database credentials.
6. Run database migrations (if applicable) or ensure the schema is created.
7. Start the server: `python -m uvicorn app.main:app --port 8000 --reload`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Deployment

The application is designed for PaaS deployment:
- **Frontend:** Configured for deployment on Vercel (`vercel.json` included for client-side routing).
- **Backend:** Suitable for Render or similar platforms.
- **Database:** Supabase or any managed PostgreSQL provider.
