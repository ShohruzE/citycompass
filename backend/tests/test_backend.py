
# import json
# from fastapi import HTTPException
# import pytest
from app.api import auth
# from app.schemas.db import SessionLocal


class TestAccountCreation:


    def test_create_short_password(self):
        """Test that password must be 8 characters long"""
        mock_user = auth.CreateUserRequest(
            username="test123@gmail.com", 
            password="test123"
        )
        
        assert auth.is_valid_password(mock_user.password) == False

    def test_create_password_no_letters(self):
        """Test that the password for a new user must contain at least one character"""
        mock_user = auth.CreateUserRequest(
            username="test123@gmail.com", 
            password="1234567890"
        )

        assert auth.is_valid_password(mock_user.password) == False


    def test_create_password_no_numbers(self):
        """Test that the password for a new user must contain at least one number"""
        mock_user = auth.CreateUserRequest(
            username="test123@gmail.com", 
            password="ascberihpk"
        )
        
        assert auth.is_valid_password(mock_user.password) == False


    def test_create_password_valid(self):
        """Test that the password for a new user must contain at least one number"""
        mock_user = auth.CreateUserRequest(
            username="test123@gmail.com", 
            password="2ascber234ihpk"
        )
        
        assert auth.is_valid_password(mock_user.password) != False

    def test_create_invalid_username(self):
        """Test that an invalid username returns false"""
        mock_user = auth.CreateUserRequest(
            username="Parker", 
            password="test123467"
        )
        
        assert auth.is_valid_username(mock_user.username) == False

class TestTokensAndHashing:

    def test_create_valid_username(self):
        """Test that the username is valid"""
        mock_user = auth.CreateUserRequest(
            username="Parker@gmail.com", 
            password="test123467"
        )
        
        assert auth.is_valid_username(mock_user.username) != None

    def test_hashing_password(self):
        """Test that a password can be hashed"""
        mock_user = auth.CreateUserRequest(
            username="test123@gmail.com", 
            password="test123"
        )
        
        assert auth.is_valid_password(mock_user.password) != mock_user.password

    def test_password_unhashing(self):
        """Test that the password can be unhashed"""
        mock_user = auth.CreateUserRequest(
            username="test123@gmail.com", 
            password="ascber234ihpk"
        )
        hashed_password = auth.is_valid_password(mock_user.password)
        
        assert auth.decrypt_user_password(hashed_password, mock_user.password) == True


    def test_token_creation(self):
        """Test that a token can be created"""
        mock_user = auth.CreateUserRequest(
            username="test123@gmail.com", 
            password="ascber234ihpk"
        )
        
        assert auth.create_jwt_token(mock_user.username,2) != None


    def test_data_retrival_from_token(self):
        """Test that a JWT token can be unloaded"""
        mock_user = auth.CreateUserRequest(
            username="test123@gmail.com", 
            password="ascber234ihpk"
        )

        token= auth.create_jwt_token(mock_user.username,2)
        payload = auth.retrieve_payload(token)

        username: str = payload.get('sub')
        user_id: int = payload.get('id')

        if username is None or user_id is None:
            assert False

