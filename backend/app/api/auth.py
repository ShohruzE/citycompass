from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import Annotated


from app.core.db import get_db
from pydantic import BaseModel
from starlette.config import Config
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.responses import HTMLResponse, RedirectResponse
import json
from app.models import models


router = APIRouter(prefix="/auth")

db_dependency = Annotated[Session, Depends(get_db)]


# Create Model for a user
class UserBase(BaseModel):
    email: str
    username: str
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
@router.post("/register")
async def register_user(user: UserBase, db: db_dependency):
    db_new_user = models.Users(
        email=user.email, username=user.username, password=user.password
    )
    db.add(db_new_user)
    db.commit()
    db.refresh(db_new_user)
    db.commit()


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
async def google_auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(
            request
        )  # Fixed: use google for Google auth
    except OAuthError as error:
        return HTMLResponse(f"<h1>{error.error}</h1>")
    user = token.get("userinfo")
    if user:
        request.session["user"] = dict(user)
    return RedirectResponse(url="/")


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
