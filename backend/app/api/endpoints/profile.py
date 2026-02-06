
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.api.deps import get_supabase_client
from app.models.schemas import ProfileUpdate, TargetUpdate

router = APIRouter()

DEFAULT_TARGETS = {
    "calories_target": 2000,
    "protein_target_g": 120,
    "carbs_target_g": 250,
    "fats_target_g": 60,
    "water_target_ml": 2500
}

@router.get("/")
def get_profile(client: Client = Depends(get_supabase_client)):
    """Get user profile"""
    try:
        res = client.table("profiles").select("*").single().execute()
        return res.data
    except Exception as e:
        print(f"Error fetching profile: {e}")
        # Return empty profile for new users instead of 404
        return {}

@router.put("/")
def update_profile(profile: ProfileUpdate, client: Client = Depends(get_supabase_client)):
    """Update or create user profile"""
    data = profile.dict(exclude_unset=True)
    if not data:
        return {"message": "No data to update"}
    
    try:
        # Try to get existing profile
        current = client.table("profiles").select("id").execute()
        
        if current.data and len(current.data) > 0:
            # Profile exists, update it
            uid = current.data[0]['id']
            res = client.table("profiles").update(data).eq("id", uid).execute()
            return res.data[0] if res.data else {}
        else:
            # Profile doesn't exist - get user id from auth and create
            user = client.auth.get_user()
            if not user or not user.user:
                raise HTTPException(status_code=401, detail="Not authenticated")
            
            uid = user.user.id
            # Set default values for required fields if not provided
            create_data = {
                "id": uid,
                "name": data.get("name", "User"),
                "activity_level": data.get("activity_level", "medium"),
                "goal_type": data.get("goal_type", "maintain"),
                **data
            }
            
            res = client.table("profiles").insert(create_data).execute()
            
            # Also create default daily_targets for the new user
            try:
                targets_data = {
                    "user_id": uid,
                    **DEFAULT_TARGETS
                }
                client.table("daily_targets").insert(targets_data).execute()
            except Exception as te:
                print(f"Error creating default targets: {te}")
            
            return res.data[0] if res.data else {}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating/creating profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.get("/targets")
def get_targets(client: Client = Depends(get_supabase_client)):
    """Get user daily targets"""
    try:
        res = client.table("daily_targets").select("*").single().execute()
        return res.data if res.data else DEFAULT_TARGETS
    except Exception as e:
        print(f"Error fetching targets: {e}")
        return DEFAULT_TARGETS

@router.put("/targets")
def update_targets(targets: TargetUpdate, client: Client = Depends(get_supabase_client)):
    """Update user daily targets"""
    data = targets.dict(exclude_unset=True)
    if not data:
        return {"message": "No data"}
    
    try:
        # Try to get existing targets
        current = client.table("daily_targets").select("user_id").execute()
        
        if current.data and len(current.data) > 0:
            uid = current.data[0]['user_id']
            res = client.table("daily_targets").update(data).eq("user_id", uid).execute()
            return res.data[0] if res.data else {}
        else:
            # Targets don't exist, create them
            user = client.auth.get_user()
            if not user or not user.user:
                raise HTTPException(status_code=401, detail="Not authenticated")
            
            uid = user.user.id
            create_data = {
                "user_id": uid,
                **DEFAULT_TARGETS,
                **data
            }
            res = client.table("daily_targets").insert(create_data).execute()
            return res.data[0] if res.data else {}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating targets: {e}")
        raise HTTPException(status_code=500, detail="Failed to update targets")
