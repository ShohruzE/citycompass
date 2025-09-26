#Fastapi Imports
from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from schemas.database import Base

class Users(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String)
    username = Column(String)
    password = Column(String)
