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

    # Tell Pydantic to read the exact .env file in our backend folder
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Create a global settings instance to be imported elsewhere
settings = Settings()
