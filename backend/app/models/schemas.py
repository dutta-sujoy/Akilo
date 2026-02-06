
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import date, datetime
from uuid import UUID

# Unit Types
UnitType = Literal['g', 'ml', 'serving']
MealType = Literal['breakfast', 'lunch', 'snacks', 'dinner']
FoodSource = Literal['master', 'custom', 'manual']
ActivityLevel = Literal['low', 'medium', 'high']
GoalType = Literal['maintain', 'fat_loss', 'muscle_gain']

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[ActivityLevel] = None
    goal_type: Optional[GoalType] = None

class TargetUpdate(BaseModel):
    calories_target: Optional[int] = None
    protein_target_g: Optional[int] = None
    carbs_target_g: Optional[int] = None
    fats_target_g: Optional[int] = None
    water_target_ml: Optional[int] = None

class FoodCreate(BaseModel):
    name: str
    unit_type: UnitType
    base_qty: float
    calories: float
    protein_g: float
    carbs_g: float
    fats_g: float

class FoodLogCreate(BaseModel):
    date: date
    meal_type: MealType
    food_source: Optional[FoodSource] = 'master'
    food_master_id: Optional[UUID] = None
    food_custom_id: Optional[UUID] = None
    food_name: str
    qty: float
    calories: float
    protein_g: float
    carbs_g: float
    fats_g: float

class WaterLogCreate(BaseModel):
    date: date
    amount_ml: int

class WeightLogCreate(BaseModel):
    date: date
    weight_kg: float
