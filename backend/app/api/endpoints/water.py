
from fastapi import APIRouter, Depends
from supabase import Client
from app.api.deps import get_supabase_client
from app.models.schemas import WaterLogCreate

router = APIRouter()

@router.post("/")
def log_water(log: WaterLogCreate, client: Client = Depends(get_supabase_client)):
    p = client.table("profiles").select("id").single().execute()
    data = log.dict()
    data['user_id'] = p.data['id']
    data['date'] = str(data['date'])
    
    res = client.table("water_logs").insert(data).execute()
    return res.data

@router.get("/")
def get_water_logs(date: str, client: Client = Depends(get_supabase_client)):
    res = client.table("water_logs").select("*").eq("date", date).execute()
    return res.data
