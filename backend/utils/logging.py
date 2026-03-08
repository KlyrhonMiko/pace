import logging
import logging.handlers
import os
from pathlib import Path

from utils.timezone import get_current_time_gmt8

# Create logs directory if it doesn't exist
LOGS_DIR = Path(__file__).parent.parent / ".logs"
LOGS_DIR.mkdir(exist_ok=True)

# Create error log file with date
LOG_FILE = LOGS_DIR / f"errors_{get_current_time_gmt8().strftime('%Y-%m-%d')}.log"


# Configure logging
def setup_logging():
    """Set up centralized error logging for all routers"""
    logger = logging.getLogger("pace_errors")
    logger.setLevel(logging.DEBUG)

    # Only add handler if it doesn't already exist
    if logger.handlers:
        return logger

    # File handler - logs all errors with full context
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
    )
    file_handler.setLevel(logging.DEBUG)

    # Detailed formatter with timestamp, router, level, and message
    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(name)s] [%(levelname)s] [%(filename)s:%(funcName)s:%(lineno)d] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    return logger


def log_error(
    router_name: str,
    endpoint: str,
    error_code: str,
    error_message: str,
    exception: Exception = None,
):
    """
    Log an error with context information

    Args:
        router_name: Name of the router (e.g., "users", "alumni", "student_records")
        endpoint: The endpoint name (e.g., "create_user", "update_student_record")
        error_code: The error code returned to client
        error_message: The error message returned to client
        exception: Optional exception object for full traceback
    """
    logger = setup_logging()

    log_entry = (
        f"[ROUTER: {router_name}] [ENDPOINT: {endpoint}] "
        f"[ERROR_CODE: {error_code}] [MESSAGE: {error_message}]"
    )

    if exception:
        logger.error(log_entry, exc_info=True)
    else:
        logger.error(log_entry)


def log_integrity_error(
    router_name: str, endpoint: str, error_code: str, error_message: str, sql_error: str
):
    """
    Log database integrity errors with SQL context

    Args:
        router_name: Name of the router
        endpoint: The endpoint name
        error_code: The error code returned to client
        error_message: The error message returned to client
        sql_error: The actual SQL error from the database
    """
    logger = setup_logging()

    log_entry = (
        f"[ROUTER: {router_name}] [ENDPOINT: {endpoint}] "
        f"[ERROR_CODE: {error_code}] [MESSAGE: {error_message}] "
        f"[SQL_ERROR: {sql_error}]"
    )

    logger.error(log_entry)


def log_auth_error(endpoint: str, username: str, error_code: str, error_message: str):
    """
    Log authentication errors with username context

    Args:
        endpoint: The endpoint name (e.g., "login")
        username: The username attempted (or "UNKNOWN")
        error_code: The error code
        error_message: The error message
    """
    logger = setup_logging()

    log_entry = (
        f"[ROUTER: auth] [ENDPOINT: {endpoint}] [USERNAME: {username}] "
        f"[ERROR_CODE: {error_code}] [MESSAGE: {error_message}]"
    )

    logger.error(log_entry)


def log_validation_error(
    router_name: str, endpoint: str, field: str, value: str, reason: str
):
    """
    Log validation errors

    Args:
        router_name: Name of the router
        endpoint: The endpoint name
        field: The field that failed validation
        value: The value that failed
        reason: Why it failed
    """
    logger = setup_logging()

    log_entry = (
        f"[ROUTER: {router_name}] [ENDPOINT: {endpoint}] "
        f"[VALIDATION_ERROR] [FIELD: {field}] [VALUE: {value}] [REASON: {reason}]"
    )

    logger.error(log_entry)
