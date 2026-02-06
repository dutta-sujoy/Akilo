
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.api.deps import get_supabase_client
from datetime import datetime, timedelta

router = APIRouter()

DEFAULT_TARGETS = {
    "calories_target": 2000,
    "protein_target_g": 120,
    "carbs_target_g": 250,
    "fats_target_g": 60,
    "water_target_ml": 2500
}

@router.get("/daily")
def get_daily_summary(date: str, client: Client = Depends(get_supabase_client)):
    try:
        # Calculate totals for the day
        food_res = client.table("food_logs").select("*").eq("date", date).execute()
        water_res = client.table("water_logs").select("*").eq("date", date).execute()
        
        food_data = food_res.data if food_res and food_res.data else []
        water_data = water_res.data if water_res and water_res.data else []
        
        total_cals = sum(float(item['calories']) for item in food_data)
        total_protein = sum(float(item['protein_g']) for item in food_data)
        total_carbs = sum(float(item['carbs_g']) for item in food_data)
        total_fats = sum(float(item['fats_g']) for item in food_data)
        total_water = sum(int(item['amount_ml']) for item in water_data)
        
        # Get targets - handle None response gracefully
        try:
            targets_res = client.table("daily_targets").select("*").limit(1).execute()
            targets = targets_res.data[0] if targets_res and targets_res.data and len(targets_res.data) > 0 else DEFAULT_TARGETS
        except Exception as e:
            print(f"Error fetching targets: {e}")
            targets = DEFAULT_TARGETS
        
        return {
            "summary": {
                "calories": total_cals,
                "protein": total_protein,
                "carbs": total_carbs,
                "fats": total_fats,
                "water": total_water
            },
            "targets": targets
        }
    except Exception as e:
        print(f"Error in get_daily_summary: {e}")
        # Return default values on error
        return {
            "summary": {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "water": 0
            },
            "targets": DEFAULT_TARGETS
        }

@router.get("/weekly")
def get_weekly_summary(days: int = 7, client: Client = Depends(get_supabase_client)):
    """Get daily summaries for the past N days"""
    try:
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days - 1)
        
        # Fetch all food logs in date range
        food_res = client.table("food_logs").select("*").gte("date", str(start_date)).lte("date", str(end_date)).execute()
        water_res = client.table("water_logs").select("*").gte("date", str(start_date)).lte("date", str(end_date)).execute()
        
        food_data = food_res.data if food_res and food_res.data else []
        water_data = water_res.data if water_res and water_res.data else []
        
        # Get targets
        try:
            targets_res = client.table("daily_targets").select("*").limit(1).execute()
            targets = targets_res.data[0] if targets_res and targets_res.data and len(targets_res.data) > 0 else DEFAULT_TARGETS
        except Exception as e:
            print(f"Error fetching targets: {e}")
            targets = DEFAULT_TARGETS
        
        # Get streak
        try:
            streak_res = client.table("streaks").select("*").limit(1).execute()
            streak = streak_res.data[0] if streak_res and streak_res.data and len(streak_res.data) > 0 else {"current_streak": 0, "best_streak": 0}
        except Exception as e:
            print(f"Error fetching streak: {e}")
            streak = {"current_streak": 0, "best_streak": 0}
        
        # Get weight logs for trend
        try:
            weight_res = client.table("weight_logs").select("*").gte("date", str(start_date - timedelta(days=30))).order("date", desc=True).limit(10).execute()
            weight_data = weight_res.data if weight_res and weight_res.data else []
        except Exception as e:
            print(f"Error fetching weight: {e}")
            weight_data = []
        
        # Group by date
        daily_data = {}
        for i in range(days):
            d = str(start_date + timedelta(days=i))
            daily_data[d] = {
                "date": d, 
                "summary": {
                    "calories": 0, 
                    "protein": 0, 
                    "carbs": 0, 
                    "fats": 0, 
                    "water": 0
                },
                "targets": targets
            }
        
        for item in food_data:
            d = item.get("date")
            if d in daily_data:
                daily_data[d]["summary"]["calories"] += float(item.get("calories", 0))
                daily_data[d]["summary"]["protein"] += float(item.get("protein_g", 0))
                daily_data[d]["summary"]["carbs"] += float(item.get("carbs_g", 0))
                daily_data[d]["summary"]["fats"] += float(item.get("fats_g", 0))
        
        for item in water_data:
            d = item.get("date")
            if d in daily_data:
                daily_data[d]["summary"]["water"] += int(item.get("amount_ml", 0))
        
        # Calculate weight trend
        weight_trend = 0
        if len(weight_data) >= 2:
            weight_trend = float(weight_data[0].get("weight_kg", 0)) - float(weight_data[-1].get("weight_kg", 0))
        
        return {
            "data": list(daily_data.values()),
            "targets": targets,
            "streak": streak,
            "weight_trend": round(weight_trend, 1),
            "weight_logs": weight_data
        }
    except Exception as e:
        print(f"Error in get_weekly_summary: {e}")
        return {
            "data": [],
            "targets": DEFAULT_TARGETS,
            "streak": {"current_streak": 0, "best_streak": 0},
            "weight_trend": 0,
            "weight_logs": []
        }
