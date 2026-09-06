import httpx
from supabase import Client, ClientOptions, create_client

from app.dependencies.config import settings

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_key,
            options=ClientOptions(httpx_client=httpx.Client()),
        )
    return _supabase_client
