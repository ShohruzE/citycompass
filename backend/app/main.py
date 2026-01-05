# FastAPI core imports
import json
import os
from fastapi import FastAPI, Depends, HTTPException, Request
from starlette import status
from typing import Annotated

# CORS middleware
from fastapi.middleware.cors import CORSMiddleware

# Database
from sqlalchemy.orm import Session
from app.models.models import Base
from app.core.db import engine, get_db

# API routers
from app.api import auth, ml, acs, survey, agent

# Session middleware for OAuth
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import HTMLResponse


import logging
from app.logger import setup_logging

setup_logging()

# Get logger
logger = logging.getLogger(__name__)

# initialize FastAPI App
app = FastAPI(
    title="CityCompass API",
    description="Backend API for CityCompass neighborhood survey and analytics",
    version="1.0.0",
)


# Adds session Middleware #document_further
SECRET_KEY = os.getenv("SECRET_KEY")
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    session_cookie="session",
    max_age=3600,
    same_site="lax",  # Important!
    https_only=False,
)

# allow all origins to communicate with backend
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://172.24.144.1:3000",
    "http://localhost:5173",  # Add Vite port if using Vite
    "http://127.0.0.1:5173",
    "http://172.24.144.1",
    "http://172.20.208.1:3000",
    "http://172.20.208.1",  # Add all potential frontend URLs
    "https://citycompass.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization"],
)


# Create database tables
Base.metadata.create_all(bind=engine)

# Dependencies
db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(auth.get_current_user)]

# Register routers (only with /api prefix)
app.include_router(auth.router, prefix="/api")
app.include_router(ml.router, prefix="/api")
app.include_router(acs.router, prefix="/api")
app.include_router(agent.router, prefix="/api")


# root will determine if a user session has been saved, if not it shows a link to to the login route
@app.get("/")
async def homepage(request: Request):
    user = request.session.get("user")
    if user:
        data = json.dumps(user)
        html = f'<pre>{data}</pre><a href="/logout">logout</a>'
        return HTMLResponse(html)
    return HTMLResponse(
        '<a href="/google-login">google-login</a><br><a href="/ms-login">ms-login</a>'
    )


@app.get("/user", status_code=status.HTTP_200_OK)
async def user(user: user_dependency, db: db_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    return {"User": user}


app.include_router(survey.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
