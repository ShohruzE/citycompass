# ============================================================================
# Libraries needed for api router and authentication
# ============================================================================

# initial libraries to create basic API routes and errors
from fastapi import APIRouter, Depends, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Annotated
import re

# connect to Postgres Database and read JSON from responses
from app.core.db import SessionLocal, get_db
from pydantic import BaseModel
from starlette.config import Config
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.responses import HTMLResponse, RedirectResponse
import json
from app.models import models

# All libraries used to support JWT & auth routes
from datetime import timedelta, datetime
from starlette import status
from app.models.models import Users
from passlib.context import CryptContext

# document_further
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

# Config file reads environment file
from dotenv import load_dotenv
import os 

# from app.logger import log_to_sumo
# import resend 

from sqlalchemy.orm import Session

# Logs information so developers can see what is happening under the hood
import logging
# from app.logger import setup_logging
# setup_logging()  # Call once at startup
logger = logging.getLogger(__name__)


router = APIRouter(
    prefix='/auth',
    tags=['auth']
)
# get all key-value pairs from env file
load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

# retrieve the secret key from env file records
SECRET_KEY = os.getenv("SECRET_KEY")
# assert SECRET_KEY, "SECRET_KEY not set"
ALGORITHM = 'HS256'
RESET_TOKEN_EXPIRE_MINUTES = 15  # Token expires in 15 minutes
FRONTEND_URL = os.getenv('FRONTEND_URL') or "http://localhost:3000"   # Your frontend URL


router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally: 
        db.close()

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')

# ============================================================================
# MODELS
# ============================================================================

"""
    The following models are to create users, log users in, and create tokens. 
    Some of these models are redundant because I used them uniquely in different functions.
    In hindsight they should be reduced
"""
class CreateUserRequest(BaseModel):
    username: str
    password: str


class UserLoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

