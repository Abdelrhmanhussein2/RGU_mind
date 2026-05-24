from enum import Enum

class RegulationStatus(str, Enum):
    draft    = "draft"
    active   = "active"
    archived = "archived"


class Language(str, Enum):
    ar = "ar"
    en = "en"