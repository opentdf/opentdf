# database
POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432"
POSTGRES_USER = "tdf_storage_manager"
POSTGRES_PASSWORD = "myPostgresPassword"
POSTGRES_DATABASE = "tdf_database"
POSTGRES_SCHEMA = "tdf_storage"

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DATABASE}"
database = databases.Database(DATABASE_URL)


