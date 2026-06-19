from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from services.admin_service import admin_service

class AdminController:
    def create_admin_controller(self, request, admin_id: str, db: Session):
        try:
            admin = admin_service.create_admin(request, admin_id, db)
            return {
                "message": "Admin created successfully",
                "admin": {
                    "id": str(admin.id),
                    "name": admin.name,
                    "email": admin.email
                }
            }
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    def change_university_status_controller(self, university_id: str, new_status: str, admin_id: str, db: Session):
        try:
            university = admin_service.change_university_status(university_id, new_status, admin_id, db)
            return {
                "message": f"University status updated to {new_status}",
                "university": {
                    "id": str(university.id),
                    "name": university.name,
                    "status": university.status
                }
            }
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

admin_controller = AdminController()
