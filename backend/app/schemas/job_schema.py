# backend/app/schemas/job_schema.py

from pydantic import BaseModel


class JobResponse(BaseModel):
    status: str
    file_url: str | None = None