"""
models/composite.py — re-export shim.
All schema classes now live in schemas/composite.py.
This file is kept for backwards-compat imports during the ongoing refactor.
"""
from schemas.composite import (
    CompleteAlumniRegistration, CompleteAlumniResponse,
    BatchAlumniRegistrationItemSafeDisplay, BatchAlumniRegistrationItem,
    BatchAlumniRegistrationResult, BatchAlumniRegister, BatchAlumniRegisterResponse,
    BatchAlumniUpdateItem, BatchAlumniUpdateResult, BatchAlumniUpdate, BatchAlumniUpdateResponse,
    BatchAlumniDeleteResult, BatchAlumniDelete, BatchAlumniDeleteResponse,
    BatchAlumniRestoreResult, BatchAlumniRestore, BatchAlumniRestoreResponse,
)

__all__ = [
    "CompleteAlumniRegistration", "CompleteAlumniResponse",
    "BatchAlumniRegistrationItemSafeDisplay", "BatchAlumniRegistrationItem",
    "BatchAlumniRegistrationResult", "BatchAlumniRegister", "BatchAlumniRegisterResponse",
    "BatchAlumniUpdateItem", "BatchAlumniUpdateResult", "BatchAlumniUpdate", "BatchAlumniUpdateResponse",
    "BatchAlumniDeleteResult", "BatchAlumniDelete", "BatchAlumniDeleteResponse",
    "BatchAlumniRestoreResult", "BatchAlumniRestore", "BatchAlumniRestoreResponse",
]
