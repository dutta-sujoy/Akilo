
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials
from app.core.security import security
from app.core.config import settings
from supabase import create_client, Client

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    # We trust security.get_current_user to have validated the token (or we can validate here)
    # For now, just extracting the token to pass to supabase
    return "user_id_placeholder" # Actual validation happens in security.py

def get_supabase_client(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Client:
    token = credentials.credentials
    # print(f"DEBUG TOKEN: {token[:10]}..." if token else "DEBUG TOKEN: None")
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    if token and token != "undefined":
        try:
            client.postgrest.auth(token)
        except Exception as e:
            print(f"Error setting auth token: {e}")
    else:
        print("Warning: valid token not found in request")
    return client
