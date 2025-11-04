# initial libraries to create basic API routes and errors
from fastapi import APIRouter, Depends, Request 
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Annotated
import re

# connect to Postgres Database and read JSON from responses
from app.schemas.db import get_db
from pydantic import BaseModel
from starlette.config import Config
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.responses import HTMLResponse, RedirectResponse
import json
from app.models import models

# All libraries used to support JWT & auth routes
from datetime import timedelta, datetime
# from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel
# from sqlalchemy.orm import Session
from starlette import status
from app.schemas.db import SessionLocal
from app.models.models import Users
from passlib.context import CryptContext
# document_further
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
# Config file reads environment file
from dotenv import load_dotenv
import os
 
router = APIRouter(
    prefix='/auth',
    tags=['auth']
)
# get all key-value pairs from env file
load_dotenv()

# retrieve the secret key from env file records
SECRET_KEY = os.getenv('SECRET_KEY') 
# assert SECRET_KEY, "SECRET_KEY not set"
ALGORITHM = 'HS256'

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally: 
        db.close()

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')

class CreateUserRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


# Create Model for a user
class UserBase(BaseModel):
    email: str
    password: str


#  #document_further
db_dependency = Annotated[Session, Depends(get_db)]


# reads the client_id and secret from .env file
config = Config(".env")
oauth = OAuth(config)


GOOGLE_CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth.register(
    name="google",
    server_metadata_url=GOOGLE_CONF_URL,
    client_kwargs={"scope": "openid email profile"},
)

# Configure Microsoft OAuth manually to avoid issuer validation issues
oauth.register(
    name="microsoft",
    client_id=config("MICROSOFT_CLIENT_ID"),
    client_secret=config("MICROSOFT_CLIENT_SECRET"),
    authorize_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    access_token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
    client_kwargs={"scope": "https://graph.microsoft.com/User.Read"},
)


# root will determine if a user session has been saved, if not it shows a link to to the login route
@router.get("/")
async def homepage(request: Request):
    user = request.session.get("user")
    if user:
        data = json.dumps(user)
        html = f'<pre>{data}</pre><a href="/logout">logout</a>'
        return HTMLResponse(html)
    return HTMLResponse(
        '<a href="/google-login">google-login</a><br><a href="/ms-login">ms-login</a>'
    )


# Register route takes JSON information and saves it to the DB. Uses UserBase to validate items are the right type
# @router.post("/register")
# async def register_user(user: UserBase, db: db_dependency):
#     db_new_user = models.Users(
#         email=user.email, password=user.password
#     )
#     db.add(db_new_user)
#     db.commit()
#     db.refresh(db_new_user)
#     db.commit()


# function below defines the process for logging into google
@router.get("/google-login")
async def login(request: Request):
    redirect_uri = request.url_for("google_auth")
    return await oauth.google.authorize_redirect(request, redirect_uri)


# function below defines the process for logging into microsoft
@router.get("/ms-login")
async def ms_login(request: Request):  # Changed function name to avoid conflict
    redirect_uri = request.url_for("ms_auth")  # Fixed: point to ms_auth instead of auth
    return await oauth.microsoft.authorize_redirect(request, redirect_uri)


# This route receives a token from Google verifying access to app, then redirects user to root
@router.get("/google-auth")
async def google_auth(request: Request, db:db_dependency):
    try:
        token = await oauth.google.authorize_access_token(
            request
        )  # Fixed: use google for Google auth
    except OAuthError as error:
        return HTMLResponse(f"<h1>{error.error}</h1>")
    user = token.get("userinfo")
    if user:
        request.session["user"] = dict(user)
    # assert (user.email)
    # store user id if first time sign up
    try:
        db_user = authenticate_sso_user(user.email, db)
        if not db_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail='Could not validate user.')
        else:
            print(db_user.id)
    except HTTPException:
        print("error")
        print(error)

    token = create_access_token(user.email, db_user.id, timedelta(minutes=30))
    response = RedirectResponse(url="http://localhost:5173/home")
 
    response.set_cookie(
        
        'access_token',
        token,
        expires= timedelta(minutes=30),
        path="/",
        domain="localhost",
        httponly=False,  # Can't be accessed by JavaScript (more secure)
        secure=False,    # Only sent over HTTPS (use False in development)
        samesite='Lax',
    )
    
    return response

