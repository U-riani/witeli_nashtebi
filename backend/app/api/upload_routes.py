# backend/app/api/upload_routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

from app.services.reconciliation_service import process_inventory

router = APIRouter(tags=["Inventory"])

@router.post("/upload")
async def upload_files(
    witeli: UploadFile = File(...),
    cnobari: UploadFile = File(...),
    live: UploadFile = File(...)
):
    try:
        output_stream = await process_inventory(witeli, cnobari, live)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail="Processing failed")

    return StreamingResponse(
        output_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=result.xlsx"}
    )