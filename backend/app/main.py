# The following libraries will allow FastAPI to run, create classes and create exceptions
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Annotated

# The three libraries below are used to create a model of the database, create the connection to the database
# and import the SQL alchemy DB
import models.models as models
from schemas.database import engine, SessionLocal
from sqlalchemy.orm import Session 

# All packages below are used for Middleware & API responses 
# JSON package to parse the JSON response recieved by the server
import json
# Import fastapi
from fastapi import FastAPI
# Config file reads environment file
from starlette.config import Config
# libraries and functions needed to recieve requests from server and to redirect to another route
from starlette.requests import Request

# All libraries below are used to enable OAuth
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import HTMLResponse, RedirectResponse
#  Authlib allows us to use OAuth to authenticate users using popular services like MS and Google
from authlib.integrations.starlette_client import OAuth, OAuthError

# initialize FastAPI App
app = FastAPI()
# #document_further
models.Base.metadata.create_all(bind=engine)
# Adds session Middleware #document_further
app.add_middleware(SessionMiddleware, secret_key="!secret")

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


# reads the client_id and secret from .env file
config = Config('.env')
oauth = OAuth(config)


GOOGLE_CONF_URL = 'https://accounts.google.com/.well-known/openid-configuration'
oauth.register(
    name='google',
    server_metadata_url=GOOGLE_CONF_URL,
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Configure Microsoft OAuth manually to avoid issuer validation issues
oauth.register(
    name='microsoft',
    client_id=config('MICROSOFT_CLIENT_ID'),
    client_secret=config('MICROSOFT_CLIENT_SECRET'),
    authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
    client_kwargs={
        'scope': 'https://graph.microsoft.com/User.Read'
    }
)


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


# Register route takes JSON information and saves it to the DB. Uses UserBase to validate items are the right type
@app.post("/register")
async def register_user(user: UserBase, db: db_dependency):
    db_new_user = models.Users(email = user.email,username = user.username, password = user.password)
    db.add(db_new_user)
    db.commit()
    db.refresh(db_new_user)
    db.commit()

# function below defines the process for logging into google
@app.get('/google-login')
async def login(request: Request):
    redirect_uri = request.url_for('google_auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)

# function below defines the process for logging into microsoft
@app.get('/ms-login')
async def ms_login(request: Request):  # Changed function name to avoid conflict
    redirect_uri = request.url_for('ms_auth')  # Fixed: point to ms_auth instead of auth
    return await oauth.microsoft.authorize_redirect(request, redirect_uri)

# This route receives a token from Google verifying access to app, then redirects user to root 
@app.get('/google-auth')
async def google_auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)  # Fixed: use google for Google auth
    except OAuthError as error:
        return HTMLResponse(f'<h1>{error.error}</h1>')
    user = token.get('userinfo')
    if user:
        request.session['user'] = dict(user)
    return RedirectResponse(url='/')

# This route receives a token from Microsoft verifying access to app, then redirects user to root
@app.get('/ms-auth')
async def ms_auth(request: Request):
    try:
        # Get the token without automatic userinfo parsing
        token = await oauth.microsoft.authorize_access_token(request)
        
        # Manually get user info from Microsoft Graph API
        resp = await oauth.microsoft.get('https://graph.microsoft.com/v1.0/me', token=token)
        user_data = resp.json()
        
        # Create a user dict with the info we need
        user = {
            'email': user_data.get('mail') or user_data.get('userPrincipalName'),
            'name': user_data.get('displayName'),
            'id': user_data.get('id'),
            'given_name': user_data.get('givenName'),
            'family_name': user_data.get('surname')
        }
        
    except OAuthError as error:
        return HTMLResponse(f'<h1>OAuth Error: {error.error}</h1>')
    except Exception as error:
        return HTMLResponse(f'<h1>Error: {str(error)}</h1>')
    
    if user:
        request.session['user'] = user
    return RedirectResponse(url='/')

# removes user information and redirects back to the root
@app.get('/logout')
async def logout(request: Request):
    request.session.pop('user', None)
    return RedirectResponse(url='/')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000)
