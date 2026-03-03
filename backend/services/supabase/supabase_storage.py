import os
import logging
import json
from typing import Tuple, Optional
from fastapi import UploadFile
import httpx

logger = logging.getLogger(__name__)


class SupabaseStorageService:
    """Service for handling image uploads to Supabase Storage via REST API"""
    
    def __init__(self):
        """Initialize Supabase Storage client using direct REST API calls"""
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.bucket_name = os.getenv("SUPABASE_BUCKET_NAME", "event-images")
        
        if not self.supabase_url or not self.service_role_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")
        
        self.supported_formats = {"image/jpeg", "image/png", "image/webp"}
        self.max_file_size = 5 * 1024 * 1024  # 5MB
        
        # Construct storage API base URL
        self.storage_url = f"{self.supabase_url.rstrip('/')}/storage/v1"
    
    def _get_headers(self) -> dict:
        """Get authorization headers for Supabase Storage API"""
        return {
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json"
        }
    
    def validate_file(self, file: UploadFile) -> Tuple[bool, Optional[str]]:
        """
        Validate file type and size
        
        Args:
            file: UploadFile object
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if file.content_type not in self.supported_formats:
            return False, f"Unsupported file type: {file.content_type}. Supported: JPEG, PNG, WebP"
        
        if file.size and file.size > self.max_file_size:
            return False, f"File too large. Maximum size is 5MB, got {file.size / (1024*1024):.2f}MB"
        
        return True, None
    
    async def upload_image(self, file: UploadFile, event_id: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Upload image to Supabase Storage
        
        Args:
            file: UploadFile object
            event_id: Event ID for organizing storage path
        
        Returns:
            Tuple of (success, file_path, error_message)
        """
        try:
            # Validate file
            is_valid, error = self.validate_file(file)
            if not is_valid:
                return False, None, error
            
            # Read file content
            file_content = await file.read()
            
            # Check file size
            if len(file_content) > self.max_file_size:
                return False, None, f"File too large. Maximum size is 5MB"
            
            # Get file extension
            file_extension = self._get_file_extension(file.content_type)
            file_path = f"events/{event_id}/image.{file_extension}"
            
            # Delete existing image if present (for update scenario)
            await self.delete_image(file_path)
            
            # Upload file via REST API
            async with httpx.AsyncClient() as client:
                # Supabase uses a different Content-Type header format for binary uploads
                headers = self._get_headers()
                headers.pop("Content-Type")  # Remove JSON content-type for binary upload
                
                upload_url = f"{self.storage_url}/object/{self.bucket_name}/{file_path}"
                
                response = await client.post(
                    upload_url,
                    content=file_content,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code not in (200, 201):
                    error_msg = response.text
                    logger.error(f"Supabase upload error ({response.status_code}): {error_msg}")
                    return False, None, f"Failed to upload image: {error_msg[:100]}"
                
                logger.info(f"Successfully uploaded image to {file_path}")
                return True, file_path, None
            
        except Exception as e:
            logger.error(f"Error uploading image: {str(e)}")
            return False, None, f"Failed to upload image: {str(e)}"
    
    def get_public_url(self, file_path: str) -> Optional[str]:
        """
        Get public URL for a file
        
        Args:
            file_path: Path to file in storage
        
        Returns:
            Public URL string
        """
        if not file_path:
            return None
        
        # Construct public URL (works if bucket is public)
        public_url = f"{self.supabase_url.rstrip('/')}/storage/v1/object/public/{self.bucket_name}/{file_path}"
        return public_url
    
    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> Optional[str]:
        """
        Get signed URL that expires (default 1 hour)
        
        Args:
            file_path: Path to file in storage
            expires_in: Expiration time in seconds
        
        Returns:
            Signed URL string
        """
        try:
            # For public buckets, return public URL as fallback
            # In production, implement proper signed URL generation via REST API
            return self.get_public_url(file_path)
        except Exception as e:
            logger.error(f"Error creating signed URL: {str(e)}")
            return None
    
    async def delete_image(self, file_path: str) -> Tuple[bool, Optional[str]]:
        """
        Delete image from Supabase Storage
        
        Args:
            file_path: Path to file in storage
        
        Returns:
            Tuple of (success, error_message)
        """
        try:
            if not file_path:
                return True, None
            
            async with httpx.AsyncClient() as client:
                headers = self._get_headers()
                headers.pop("Content-Type", None)
                delete_url = f"{self.storage_url}/object/{self.bucket_name}/{file_path}"
                
                response = await client.delete(
                    delete_url,
                    headers=headers,
                    timeout=30.0
                )
                
                # 204/200 = deleted, 404 = not found (all OK)
                if response.status_code in (204, 404, 200):
                    logger.info(f"Successfully deleted image at {file_path}")
                    return True, None

                # Some Supabase setups return HTTP 400 with a payload indicating not_found
                if response.status_code == 400:
                    try:
                        payload = response.json()
                    except json.JSONDecodeError:
                        payload = None

                    if isinstance(payload, dict):
                        error_name = str(payload.get("error", "")).lower()
                        message = str(payload.get("message", "")).lower()
                        if error_name == "not_found" or "object not found" in message:
                            logger.info(f"Image not found at {file_path}; continuing")
                            return True, None
                else:
                    error_msg = response.text
                    logger.error(f"Supabase delete error ({response.status_code}): {error_msg}")
                    return False, f"Failed to delete image: {error_msg[:100]}"
                    
        except Exception as e:
            logger.error(f"Error deleting image: {str(e)}")
            # Don't fail on delete errors - image might not exist
            return True, None
    
    @staticmethod
    def _get_file_extension(content_type: str) -> str:
        """
        Get file extension from content type
        
        Args:
            content_type: MIME type string
        
        Returns:
            File extension without dot
        """
        extensions = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        }
        return extensions.get(content_type, "jpg")
