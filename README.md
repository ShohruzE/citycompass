# CityCompass

A comprehensive city exploration and discovery platform built with FastAPI and Next.js.

## 🏗️ Project Structure

```
citycompass/
├── backend/                 # FastAPI backend service
│   ├── app/                # Application code
│   ├── Dockerfile          # Backend container configuration
│   └── pyproject.toml      # Python dependencies
├── citycompass/            # Next.js frontend application
│   ├── app/                # Next.js app directory
│   ├── components/         # Reusable UI components
│   ├── Dockerfile          # Frontend production container
│   ├── Dockerfile.dev      # Frontend development container
│   └── package.json        # Node.js dependencies
├── ml/                     # Machine learning components
├── docker-compose.dev.yaml # Development environment
├── docker-compose.prod.yaml # Production environment
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Docker and Docker Compose** (required for running the full project)
- **Git** (for cloning the repository)

> **Note**: Node.js and Python are not required on your local machine since everything runs in Docker containers.

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ShohruzE/citycompass.git
   cd citycompass
   ```

2. **Start the development environment**

   ```bash
   # Start all services (database, backend, frontend, pgAdmin)
   docker-compose -f docker-compose.dev.yaml up --build
   ```

3. **Access the applications**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **pgAdmin (Database UI)**: http://localhost:5050

### Database Access

The application includes a PostgreSQL database and pgAdmin for database management:

1. **Access pgAdmin**: Go to http://localhost:5050
2. **Login credentials**:
   - Email: `admin@citycompass.com`
   - Password: `admin`
3. **Add database server**:
   - Right-click "Servers" → "Register" → "Server"
   - **General tab**: Name: `CityCompass DB`
   - **Connection tab**:
     - Host: `db`
     - Port: `5432`
     - Database: `citycompass`
     - Username: `citycompass`
     - Password: `citycompass`

### Environment Variables (Optional)

For full functionality including OAuth authentication, create a `.env` file in the `backend/` directory:

```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit with your OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
```

> **Note**: The application will run without OAuth credentials, but authentication features will be limited.

## 🛠️ Development Commands

### All Services

```bash
# Start all services
docker-compose -f docker-compose.dev.yaml up

# Rebuild and start all services
docker-compose -f docker-compose.dev.yaml up --build

# Stop all services
docker-compose -f docker-compose.dev.yaml down

# View logs for all services
docker-compose -f docker-compose.dev.yaml logs -f
```

### Backend Only

```bash
# Start backend only
docker-compose -f docker-compose.dev.yaml up backend

# Rebuild backend
docker-compose -f docker-compose.dev.yaml up --build backend

# View backend logs
docker-compose -f docker-compose.dev.yaml logs -f backend
```

### Frontend Only

```bash
# Start frontend only
docker-compose -f docker-compose.dev.yaml up frontend

# Rebuild frontend
docker-compose -f docker-compose.dev.yaml up --build frontend

# View frontend logs
docker-compose -f docker-compose.dev.yaml logs -f frontend
```

## 🏢 Services

### Backend (`/backend`)

- **Technology**: FastAPI, Python 3.12, SQLAlchemy
- **Purpose**: API server, business logic, data processing
- **Port**: 8000
- **Documentation**: http://localhost:8000/docs
- **Database**: PostgreSQL

### Frontend (`/citycompass`)

- **Technology**: Next.js 15, React 19, TypeScript
- **Purpose**: User interface, client-side logic
- **Port**: 3000
- **URL**: http://localhost:3000

### Database (`db`)

- **Technology**: PostgreSQL 16
- **Purpose**: Data persistence, user data, application state
- **Port**: 5432 (internal)
- **Credentials**: `citycompass:citycompass`
- **Database Name**: `citycompass`

### pgAdmin (`pgadmin`)

- **Technology**: pgAdmin 4
- **Purpose**: Database management and visualization
- **Port**: 5050
- **URL**: http://localhost:5050
- **Login**: `admin@citycompass.com` / `admin`

### Machine Learning (`/ml`)

- **Technology**: Python, scikit-learn, pandas
- **Purpose**: Data processing and ML models

## 🔧 Configuration

### Docker Configuration

- **Development**: `docker-compose.dev.yaml`
- **Production**: `docker-compose.prod.yaml`

## 📚 Documentation

- **Backend API**: http://localhost:8000/docs
- **Backend README**: [backend/README.md](./backend/README.md)
- **Frontend README**: [citycompass/README.md](./citycompass/README.md)
- **ML README**: [ml/README.md](./ml/README.md)
