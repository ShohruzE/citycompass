# The following libraries will allow FastAPI to run, create classes and create exceptions
from fastapi import FastAPI


# The three libraries below are used to create a model of the database, create the connection to the database
# and import the SQL alchemy DB
from models.models import Base
from core.db import engine
from api import auth

# All libraries below are used to enable OAuth
from starlette.middleware.sessions import SessionMiddleware

# initialize FastAPI App
app = FastAPI()
# #document_further
Base.metadata.create_all(bind=engine)
# Adds session Middleware #document_further
app.add_middleware(SessionMiddleware, secret_key="!secret")


app.include_router(auth.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
