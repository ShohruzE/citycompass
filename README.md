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

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.12+ (for backend development)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ShohruzE/citycompass.git
   cd citycompass
   ```

2. **Start the development environment**

   ```bash
   # Start both backend and frontend
   docker-compose -f docker-compose.dev.yaml up --build

   # Or start specific services
   docker-compose -f docker-compose.dev.yaml up backend
   docker-compose -f docker-compose.dev.yaml up frontend
   ```

3. **Access the applications**
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8000/docs

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

- **Technology**: FastAPI, Python 3.12
- **Purpose**: API server, business logic, data processing
- **Port**: 8000
- **Documentation**: http://localhost:8000/docs

### Frontend (`/citycompass`)

- **Technology**: Next.js 15, React 19, TypeScript
- **Purpose**: User interface, client-side logic
- **Port**: 3000
- **URL**: http://localhost:3000

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
