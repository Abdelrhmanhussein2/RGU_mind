from enum import Enum

class UserType(str, Enum):
    student    = "student"
    university = "university"

class RegulationStatus(str, Enum):
    draft    = "draft"
    active   = "active"
    archived = "archived"


class Language(str, Enum):
    ar = "ar"
    en = "en"

class ResponseStatus(str, Enum):
    FILE_VALIDATED_SUCCESS = "file_validated_success"
    FILE_VALIDATED_FAILURE = "file_validated_failure"
    FILE_VALIDATION_FAILED = "file_validation_failed"
    FILE_SIZE_EXCEEDED = "file_size_exceeded"
    
class FileTypeEnum(Enum):
    TXT=".txt"
    PDF=".pdf"