# Create Model for a user
class UserBase(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

#  connection to the db 
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


"""
root will determine if a user session has been saved, if not it shows a link to to the login route

""" 
@router.get("/")
async def homepage(request: Request):
    print(logger)
    # log_to_sumo("INFO", "Users endpoint called", {"endpoint": "/"})
    logger.info("Homepage")
    user = request.session.get("user")
    if user:
        data = json.dumps(user)
        html = f'<pre>{data}</pre><a href="/logout">logout</a>'
        return HTMLResponse(html)
    return HTMLResponse(
        '<a href="/google-login">google-login</a><br><a href="/ms-login">ms-login</a>'
    )


"""
    output: function below defines the process for logging into google
    return: will return a redirect request to google login page
    parameters: takes in user request 
"""
@router.get("/google-login")
async def login(request: Request):
    # log_to_sumo("INFO", "Gmail login endpoint called", {"endpoint": "/"})
    # Logging statement to see when users attempt a google login
    logging.info('User is attempting to sign in using Google Account, User is redirected')
    redirect_uri = request.url_for("google_auth")
    return await oauth.google.authorize_redirect(request, redirect_uri)


"""
    output: function below defines the process for logging into Microsoft
    return: will return a redirect request to Microsoft login page
    parameters: takes in user request 
"""
@router.get("/ms-login")
async def ms_login(request: Request):  
    # Output log to see when users attempt a MS login
    logging.info('User is attempting to sign in using Microsoft Account, User is redirected')
    redirect_uri = request.url_for("ms_auth") 
    return await oauth.microsoft.authorize_redirect(request, redirect_uri)

"""
    output: if a user attempts to signin without a google account, it will create one for them
    return: nothing returned
    parameters: user email and db dependency are required for this function
"""
def create_google_user(user_email: str, db:db_dependency):
    logging.info('User is not found in database, creating new user with Gmail info')
    try: 
        # using Users model to create the user object 
        create_user_model = Users(
            username = user_email,
            signin_method = "Google"
        )
        # Pushing user object to database
        db.add(create_user_model)
        # Committing update to database
        db.commit()
    except Exception as error:
        # When exceptions occur, they will be monitored with the following log statement
        logging.debug(error)


"""
    output: microsft user email is added to db as a new user
    return: none
    parameters: user email and database connection
"""
def create_microsoft_user(user_email: str, db:db_dependency):
    logging.info('User is not found in database, creating new user with Microsoft info')
    try: 
        create_user_model = Users(
            username = user_email,
            signin_method = "Microsoft"
        )

        db.add(create_user_model)
        db.commit()
    except Exception as error:
        logging.debug(error)
        # print(error)

"""
    output: This route receives a token from Google verifying access to app, then redirects user to /dashboard
    return: will return a redirect request to google login page and a JWT token confirming login
    parameters: takes in user request and database dependency 
"""
@router.get("/google-auth")
async def google_auth(request: Request, db:db_dependency):
    logging.info("token recieved from google, signing user in")
    # if the token is authorized then we will have user infor
    try:
        token = await oauth.google.authorize_access_token(
            request
        ) 
    except OAuthError as error:
        # logs the error a user recieved when trying to login
        logging.debug(error)
        return HTMLResponse(f"<h1>{error.error}</h1>")
    
    # Token is authroized if no error was caught before
    user = token.get("userinfo")

    # if a user is found, save their data to the user variable
    if user:
        request.session["user"] = dict(user)

    # test if the user if authenticated in the database, if not add them to db
    try:
        # if user is not found, user.email will be null
        db_user = authenticate_sso_user(user.email, db)
        if db_user == False:
            logging.info(user.email + " not found in db, gmail user is being added to database")
            create_google_user(user.email,db)
            db_user = authenticate_sso_user(user.email, db)
            # raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            #                     detail='Could not validate user.')
        else:
            logging.info( "user successfully created/found with the following id: " + str(db_user.id))
            # print(db_user.id)
    except HTTPException:
        logging.error(error)
    
    if db_user:
        logging.info(db_user)
    else:
        logging.warning("db user was not created, function did catch the error")

    # token = create_access_token(user.email, db_user.id, timedelta(minutes=30))
    # response = RedirectResponse(url="http://localhost:3000/dashboard")
    
    # response = JSONResponse(content={
    #     "message": "Login successful",
    #     "user": db_user.username,
    #     "token":token
    #     # Include any other user data you need
    # })
    
    # return response
    # token = create_access_token(user.email, db_user.id, timedelta(minutes=30))
    token = create_access_token(db_user.username, db_user.id, timedelta(minutes=30))
    
    redirect_url = f"{FRONTEND_URL}/dashboard?token={token}&user={db_user.username}"

    logging.info(redirect_url)
    
    return RedirectResponse(url=redirect_url)


"""
    output: This route receives a token from Microsoft verifying access to app, then redirects user to /dashboard
    return: will return a redirect request to Microsoft login page and a JWT token confirming login
    parameters: takes in user request and database dependency 
"""
@router.get("/ms-auth")
async def ms_auth(request: Request, db: db_dependency):
    logging.info("token recieved from Microsoft, signing user in")
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
        if user is None:
            logging.error("MS login error occurred" + error)
            return RedirectResponse(
                # redirect_url = f"{FRONTEND_URL}/dashboard?token={token}&user={db_user.username}"
                url=f"{FRONTEND_URL}/sign-in?error=auth_failed"
            )
        logging.error(user["email"] + "login error occurred" + error)
        return RedirectResponse(
                # redirect_url = f"{FRONTEND_URL}/dashboard?token={token}&user={db_user.username}"

                url=f"{FRONTEND_URL}/sign-in?error=auth_failed"
            )
    except Exception as error:
        logging.error(user["email"] + "login error occurred" + error)
        return RedirectResponse(
                url=f"{FRONTEND_URL}/sign-in?error=ms_server_error"
            )


    try:
        db_user = authenticate_sso_user(user["email"], db)
        # print("db_user: ", db_user)
        if db_user == False:
            logging.info(user["email"] + " not found in db, gmail user is being added to database")
            create_microsoft_user(user["email"],db)
            db_user = authenticate_sso_user(user["email"], db)
        else:
            logging.info( "user successfully created/found with the following id: " + str(db_user.id))
    except Exception as error:
        logging.error( f"OAuth error: {str(error)}")
        # print(f"OAuth error: {str(error)}")
        return RedirectResponse(f"{FRONTEND_URL}/sign-up?error=server_error")
    except error:
        logging.error(error)
        # print(error)

    token = create_access_token(db_user.username, db_user.id, timedelta(minutes=30))
    
    redirect_url = f"{FRONTEND_URL}/dashboard?token={token}&user={db_user.username}"

    return RedirectResponse(url=redirect_url)
 

"""
    output: removes user information and redirects back to the root
    return: message that says logout was successfull
    parameters: request and response
"""
@router.get("/logout")
async def logout(request: Request, response: Response):
    logging.info("user sign out initiated")
    request.session.pop("user", None)

    response.delete_cookie(
        key="access_token",  # Your session cookie name
        path="/",
        domain="localhost",  # Match your cookie domain
    )

    response.delete_cookie(
        key="token",  # Your session cookie name
        path="/",
        domain="localhost",  # Match your cookie domain
    )


    return {"message": "Logged out successfully"}
    # return RedirectResponse(url="http://localhost:3000")

"""
    output: tests if password meets certain requirements
    return: returns false or encrypted  password with bcrypt
    parameters: string that represents user password
"""
def is_valid_password(password):
    if len(password) < 8:
        return False
    if not re.search("[a-zA-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return bcrypt_context.hash(password)


"""
    output: either returns null or username
    return: returns username or false
    parameters: string that represents user password
"""
def is_valid_username(username):
    if len(username) < 8:
        return False
    return username


"""
    output: adds user to database
    return: none
    parameters: db dependency and a user object
"""
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(db:db_dependency, create_user_request: CreateUserRequest):
    logging.info("Creating new user")
    try: 
        valid_password = create_user_request.password
        valid_password = is_valid_password(valid_password)
        valid_username = is_valid_username(create_user_request.username)
        
        if (valid_password == False):
            logging.warning("invalid password")
            raise HTTPException(status_code=400, detail="invalid password")
        logging.info("valid password")

        if (valid_username == False):
            logging.warning("invalid username")
            raise HTTPException(status_code=400, detail="invalid username")
        logging.info("Valid username")
        # print('passed username and email')
        # db_new_user = models.Users(email = create_user_request.username, password = valid_password)
        # bcrypt_context.hash(create_user_request.password)
        create_user_model = Users(
            username = valid_username,
            password = valid_password,
            signin_method='email'
        )

        logging.info("creating user in DB")
        db.add(create_user_model)
        db.commit()
        return
    except Exception as e:
        db.rollback()
        logging.error(f"Failed to create user: {str(e)}")
        if "duplicate key" in str(e):
            raise HTTPException(status_code=409, detail="Username already in use")
        raise
    # except:
    #     logging.error("error")
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
    #                             detail='User Email already in use.')

"""
    output: creates a JWT token using the user's id and username(email)
    return: JWT Token
    parameters: username and user id
"""
def create_jwt_token(username, id):
    token = create_access_token(username, id, timedelta(minutes=30))
    return token

"""
    output: function to test if cors is working by calling a simple endpoint
    return: response with string "CORS works" if frontend can call the backend
"""
@router.post("/test")
async def test():
    return {"message": "CORS works!"}


@router.post("/email-auth")
async def email_login(db: db_dependency, user_login_request: UserLoginRequest):
    try:
        # db_user = (user.email, db)
        db_user = authenticate_user(
            user_login_request.username, user_login_request.password, db
        )
        print("db_user: ", db_user)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate user.",
            )
        else:
            print(db_user.id)
    except Exception as error:
        # print("error")
        print(error)

    token = create_access_token(db_user.username, db_user.id, timedelta(minutes=30))
    response = JSONResponse(
        content={
            "message": "Login successful",
            "user": user_login_request.username,
            "token": token,
            # Include any other user data you need
        }
    )

    return response


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency
):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate user."
        )
    token = create_access_token(user.username, user.id, timedelta(minutes=30))
    return {"token": token, "token_type": "bearer"}


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
async def verify_token(request: Request, db: db_dependency):
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate user.",
            )
        user = db.query(Users).filter(Users.id == user_id).first()
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate user."
        )


