# ============================================================================
# Libraries needed for api router and authentication
# ============================================================================

from fastapi import APIRouter, Depends, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Annotated
import re

# connect to Postgres Database and read JSON from responses
from app.core.db import get_db
from app.models.models import SurveyResponse as SurveyResponseModel
from pydantic import BaseModel
from starlette.config import Config
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.responses import HTMLResponse, RedirectResponse
import json
from app.models.models import Users

# All libraries used to support JWT & auth routes
from datetime import timedelta, datetime
from starlette import status
from passlib.context import CryptContext

from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

from dotenv import load_dotenv
import os

import logging

logger = logging.getLogger(__name__)

# ============================================================================
# ROUTER & CONFIGURATION
# ============================================================================

router = APIRouter(prefix="/auth", tags=["auth"])

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
RESET_TOKEN_EXPIRE_MINUTES = 15
FRONTEND_URL = os.getenv("FRONTEND_URL") or "http://localhost:3000"

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="api/auth/token")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================


class AuthRequest(BaseModel):
    """Request model for user registration and login"""

    username: str
    password: str


class Token(BaseModel):
    """JWT token response model"""

    access_token: str
    token_type: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


# ============================================================================
# DEPENDENCIES
# ============================================================================

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[
    dict, Depends(lambda: None)
]  # Will be set after get_current_user is defined

# OAuth Configuration
config = Config(".env")
oauth = OAuth(config)

GOOGLE_CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth.register(
    name="google",
    server_metadata_url=GOOGLE_CONF_URL,
    client_kwargs={"scope": "openid email profile"},
)

oauth.register(
    name="microsoft",
    client_id=config("MICROSOFT_CLIENT_ID"),
    client_secret=config("MICROSOFT_CLIENT_SECRET"),
    authorize_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    access_token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
    client_kwargs={"scope": "https://graph.microsoft.com/User.Read"},
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def create_access_token(username: str, user_id: int, expires_delta: timedelta) -> str:
    """Create a JWT access token"""
    encode = {"sub": username, "id": user_id}
    expires = datetime.utcnow() + expires_delta
    encode.update({"exp": expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def is_valid_password(password: str) -> str | bool:
    """Validate password requirements and return hashed password or False"""
    if len(password) < 8:
        return False
    if not re.search("[a-zA-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return bcrypt_context.hash(password)


def is_valid_username(username: str) -> str | bool:
    """Validate username length"""
    if len(username) < 8:
        return False
    return username


def authenticate_user(username: str, password: str, db: Session):
    """Authenticate user with email/password"""
    user = db.query(Users).filter(Users.username == username).first()
    if not user:
        return False
    if not user.password:
        return False
    if not bcrypt_context.verify(password, user.password):
        return False
    return user


def authenticate_sso_user(username: str, db: Session):
    """Authenticate SSO user (Google/Microsoft)"""
    user = db.query(Users).filter(Users.username == username).first()

    if user is None:
        logging.debug(f"SSO auth failed: User '{username}' does not exist")
        return False

    if user.signin_method not in ["Google", "Microsoft"]:
        logging.debug(f"SSO auth failed: Invalid sign-in method '{user.signin_method}'")
        return False

    return user


def create_sso_user(email: str, provider: str, db: Session) -> Users:
    """Create a new SSO user (Google or Microsoft)"""
    logging.info(f"Creating new {provider} user: {email}")
    try:
        user = Users(username=email, signin_method=provider)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except Exception as error:
        db.rollback()
        logging.error(f"Failed to create {provider} user: {error}")
        raise


def get_user_survey_status(username: str, db: Session) -> bool:
    """Check if user has completed a survey"""
    return (
        db.query(SurveyResponseModel)
        .filter(SurveyResponseModel.user_email == username)
        .first()
        is not None
    )


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]) -> dict:
    """Extract and validate current user from JWT token"""
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


# Update user_dependency after get_current_user is defined
user_dependency = Annotated[dict, Depends(get_current_user)]

# ============================================================================
# AUTH ROUTES - Homepage & Test
# ============================================================================


@router.get("/")
async def homepage(request: Request):
    """Auth homepage - shows login links or user info"""
    logger.info("Auth homepage accessed")
    user = request.session.get("user")
    if user:
        data = json.dumps(user)
        html = f'<pre>{data}</pre><a href="/logout">logout</a>'
        return HTMLResponse(html)
    return HTMLResponse(
        '<a href="/google-login">google-login</a><br><a href="/ms-login">ms-login</a>'
    )


@router.post("/test")
async def test():
    """Test endpoint to verify CORS"""
    return {"message": "CORS works!"}


# ============================================================================
# AUTH ROUTES - Email Registration & Login
# ============================================================================


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, create_user_request: AuthRequest):
    """Register a new user with email/password"""
    logging.info("Creating new user")

    valid_password = is_valid_password(create_user_request.password)
    if not valid_password:
        logging.warning("Invalid password")
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters with letters and numbers",
        )

    valid_username = is_valid_username(create_user_request.username)
    if not valid_username:
        logging.warning("Invalid username")
        raise HTTPException(
            status_code=400, detail="Username must be at least 8 characters"
        )

    try:
        create_user_model = Users(
            username=valid_username, password=valid_password, signin_method="email"
        )
        db.add(create_user_model)
        db.commit()
        logging.info(f"User created: {valid_username}")
        return {"message": "User created successfully"}
    except Exception as e:
        db.rollback()
        logging.error(f"Failed to create user: {str(e)}")
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=409, detail="Username already in use")
        raise HTTPException(status_code=500, detail="Failed to create user")


