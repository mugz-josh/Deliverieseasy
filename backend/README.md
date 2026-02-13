# Deliveries App Backend

Backend API for the Deliveries App built with Node.js, Express, and PostgreSQL.

## Features

- User authentication and authorization
- Delivery management (CRUD operations)
- Real-time delivery tracking
- User roles (customer, rider, admin)
- PostgreSQL database with PostGIS for location tracking

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env`:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/deliveries_db
     JWT_SECRET=your_super_secret_jwt_key_here
     PORT=5000
     ```

4. Set up the database:
   - Create a PostgreSQL database named `deliveries_db`
   - Run the SQL script in `database.sql` to create tables and sample data

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Deliveries
- `GET /api/deliveries` - Get all deliveries
- `GET /api/deliveries/:id` - Get delivery by ID
- `POST /api/deliveries` - Create new delivery
- `PUT /api/deliveries/:id/status` - Update delivery status
- `PUT /api/deliveries/:id/location` - Update delivery location

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/riders/active` - Get active riders
- `PUT /api/users/:id/role` - Update user role (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Deployment to Render

1. Create a new PostgreSQL database on Render
2. Update your `.env` file with the Render database URL
3. Push your code to GitHub
4. Create a new Web Service on Render:
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables from your `.env` file
5. Deploy!

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration time (default: 7d)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Frontend URL for CORS

## Database Schema

The database consists of three main tables:
- `users` - User accounts with roles
- `deliveries` - Delivery records
- `delivery_logs` - Status change history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
