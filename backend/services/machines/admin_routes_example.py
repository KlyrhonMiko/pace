"""
Admin API Endpoints for Model Retraining

Add these routes to your FastAPI app to let admins retrain models
via a button click in the admin dashboard.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime
import pandas as pd
import shutil

# Import your retraining script
from backend.services.machines.retrain_models import retrain_models, rollback_models, validate_csv

router = APIRouter(prefix="/admin", tags=["admin"])

# Configuration
UPLOAD_DIR = Path("backend/data/uploads")
MODELS_DIR = Path("backend/services/machines/random_pickles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ==============================================================================
# Response Models
# ==============================================================================

class RetrainResponse(BaseModel):
    success: bool
    message: str
    metrics: dict = {}
    backup_location: str | None = None
    error: str | None = None


class ValidationResponse(BaseModel):
    valid: bool
    message: str
    warnings: list[str] = []


# ==============================================================================
# Background task tracking (simple in-memory store)
# ==============================================================================

retraining_status = {
    'is_running': False,
    'last_run': None,
    'last_result': None
}


# ==============================================================================
# Endpoints
# ==============================================================================

@router.post("/upload-training-data", response_model=ValidationResponse)
async def upload_training_data(file: UploadFile = File(...)):
    """
    Step 1: Admin uploads a CSV file for validation.
    
    This endpoint validates the CSV format and content without training.
    Returns validation results and saves file temporarily.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Save uploaded file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"training_data_{timestamp}.csv"
    filepath = UPLOAD_DIR / filename
    
    try:
        # Save file
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Validate CSV
        df = pd.read_csv(filepath)
        is_valid, validation_msg = validate_csv(df)
        
        warnings = []
        
        # Additional checks for warnings (not errors)
        if len(df) < 500:
            warnings.append(f"Dataset size ({len(df)}) is smaller than recommended (500+)")
        
        programs = df['Degree'].unique()
        if len(programs) < 5:
            warnings.append(f"Only {len(programs)} degree programs found. More diversity recommended.")
        
        return ValidationResponse(
            valid=is_valid,
            message=validation_msg if is_valid else f"Validation failed: {validation_msg}",
            warnings=warnings
        )
        
    except Exception as e:
        # Clean up file on error
        if filepath.exists():
            filepath.unlink()
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")


@router.post("/retrain-models", response_model=RetrainResponse)
async def trigger_retraining(
    background_tasks: BackgroundTasks,
    filename: str,
    backup: bool = True
):
    """
    Step 2: Admin triggers model retraining.
    
    This runs in the background so the admin doesn't have to wait.
    Check status with GET /admin/retraining-status
    
    Args:
        filename: Name of the CSV file from /upload-training-data
        backup: Whether to backup existing models before overwriting
    """
    # Check if already retraining
    if retraining_status['is_running']:
        raise HTTPException(
            status_code=409, 
            detail="Retraining already in progress. Check /admin/retraining-status"
        )
    
    # Verify file exists
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")
    
    # Start retraining in background
    background_tasks.add_task(
        _run_retraining_task,
        str(filepath),
        str(MODELS_DIR),
        backup
    )
    
    return RetrainResponse(
        success=True,
        message="Retraining started in background. Check /admin/retraining-status for progress."
    )


@router.get("/retraining-status")
async def get_retraining_status():
    """
    Check the status of background retraining.
    
    Returns:
        {
            'is_running': bool,
            'last_run': timestamp or None,
            'last_result': RetrainResponse or None
        }
    """
    return retraining_status


@router.post("/rollback-models")
async def rollback_to_backup(backup_location: str):
    """
    Rollback to a previous model version.
    
    Args:
        backup_location: Path returned from a previous retraining (result['backup_location'])
    
    Example:
        POST /admin/rollback-models
        {
            "backup_location": "backend/services/machines/random_pickles/backups/20250314_143022"
        }
    """
    try:
        success = rollback_models(backup_location, str(MODELS_DIR))
        
        if success:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": f"Successfully rolled back to: {backup_location}"
                }
            )
        else:
            raise HTTPException(status_code=500, detail="Rollback failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rollback error: {str(e)}")


@router.get("/list-backups")
async def list_backups():
    """
    List all available model backups.
    
    Returns a list of backup directories with timestamps.
    """
    backups_dir = MODELS_DIR / 'backups'
    
    if not backups_dir.exists():
        return {"backups": []}
    
    backups = []
    for backup_path in sorted(backups_dir.iterdir(), reverse=True):
        if backup_path.is_dir():
            # Check if all 4 model files exist
            required_files = [
                'model1_realistic.pkl',
                'model1_info.pkl',
                'model2_improvement.pkl',
                'model2_info.pkl'
            ]
            files_exist = all((backup_path / f).exists() for f in required_files)
            
            if files_exist:
                backups.append({
                    'timestamp': backup_path.name,
                    'path': str(backup_path),
                    'created': datetime.strptime(backup_path.name, '%Y%m%d_%H%M%S').isoformat()
                })
    
    return {"backups": backups}


# ==============================================================================
# Background Task
# ==============================================================================

def _run_retraining_task(csv_path: str, output_dir: str, backup: bool):
    """
    Background task that actually runs the retraining.
    Updates global status when complete.
    """
    retraining_status['is_running'] = True
    retraining_status['last_run'] = datetime.now().isoformat()
    
    try:
        # Run retraining
        result = retrain_models(
            csv_path=csv_path,
            output_dir=output_dir,
            backup=backup
        )
        
        retraining_status['last_result'] = result
        
    except Exception as e:
        retraining_status['last_result'] = {
            'success': False,
            'message': 'Retraining crashed',
            'error': str(e)
        }
    
    finally:
        retraining_status['is_running'] = False


# ==============================================================================
# Usage in main app
# ==============================================================================

"""
In your main FastAPI app.py:

from fastapi import FastAPI
from backend.admin_routes import router as admin_router

app = FastAPI()
app.include_router(admin_router)

# Now you have these endpoints:
# POST   /admin/upload-training-data
# POST   /admin/retrain-models
# GET    /admin/retraining-status
# POST   /admin/rollback-models
# GET    /admin/list-backups
"""