@router.post("/email-auth")
async def email_login(db: db_dependency, user_login_request: AuthRequest):
    """Login with email/password - returns JSON with token"""
    logging.info(f"Email login attempt for: {user_login_request.username}")

    db_user = authenticate_user(
        user_login_request.username, user_login_request.password, db
    )

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token(db_user.username, db_user.id, timedelta(minutes=30))
    has_survey = get_user_survey_status(db_user.username, db)

    logging.info(f"Email login successful for: {db_user.username}")

    return {"token": token, "has_survey": has_survey, "user": db_user.username}


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency
):
    """OAuth2 compatible token endpoint"""
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate user."
        )
    token = create_access_token(user.username, user.id, timedelta(minutes=30))
    return {"access_token": token, "token_type": "bearer"}


# ============================================================================
# AUTH ROUTES - Token Verification
# ============================================================================


@router.get("/verify")
async def verify_token(current_user: user_dependency):
    """Verify JWT token and return user info"""
    return {"valid": True, "user": current_user}


# ============================================================================
# AUTH ROUTES - OAuth (Google & Microsoft)
# ============================================================================


@router.get("/google-login")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    logging.info("User initiating Google sign-in")
    redirect_uri = request.url_for("google_auth")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google-auth")
async def google_auth(request: Request, db: db_dependency):
    """Google OAuth callback handler"""
    logging.info("Processing Google OAuth callback")

    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        logging.error(f"Google OAuth error: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/sign-in?error=auth_failed")

    user = token.get("userinfo")
    if user:
        request.session["user"] = dict(user)

    redirect_page = "dashboard"

    try:
        db_user = authenticate_sso_user(user.email, db)
        if db_user == False:
            logging.info(f"{user.email} not found, creating Google user")
            create_sso_user(user.email, "Google", db)
            db_user = authenticate_sso_user(user.email, db)
            redirect_page = "survey"
        else:
            logging.info(f"Google user found: {db_user.id}")
            has_survey = get_user_survey_status(db_user.username, db)
            redirect_page = "dashboard" if has_survey else "survey"
    except Exception as error:
        logging.error(f"Google auth error: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/sign-in?error=server_error")

    if not db_user:
        logging.warning("Failed to create/find Google user")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/sign-in?error=user_creation_failed"
        )

    jwt_token = create_access_token(db_user.username, db_user.id, timedelta(minutes=30))
    redirect_url = (
        f"{FRONTEND_URL}/{redirect_page}?token={jwt_token}&user={db_user.username}"
    )

    logging.info(f"Google auth successful, redirecting to: {redirect_page}")
    return RedirectResponse(url=redirect_url)


@router.get("/ms-login")
async def ms_login(request: Request):
    """Initiate Microsoft OAuth login"""
    logging.info("User initiating Microsoft sign-in")
    redirect_uri = request.url_for("ms_auth")
    return await oauth.microsoft.authorize_redirect(request, redirect_uri)