def authenticate_user(username: str, password: str, db):
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


def authenticate_sso_user(username: str, db):
    # Query for user by username
    user = db.query(Users).filter(Users.username == username).first()

    # Debug logging
    print(f"User lookup for '{username}': {'Found' if user else 'Not found'}")
    if user:
        print(f"  - Email: {user.username}")
        print(f"  - Sign-in method: {user.signin_method}")

    # Validation checks
    if user is None:
        print("❌ Authentication failed: User does not exist")
        return False

    if user.signin_method not in ["Google", "Microsoft"]:
        print(
            f"❌ Authentication failed: Invalid sign-in method '{user.signin_method}'. Expected 'Google' or 'Microsoft'"
        )
        return False

    print("✅ User authenticated successfully")
    return user


def create_access_token(username: str, user_id: int, expires_delta: timedelta):
    encode = {"sub": username, "id": user_id}
    expires = datetime.utcnow() + expires_delta
    encode.update({"exp": expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def retrieve_payload(token: Annotated[str, Depends(oauth2_bearer)]):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    print(f"Received token: {token[:20]}...")  # Print first 20 chars
    print(f"SECRET_KEY: {SECRET_KEY[:10]}...")  # Print first 10 chars
    print(f"ALGORITHM: {ALGORITHM}")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate user.",
            )
        return {"username": username, "id": user_id}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate user."
        )


