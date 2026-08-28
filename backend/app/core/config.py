from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # This automatically looks for variables in the .env file
    # Application Name
    PROJECT_NAME: str = "PricePilot AI"
    
    # JWT Authentication Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    DATABASE_URL: str
    ENVIRONMENT: str = "development"

    # RapidAPI Keys (kept for reference)
    RAPID_API_KEY: str = ""
    AMAZON_API_HOST: str = ""
    FLIPKART_API_HOST: str = ""
    COMPETITOR_SYNC_COOLDOWN_SECONDS: int = 60

    # SerpApi — Google Shopping competitor pricing
    SERPAPI_API_KEY: str = ""

    # Gemini
    GEMINI_API_KEY: str = ""

    # ZenRows
    ZENROWS_API_KEY: str = ""

    # Scrapingdog
    SCRAPINGDOG_API_KEY: str = ""

    # Tell Pydantic to read the exact .env file in our backend folder
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Create a global settings instance to be imported elsewhere
settings = Settings()