# This route receives a token from Microsoft verifying access to app, then redirects user to root
@router.get("/ms-auth")
async def ms_auth(request: Request):
    try:
        # Get the token without automatic userinfo parsing
        token = await oauth.microsoft.authorize_access_token(request)

        # Manually get user info from Microsoft Graph API
        resp = await oauth.microsoft.get(
            "https://graph.microsoft.com/v1.0/me", token=token
        )
        user_data = resp.json()

        # Create a user dict with the info we need
        user = {
            "email": user_data.get("mail") or user_data.get("userPrincipalName"),
            "name": user_data.get("displayName"),
            "id": user_data.get("id"),
            "given_name": user_data.get("givenName"),
            "family_name": user_data.get("surname"),
        }

    except OAuthError as error:
        return HTMLResponse(f"<h1>OAuth Error: {error.error}</h1>")
    except Exception as error:
        return HTMLResponse(f"<h1>Error: {str(error)}</h1>")

    if user:
        request.session["user"] = user
    return RedirectResponse(url="/")


# removes user information and redirects back to the root
@router.get("/logout")
async def logout(request: Request):
    request.session.pop("user", None)
    return RedirectResponse(url="/")

def is_valid_password(password):
    if len(password) < 8:
        return False
    if not re.search("[a-zA-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return bcrypt_context.hash(password)

def is_valid_username(username):
    if len(username) < 8:
        return False
    return username

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(db:db_dependency, create_user_request: CreateUserRequest):
    
    try: 
        valid_password = create_user_request.password
        valid_password = is_valid_password(valid_password)
        valid_username = is_valid_username(create_user_request.username)
        if (valid_password != False):
            raise HTTPException(status_code=400, detail="invalid password")
        
        if (valid_username != False):
            raise HTTPException(status_code=400, detail="invalid username")
        # print('passed username and email')
        # db_new_user = models.Users(email = create_user_request.username, password = valid_password)
        # bcrypt_context.hash(create_user_request.password)
        create_user_model = Users(
            username = valid_username,
            password = valid_password
        )

        db.add(create_user_model)
        db.commit()
        
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail='User Email already in use.')

# create token function 
def create_jwt_token(username, id):
    token = create_access_token(username, id, timedelta(minutes=30))
    return token


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
        db:db_dependency):
        user = authenticate_user(form_data.username, form_data.password, db)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail='Could not validate user.')
        token = create_access_token(user.username, user.id, timedelta(minutes=30))
        return {'access_token':token, 'token_type':'bearer'}

# @router.post("/login", response_model=Token)
# async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
#         db:db_dependency):
#         user = authenticate_user(form_data.username, form_data.password, db)
#         if not user:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
#                                 detail='Could not validate user.')
#         token = create_access_token(user.username, user.id, timedelta(minutes=30))
#         return {'access_token':token, 'token_type':'bearer'}

@router.post("/verify-token", response_model=Token)
async def verify_token(request: Request,
        db:db_dependency):
        token = request.cookies.get('access_token')
        if not token:
            raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
        
        try:
            payload = jwt.decode(token, SECRET_KEY , algorithms=[ALGORITHM])
            username: str = payload.get('sub')
            user_id: int = payload.get('id')
            if username is None or user_id is None:
                raise HTTPException(status_code =status.HTTP_401_UNAUTHORIZED,
                                    detail='Could not validate user.')
            user = db.query(Users).filter(Users.id == user_id).first()
            return user
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Could not validate user.')



def authenticate_user(username:str, password:str, db):
    user = db.query(Users).filter(Users.username == username).first()
    print(username)
    # print ("found user?:" ,user)
    if not user:
        return False
    if not bcrypt_context.verify(password, user.password):
        return False
    return user

def decrypt_user_password(user_password: str, test_password: str):
    return bcrypt_context.verify(test_password, user_password)

def authenticate_sso_user(username:str, db):
    user = db.query(Users).filter(Users.username == username).first()
    print(username)
    # print ("found user?:" ,user)
    if not user:
        return False
    return user

def create_access_token(username:str, user_id:int, expires_delta:timedelta):
    encode = {'sub':username, 'id':user_id}
    expires = datetime.utcnow() +expires_delta
    encode.update({'exp':expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

def retrieve_payload(token: Annotated[str, Depends(oauth2_bearer)]):
    payload = jwt.decode(token, SECRET_KEY , algorithms=[ALGORITHM])
    return payload

async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY , algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        if username is None or user_id is None:
            raise HTTPException(status_code =status.HTTP_401_UNAUTHORIZED,
                                detail='Could not validate user.')
        return {'username': username , 'id': user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Could not validate user.')

# new function
async def authenticate_token(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY , algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        if username is None or user_id is None:
            raise HTTPException(status_code =status.HTTP_401_UNAUTHORIZED,
                                detail='Could not validate user.')
        return {'username': username , 'id': user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Could not validate user.')
    