# new function
async def authenticate_token(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate user.",
            )
        return {"username": username, "id": user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Could not validate user.')


# ============================================================================
# HELPER FUNCTIONS for Password Reset function
# ============================================================================

def create_reset_token(email: str) -> str:
    """Create a password reset token that expires in 15 minutes"""
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "exp": expire,
        "type": "password_reset"  # Distinguish from regular JWT tokens
    }
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_reset_token(token: str) -> str:
    """Verify the reset token and return the email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
        
        return email
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one."
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )

def send_reset_email(email: str, token: str):
    """Send password reset email using Resend"""
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    
    try:
        params = {
            "from": "noreply@yourdomain.com",  # Your verified domain
            "to": [email],
            "subject": "Reset Your Password",
            "html": f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #4F46E5;">Reset Your Password</h2>
                        <p>You requested to reset your password. Click the button below to create a new password:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{reset_url}" 
                               style="background-color: #4F46E5; 
                                      color: white; 
                                      padding: 12px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px;
                                      display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Or copy and paste this link into your browser:<br>
                            <a href="{reset_url}" style="color: #4F46E5;">{reset_url}</a>
                        </p>
                        
                        <p style="color: #666; font-size: 14px;">
                            This link will expire in {RESET_TOKEN_EXPIRE_MINUTES} minutes.
                        </p>
                        
                        <p style="color: #666; font-size: 14px;">
                            If you didn't request this, please ignore this email.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            This is an automated message, please do not reply.
                        </p>
                    </div>
                </body>
            </html>
            """
        }
        
        # resend.Emails.send(params)
        
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset email"
        )

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/request-password-reset", status_code=status.HTTP_200_OK)
async def request_password_reset(
    request: PasswordResetRequest,
    db: Annotated[Session, Depends(get_db)]  # Your db dependency
):
    """
    Request a password reset email.
    Validates that user exists and didn't sign in with social auth.
    """
    try:
        logging.info("user requested password reset")
        # 1. Check if user exists
        user = db.query(Users).filter(Users.username == request.email).first()
        
        if not user:
            # Don't reveal if user exists or not (security best practice)
            return {
                "message": "If an account exists with this email, you will receive a password reset link."
            }
        logging.info("user was found in db")

        # 2. Check if user signed in with social auth
        if user.signin_method is not None and user.signin_method != "email":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This account uses {user.signin_method} sign-in. Please use that method to log in."
            )
        logging.info("user sign in method is email")
        # 3. Create reset token
        reset_token = create_reset_token(user.username)
        
        # 4. Send email
        send_reset_email(user.username, reset_token)
        
        return {
            "message": "If an account exists with this email, you will receive a password reset link."
        }
    except Exception as e:
            print(f"Error sending email: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send reset email"
            )


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: PasswordResetConfirm,
    db: Annotated[Session, Depends(get_db)]  # Your db dependency
):
    """
    Reset password using the token from email.
    """
    
    # 1. Verify token and get email
    email = verify_reset_token(request.token)
    
    # 2. Get user
    user = db.query(Users).filter(Users.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 3. Check social sign-in again (in case it changed)
    if user.social_sign_in is not None and user.social_sign_in != "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account uses {user.social_sign_in} sign-in."
        )
    
    # 4. Hash new password
    from passlib.context import CryptContext
    bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    hashed_password = bcrypt_context.hash(request.new_password)
    
    # 5. Update password
    user.password = hashed_password
    db.commit()
    
    return {
        "message": "Password successfully reset. You can now log in with your new password."
    }


@router.post("/verify-reset-token", status_code=status.HTTP_200_OK)
async def verify_reset_token_endpoint(token: str):
    """
    Optional: Verify if a reset token is valid before showing the reset form.
    Frontend can call this when the reset page loads.
    """
    
    try:
        email = verify_reset_token(token)
        return {
            "valid": True,
            "email": email
        }
    except HTTPException:
        return {
            "valid": False,
            "message": "Invalid or expired token"
        }
