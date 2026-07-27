from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # This automatically looks for variables in the .env file
    DATABASE_URL: str
    ENVIRONMENT: str = "development"

    # Tell Pydantic to read the exact .env file in our backend folder
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Create a global settings instance to be imported elsewhere
settings = Settings()
