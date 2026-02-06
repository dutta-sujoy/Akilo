
from fastapi import APIRouter, Depends, Query, HTTPException
from supabase import Client
from typing import Optional
from app.api.deps import get_supabase_client
from app.models.schemas import FoodCreate, FoodLogCreate

router = APIRouter()

@router.get("/search")
def search_foods(q: str, client: Client = Depends(get_supabase_client)):
    """Search for foods in master database and user's custom foods"""
    try:
        # Search master foods
        master = client.table("foods_master").select("*").ilike("name", f"%{q}%").limit(20).execute()
        
        # Search custom foods (RLS filters to user's own)
        custom = client.table("foods_custom").select("*").ilike("name", f"%{q}%").limit(20).execute()
        
        return {"master": master.data or [], "custom": custom.data or []}
    except Exception as e:
        print(f"Search error: {e}")
        return {"master": [], "custom": []}

@router.post("/custom")
def create_custom_food(food: FoodCreate, client: Client = Depends(get_supabase_client)):
    """Create a custom food for the user"""
    try:
        # Get user_id from profile
        p = client.table("profiles").select("id").single().execute()
        user_id = p.data['id']
        
        data = food.dict()
        data['user_id'] = user_id
        
        res = client.table("foods_custom").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        print(f"Create custom food error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/log")
def log_food(log: FoodLogCreate, client: Client = Depends(get_supabase_client)):
    """Log a food entry to the user's diary"""
    try:
        # Get user_id from profile
        p = client.table("profiles").select("id").single().execute()
        user_id = p.data['id']
        
        # Prepare data
        data = log.dict()
        data['user_id'] = user_id
        data['date'] = str(data['date'])
        
        # Ensure food_source is set
        if not data.get('food_source'):
            data['food_source'] = 'master'
        
        # Convert UUID fields to strings if they exist
        if data.get('food_master_id'):
            data['food_master_id'] = str(data['food_master_id'])
        else:
            data['food_master_id'] = None
        if data.get('food_custom_id'):
            data['food_custom_id'] = str(data['food_custom_id'])
        else:
            data['food_custom_id'] = None
            
        print(f"Logging food: {data}")
        
        res = client.table("food_logs").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        print(f"Log food error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/log")
def get_food_logs(date: str, client: Client = Depends(get_supabase_client)):
    """Get all food logs for a specific date"""
    try:
        res = client.table("food_logs").select("*").eq("date", date).execute()
        return res.data or []
    except Exception as e:
        print(f"Get food logs error: {e}")
        return []

@router.put("/log/{id}")
def update_food_log(id: str, log: FoodLogCreate, client: Client = Depends(get_supabase_client)):
    """Update a food log entry"""
    try:
        # Prepare data
        data = log.dict()
        data['date'] = str(data['date'])
        
        # Ensure food_source is set
        if not data.get('food_source'):
            data['food_source'] = 'master'
        
        # Convert UUID fields to strings if they exist
        if data.get('food_master_id'):
            data['food_master_id'] = str(data['food_master_id'])
        else:
            data['food_master_id'] = None
        if data.get('food_custom_id'):
            data['food_custom_id'] = str(data['food_custom_id'])
        else:
            data['food_custom_id'] = None
            
        print(f"Updating food log {id}: {data}")
        
        res = client.table("food_logs").update(data).eq("id", id).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        print(f"Update food log error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/log/{id}")
def delete_food_log(id: str, client: Client = Depends(get_supabase_client)):
    """Delete a food log entry"""
    try:
        res = client.table("food_logs").delete().eq("id", id).execute()
        return {"deleted": True}
    except Exception as e:
        print(f"Delete food log error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/favorites/{food_id}")
def add_favorite(food_id: str, request: dict, client: Client = Depends(get_supabase_client)):
    """Add a food to user's favorites"""
    try:
        # Get user_id from profile
        p = client.table("profiles").select("id").single().execute()
        user_id = p.data['id']
        
        # Get is_custom from request body
        is_custom = request.get('is_custom', False)
        
        data = {
            'user_id': user_id,
            'food_master_id': None if is_custom else food_id,
            'food_custom_id': food_id if is_custom else None
        }
        
        print(f"Adding favorite: food_id={food_id}, is_custom={is_custom}, data={data}")
        
        res = client.table("favorites").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        print(f"Add favorite error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/favorites/{food_id}")
def remove_favorite(food_id: str, client: Client = Depends(get_supabase_client)):
    """Remove a food from user's favorites"""
    try:
        # Try to delete by either master or custom id
        res = client.table("favorites")\
            .delete()\
            .or_(f"food_master_id.eq.{food_id},food_custom_id.eq.{food_id}")\
            .execute()
        return {"deleted": True}
    except Exception as e:
        print(f"Remove favorite error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/favorites")
def get_favorites(client: Client = Depends(get_supabase_client)):
    """Get user's favorite foods"""
    try:
        # Get favorites with joined food data
        res = client.table("favorites")\
            .select("*, foods_master(*), foods_custom(*)")\
            .execute()
        
        # Transform to unified format
        favorites = []
        for fav in res.data or []:
            food_data = fav.get('foods_master') or fav.get('foods_custom')
            if food_data:
                food_data['favorite_id'] = fav['id']
                food_data['is_custom'] = bool(fav.get('food_custom_id'))
                favorites.append(food_data)
        
        return favorites
    except Exception as e:
        print(f"Get favorites error: {e}")
        return []

@router.get("/recent")
def get_recent_foods(limit: int = 20, client: Client = Depends(get_supabase_client)):
    """Get recently logged foods"""
    try:
        # Get recent unique foods from food logs
        res = client.table("food_logs")\
            .select("food_name, food_master_id, food_custom_id, food_source")\
            .order("created_at", desc=True)\
            .limit(limit * 2)\
            .execute()
        
        # Get unique food IDs
        seen = set()
        recent_master_ids = []
        recent_custom_ids = []
        
        for log in res.data or []:
            if log.get('food_master_id') and log['food_master_id'] not in seen:
                seen.add(log['food_master_id'])
                recent_master_ids.append(log['food_master_id'])
            elif log.get('food_custom_id') and log['food_custom_id'] not in seen:
                seen.add(log['food_custom_id'])
                recent_custom_ids.append(log['food_custom_id'])
        
        # Fetch actual food data
        recent_foods = []
        
        if recent_master_ids:
            master_res = client.table("foods_master")\
                .select("*")\
                .in_("id", recent_master_ids[:limit])\
                .execute()
            for food in master_res.data or []:
                food['is_custom'] = False
                recent_foods.append(food)
        
        if recent_custom_ids and len(recent_foods) < limit:
            custom_res = client.table("foods_custom")\
                .select("*")\
                .in_("id", recent_custom_ids[:limit - len(recent_foods)])\
                .execute()
            for food in custom_res.data or []:
                food['is_custom'] = True
                recent_foods.append(food)
        
        return recent_foods
    except Exception as e:
        print(f"Get recent foods error: {e}")
        return []
