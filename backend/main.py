from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Literal


# =========================================
# PATHS
# =========================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"


# =========================================
# MODEL
# =========================================

MODEL_PATH = BASE_DIR / "Mental_Health_Model.pkl"

model = joblib.load(MODEL_PATH)


top_countries = [
    "Other",
    "India",
    "USA",
    "Canada",
    "Australia",
    "UK",
    "Germany",
    "Mexico",
    "Turkey",
    "France"
]


# =========================================
# FASTAPI
# =========================================

app = FastAPI(
    title="Manshik Santulan API",
    description="Mental Health Score Prediction API",
    version="1.0.0"
)


# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# FRONTEND
# =========================================

@app.get("/", include_in_schema=False)
def home():

    index_file = FRONTEND_DIR / "index.html"

    if not index_file.exists():

        return {
            "message": "Frontend index.html not found",
            "frontend_path": str(index_file)
        }

    return FileResponse(index_file)


@app.get("/style.css", include_in_schema=False)
def style():

    css_file = FRONTEND_DIR / "style.css"

    return FileResponse(
        css_file,
        media_type="text/css"
    )


@app.get("/script.js", include_in_schema=False)
def script():

    js_file = FRONTEND_DIR / "script.js"

    return FileResponse(
        js_file,
        media_type="application/javascript"
    )


# =========================================
# PYDANTIC MODEL
# =========================================

class StudentData(BaseModel):

    age: int = Field(
        ...,
        ge=10,
        le=100
    )

    gender: Literal[
        "Male",
        "Female"
    ]

    country: str

    academic_level: Literal[
        "Undergraduate",
        "Graduate",
        "High School"
    ]

    most_used_platform: Literal[
        "Facebook",
        "LinkedIn",
        "Instagram",
        "Snapchat",
        "Twitter",
        "YouTube",
        "TikTok",
        "LINE",
        "KakaoTalk",
        "VKontakte",
        "WhatsApp",
        "WeChat"
    ]

    purpose_of_use: Literal[
        "Networking",
        "Education",
        "Entertainment",
        "News"
    ]

    avg_daily_usage_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    daily_unlocks: int = Field(
        ...,
        ge=0
    )

    study_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    physical_activity_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    sleep_hours_per_night: float = Field(
        ...,
        ge=0,
        le=24
    )

    stress_level: Literal[
        "Medium",
        "Low",
        "Very High",
        "High"
    ]


# =========================================
# RESPONSE MODEL
# =========================================

class PredictionResponse(BaseModel):

    predicted_mental_health_score: float


# =========================================
# PREDICTION
# =========================================

@app.post(
    "/predict",
    response_model=PredictionResponse
)
def predict(data: StudentData):

    country_group = (
        data.country
        if data.country in top_countries
        else "Other"
    )


    input_row = pd.DataFrame([{

        "Age":
            data.age,

        "Gender":
            data.gender,

        "Country":
            data.country,

        "Academic_Level":
            data.academic_level,

        "Most_Used_Platform":
            data.most_used_platform,

        "Purpose_Of_Use":
            data.purpose_of_use,

        "Avg_Daily_Usage_Hours":
            data.avg_daily_usage_hours,

        "Daily_Unlocks":
            data.daily_unlocks,

        "Study_Hours":
            data.study_hours,

        "Physical_Activity_Hours":
            data.physical_activity_hours,

        "Sleep_Hours_Per_Night":
            data.sleep_hours_per_night,

        "Stress_Level":
            data.stress_level,

        "Grouped_country":
            country_group

    }])


    prediction = model.predict(
        input_row
    )[0]


    return PredictionResponse(
        predicted_mental_health_score=
            round(
                float(prediction),
                2
            )
    )