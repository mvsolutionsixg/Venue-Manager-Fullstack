from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from ..models.user import User
from ..services.auth import verify_password, create_access_token
from ..schemas.auth import Token

router = APIRouter()

import traceback

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        print(f"DEBUG: Login attempt for user: {form_data.username}")
        # Find user by username
        user = db.query(User).filter(User.username == form_data.username).first()
        
        if not user:
            print("DEBUG: User not found in database")
        
        # Authenticate
        if not user or not verify_password(form_data.password, user.password_hash):
            print("DEBUG: Password verification failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        print("DEBUG: User authenticated successfully")
        
        # Generate Token
        access_token_expires = timedelta(minutes=30)
        print("DEBUG: Generating access token...")
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        print("DEBUG: Token generated successfully")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Login failed with unexpected error: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Login Error. Check server logs."
        )
