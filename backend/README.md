# CityCompass Backend

A FastAPI-based backend service for the CityCompass application.

## �� Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for local development)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ShohruzE/citycompass.git
   cd citycompass
   ```

2. **Start the development environment**

   ```bash
   # Using Docker Compose (recommended)
   docker-compose -f docker-compose.dev.yaml up --build

   # Or for local development
   cd backend
   uv sync
   fastapi dev app/main.py
   ```

3. **Access the application**
   - API: http://localhost:8000
   - Interactive API docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

## 🛠️ Development Commands

### Docker Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yaml up

# Rebuild and start
docker-compose -f docker-compose.dev.yaml up --build

# Stop services
docker-compose -f docker-compose.dev.yaml down
```

### Local Development
```bash
# Install dependencies
uv sync

# Start development server
fastapi dev app/main.py
```
