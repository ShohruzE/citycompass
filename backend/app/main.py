# The following libraries will allow FastAPI to run, create classes and create exceptions
import json
import os
from fastapi import FastAPI, Depends, HTTPException, Request
from starlette import status
from pydantic import BaseModel
from typing import List, Annotated

# Library used to enable CORS middleware
from fastapi.middleware.cors import CORSMiddleware

# from sqlalchemy import Engine
from sqlalchemy.orm import Session

# The three libraries below are used to create a model of the database, create the connection to the database
# and import the SQL alchemy DB
from app.models.models import Base
from app.schemas.db import SessionLocal, engine
from app.api import auth

# All libraries below are used to enable OAuth
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import HTMLResponse, RedirectResponse
#  Authlib allows us to use OAuth to authenticate users using popular services like MS and Google
from authlib.integrations.starlette_client import OAuth, OAuthError
# initialize FastAPI App
app = FastAPI()



# Adds session Middleware #document_further
SECRET_KEY = os.getenv('SECRET_KEY') 
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    session_cookie="session",
    max_age=3600,
    same_site="lax",  # Important!
    https_only=False, )

# allow all origins to communicate with backend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "http://172.24.144.1:3000",
    "http://localhost:5173",  # Add Vite port if using Vite
    "http://127.0.0.1:5173",
    "http://172.24.144.1",
    "http://172.20.208.1:3000",
    "http://172.20.208.1", # Add all potential frontend URLs
    "https://citycompass.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
# #document_further
# models.Base.metadata.create_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Create Model for a user
class UserBase(BaseModel):
    email: str
    username: str
    password: str

# Create the DB connection 
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

#  #document_further
db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(auth.get_current_user)]
 
# root will determine if a user session has been saved, if not it shows a link to to the login route
@app.get('/')
async def homepage(request: Request):
    user = request.session.get('user')
    if user:
        data = json.dumps(user)
        html = (
            f'<pre>{data}</pre>'
            '<a href="/logout">logout</a>'
        )
        return HTMLResponse(html)
    return HTMLResponse('<a href="/google-login">google-login</a><br><a href="/ms-login">ms-login</a>')

@app.get('/user', status_code=status.HTTP_200_OK)
async def user(user:user_dependency, db:db_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed') 
    return {"User": user}

if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
