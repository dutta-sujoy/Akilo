
from fastapi import FastAPI
from app.api.endpoints import profile, food, water, weight, analytics
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Akilo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(food.router, prefix="/api/food", tags=["Food"])
app.include_router(water.router, prefix="/api/water", tags=["Water"])
app.include_router(weight.router, prefix="/api/weight", tags=["Weight"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
def health_check():
    return {"status": "ok", "app": "Akilo Backend"}