@router.get("/ms-auth")
async def ms_auth(request: Request, db: db_dependency):
    """Microsoft OAuth callback handler"""
    logging.info("Processing Microsoft OAuth callback")

    try:
        token = await oauth.microsoft.authorize_access_token(request)
        resp = await oauth.microsoft.get(
            "https://graph.microsoft.com/v1.0/me", token=token
        )
        user_data = resp.json()

        user = {
            "email": user_data.get("mail") or user_data.get("userPrincipalName"),
            "name": user_data.get("displayName"),
            "id": user_data.get("id"),
            "given_name": user_data.get("givenName"),
            "family_name": user_data.get("surname"),
        }
    except OAuthError as error:
        logging.error(f"MS OAuth error: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/sign-in?error=auth_failed")
    except Exception as error:
        logging.error(f"MS auth error: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/sign-in?error=ms_server_error")

    redirect_page = "dashboard"

    try:
        db_user = authenticate_sso_user(user["email"], db)
        if db_user == False:
            logging.info(f"{user['email']} not found, creating Microsoft user")
            create_sso_user(user["email"], "Microsoft", db)
            db_user = authenticate_sso_user(user["email"], db)
            redirect_page = "survey"
        else:
            logging.info(f"Microsoft user found: {db_user.id}")
            has_survey = get_user_survey_status(db_user.username, db)
            redirect_page = "dashboard" if has_survey else "survey"
    except Exception as error:
        logging.error(f"MS auth error: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/sign-up?error=server_error")

    jwt_token = create_access_token(db_user.username, db_user.id, timedelta(minutes=30))
    redirect_url = (
        f"{FRONTEND_URL}/{redirect_page}?token={jwt_token}&user={db_user.username}"
    )

    logging.info(f"MS auth successful, redirecting to: {redirect_page}")
    return RedirectResponse(url=redirect_url)


# ============================================================================
# AUTH ROUTES - Logout
# ============================================================================


@router.get("/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session/cookies"""
    logging.info("User logout initiated")
    request.session.pop("user", None)

    response.delete_cookie(key="access_token", path="/", domain="localhost")
    response.delete_cookie(key="token", path="/", domain="localhost")

    return {"message": "Logged out successfully"}


# ============================================================================
# AUTH ROUTES - Password Reset
# ============================================================================


def create_reset_token(email: str) -> str:
    """Create a password reset token that expires in 15 minutes"""
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "exp": expire, "type": "password_reset"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_reset_token(token: str) -> str:
    """Verify the reset token and return the email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")

        if email is None or token_type != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token"
            )
        return email

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one.",
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token"
        )


def send_reset_email(email: str, token: str):
    """Send password reset email (placeholder - implement with your email service)"""
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    try:
        # TODO: Implement with your email service (e.g., Resend, SendGrid)
        logging.info(f"Password reset email would be sent to: {email}")
        logging.info(f"Reset URL: {reset_url}")

        # Example params for email service:
        # params = {
        #     "from": "noreply@yourdomain.com",
        #     "to": [email],
        #     "subject": "Reset Your Password",
        #     "html": f"<a href='{reset_url}'>Reset Password</a>"
        # }
        # resend.Emails.send(params)

    except Exception as e:
        logging.error(f"Error sending reset email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset email",
        )


@router.post("/request-password-reset", status_code=status.HTTP_200_OK)
async def request_password_reset(request: PasswordResetRequest, db: db_dependency):
    """Request a password reset email"""
    logging.info(f"Password reset requested for: {request.email}")

    user = db.query(Users).filter(Users.username == request.email).first()

    if not user:
        # Don't reveal if user exists (security best practice)
        return {
            "message": "If an account exists with this email, you will receive a password reset link."
        }

    if user.signin_method is not None and user.signin_method != "email":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account uses {user.signin_method} sign-in. Please use that method to log in.",
        )

    reset_token = create_reset_token(user.username)
    send_reset_email(user.username, reset_token)

    return {
        "message": "If an account exists with this email, you will receive a password reset link."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: PasswordResetConfirm, db: db_dependency):
    """Reset password using the token from email"""

    # Verify token and get email
    email = verify_reset_token(request.token)

    # Get user - use username field (which stores email)
    user = db.query(Users).filter(Users.username == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check if this is an email-based account
    if user.signin_method is not None and user.signin_method != "email":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account uses {user.signin_method} sign-in.",
        )

    # Validate and hash new password
    hashed_password = is_valid_password(request.new_password)
    if not hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters with letters and numbers",
        )

    # Update password
    user.password = hashed_password
    db.commit()

    logging.info(f"Password reset successful for: {email}")
    return {
        "message": "Password successfully reset. You can now log in with your new password."
    }


@router.post("/verify-reset-token", status_code=status.HTTP_200_OK)
async def verify_reset_token_endpoint(token: str):
    """Verify if a reset token is valid before showing the reset form"""
    try:
        email = verify_reset_token(token)
        return {"valid": True, "email": email}
    except HTTPException:
        return {"valid": False, "message": "Invalid or expired token"}
