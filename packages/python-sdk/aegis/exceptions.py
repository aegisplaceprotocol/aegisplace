"""Aegis SDK exceptions."""

class AegisError(Exception):
    """Base exception for Aegis SDK."""
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code

class AegisNotFoundError(AegisError):
    """Resource not found (404)."""
    pass

class AegisAuthError(AegisError):
    """Authentication failed (401/403)."""
    pass
