# Fastapi Imports
from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    # email = Column(String)
    username = Column(String)
    password = Column(String)
    signin_method = Column(String)
