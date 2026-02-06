
from fastapi import APIRouter, Depends
from supabase import Client
from app.api.deps import get_supabase_client
from app.models.schemas import WeightLogCreate

router = APIRouter()

@router.post("/")
def log_weight(log: WeightLogCreate, client: Client = Depends(get_supabase_client)):
    p = client.table("profiles").select("id").single().execute()
    data = log.dict()
    data['user_id'] = p.data['id']
    data['date'] = str(data['date'])
    
    # We might want upsert for weight on a specific date
    res = client.table("weight_logs").upsert(data, on_conflict="user_id,date").execute()
    return res.data

@router.get("/")
def get_weight_logs(client: Client = Depends(get_supabase_client)):
    # Get last 30 days or all?
    res = client.table("weight_logs").select("*").order("date", desc=True).limit(30).execute()
    return res.data
