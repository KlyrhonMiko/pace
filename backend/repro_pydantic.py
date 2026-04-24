import json
from pydantic import BaseModel, Field, ValidationError
from typing import Optional

class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    current_password: Optional[str] = Field(default=None, min_length=8, max_length=72)
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)

# Test with valid dict
data = {"current_password": "OldPassword123", "password": "NewPassword123"}
try:
    update = UserUpdate.model_validate(data)
    print("Validation success")
except Exception as e:
    print(f"Validation failed: {e}")

# Test with something that isn't a dict
try:
    UserUpdate.model_validate("not a dict")
except ValidationError as e:
     print(f"Validation failed (string): {e}")
except Exception as e:
     print(f"Validation failed (string, non-validation): {e}")

try:
    UserUpdate.model_validate(None)
except ValidationError as e:
     print(f"Validation failed (None): {e}")
except Exception as e:
     print(f"Validation failed (None, non-validation): {e}")
