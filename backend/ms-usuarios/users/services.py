from django.db import transaction
from typing import Optional, Dict, Any
from .repositories import UserRepository,DependenciaRepository,BDEmpleadosRepository
import requests

class BDEmpleadosService:
    @staticmethod
    def get_by_dni(dni: str) -> Optional[Any]:
        result=BDEmpleadosRepository.get_by_dni(dni)        
        return result       
class BDEmpleadosClient:
    BASE_URL = "http://127.0.0.1:8000/api/v1/users/empleados"
    @classmethod
    def get_by_dni(cls, dni: str) -> dict:
        try:
            response = requests.get(f"{cls.BASE_URL}/{dni}/", timeout=5)
            if not response:
                return {
                    "success": False,
                    "error": "El DNI no existe en la base de datos de RRHH."
                }
            else:
                if not response.is_active:
                    return {
                        "success": False,
                        "error": "Empleado inactivo."
                    }
            return {
                "success": True,
                "data": response
                }
        except requests.RequestException:
            return {
                "success": False,
                "error": "Error de conexión con el sistema RRHH."
            }
class DependencyService:
    @staticmethod
    def get_all_dependencies()-> Dict[str, Any]:#REPOSITORUES CON QURYSET
        result=DependenciaRepository.get_all()
        if not result.exists():
            return {
                "success": False,
                "error": "No hay dependencias registradas."                
            }        
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get_dependency_by_name(nombre: str) -> Optional[Any]:
        return DependenciaRepository.get_dependency_by_name(nombre)
    @staticmethod
    def get_dependency_by_id(dependency_id: int)-> Dict[str, Any]:#REPOSITORUES CON Optional[Dependencia]
        byId=DependenciaRepository.get_by_id(dependency_id)
        if not byId:
            return {
                "success": False,
                "error": "Dependencia no encontrada."                
            }
        return {
            "success": True,
            "data": byId
        }
    @staticmethod
    @transaction.atomic
    def create_dependency(data) -> Dict[str, Any]:     
        try:
            dependencia=DependencyService.get_dependency_by_name(data.get("nombre"))  
            if dependencia:
                if dependencia.is_active:
                    return {
                        "success": False,
                        "error": "Ya existe una dependencia Activa con el mismo nombre."                
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ya existe una dependencia Inactiva con el mismo nombre. Por favor active la dependencia o use otro nombre."                
                    }                    
            DependenciaRepository.create(data)
            return {
                "success": True,
                "message": "Dependencia creada exitosamente."
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    @staticmethod
    @transaction.atomic
    def update_dependency(dependency_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        dependencia = DependenciaRepository.get_by_id(dependency_id)
        if not dependencia:
            return {
                "success": False,
                "error": "Dependencia no encontrada."
            }        
        new_name = data.get("nombre")
        if new_name:
            existing = DependencyService.get_dependency_by_name(new_name)
            if existing and existing.id != dependencia.id:
                if existing.is_active:
                    return {
                        "success": False,
                        "error": "Ya existe una dependencia Activa con el mismo nombre."
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ya existe una dependencia Inactiva con el mismo nombre. Por favor active la dependencia o use otro nombre."
                    }
      
        DependenciaRepository.update(dependencia, data)
        return {
            "success": True,
            "message": "Dependencia actualizada exitosamente."
        }
    @staticmethod
    def activate_dependency(dependency_id:int) -> Dict[str, Any]:
        dependencia=DependencyService.get_dependency_by_id(dependency_id)
        if not dependencia.get("success"):
            return dependencia
        result=dependencia['data']
        if result.is_active:
            return {
                "success": False,
                "error": "La dependencia ya se encuentra activa."                
            }
        DependenciaRepository.activate(result)
        return {
            "success": True,
            "message": "Dependencia activada exitosamente."
        }
    @staticmethod
    def deactivate_dependency(dependency_id:int) -> Dict[str, Any]:
        dependencia=DependencyService.get_dependency_by_id(dependency_id)
        if not dependencia.get("success"):
            return dependencia
        result=dependencia['data']
        if not result.is_active:
            return {
                "success": False,
                "error": "La dependencia ya se encuentra inactiva."                
            }
        DependenciaRepository.deactivate(result)
        return {
            "success": True,
            "message": "Dependencia desactivada exitosamente."
        }

class UserService:
    @staticmethod
    def apply_filters(filters: Optional[Dict[str, Any]] = None):
        qs = UserRepository.base_queryset()
        return UserRepository.apply_filters(qs, filters)       
    @staticmethod
    def list_users() -> Dict[str, Any]:
        usuarios=UserRepository.get_all()
        if not usuarios.exists():       
            return {
                    "success": False,
                    "error": "No hay usuarios registrados."                
                }
        return {
            "success": True,
            "data": usuarios
        }
    @staticmethod
    def get_user_by_id(user_id: int) -> Dict[str, Any]:
        result=UserRepository.get_by_id(user_id)
        if not result:
            return {
                "success": False,
                "error": "Usuario no encontrado."                
            }
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    @staticmethod
    def get_user_by_dni(dni: str) -> Dict[str, Any]:
        result=UserRepository.get_by_dni(dni)
        if not result:
            return {
                "success": False,
                "error": "Usuario no encontrado por DNI."                
            }
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    @transaction.atomic
    def create_user(data: Dict[str, Any], sede_ids=None) -> Any:
        from authentication.services import CredentialService
        dni=data.get("dni")
        empleado_response = BDEmpleadosClient.get_by_dni(dni)
        if not empleado_response.get("success"):
            return empleado_response
        empleado = empleado_response.get("data")     
        usuario=UserRepository.get_by_dni(dni)
        if usuario:
            if usuario.is_active:
                return {
                    "success": False,
                    "error": "Ya existe un usuario Activo con el mismo DNI."                
                }
            else:
                return {
                    "success": False,
                    "error": "Ya existe un usuario Inactivo con el mismo DNI. Por favor active el usuario o use otro DNI."
                }
        data['dni'] = empleado.get('dni')
        data["first_name"] = empleado.get("first_name")
        data["last_name"] = empleado.get("last_name")
        data["cargo"] = empleado.get("cargo")
        UserRepository.create(data=data, sede_ids=sede_ids)
        es_usuario_sistema = data.get("es_usuario_sistema")             
        if es_usuario_sistema:
            CredentialService.create(dni)             
        return {
            "success": True,
            "message": "Usuario creado exitosamente.",
        }     
    @staticmethod
    @transaction.atomic
    def update_user(user_id:int, data: Dict[str, Any], sede_ids=None) -> Dict[str, Any]:
        user = UserRepository.get_by_id(user_id)
        if not user:
            return {
                "success": False,
                "error": "Usuario no encontrado."
            }
        UserRepository.update(user, data, sede_ids)                        
        return {
            "success": True,
            "message": "Usuario actualizado exitosamente.",
        }
    @staticmethod
    def activate_user(user_id) -> Dict[str, Any]:
        result=UserService.get_user_by_id(user_id)
        if not result["success"]:
            return result
        result=result['data']
        if result.is_active:
            return {
                "success": False,
                "error": "El usuario ya se encuentra activo."                
            }
        UserRepository.activate(result)
        return {
            "success": True,
            "message": "Usuario activado exitosamente."
        }
    @staticmethod
    def deactivate_user(user_id) -> Dict[str, Any]:
        result=UserService.get_user_by_id(user_id)
        if not result["success"]:
            return result
        result=result['data']
        if not result.is_active:
            return {
                "success": False,
                "error": "El usuario ya se encuentra desactivado."                
            }
        UserRepository.deactivate(user_id)
        return {
            "success": True,
            "message": "Usuario desactivado exitosamente."
        }
    