from django.db import transaction
from typing import Optional, Dict, Any
from .repositories import UserRepository,DependenciaRepository,BDEmpleadosRepository
from datetime import datetime
from rest_framework.exceptions import ValidationError, NotFound
import requests
from django.conf import settings
from authentication.services import CredentialService


class BDEmpleadosService:
    @staticmethod
    def get_by_dni(dni: str) -> Optional[Any]:
        response=BDEmpleadosRepository.get_by_dni(dni)    
        if response.status_code == 404:
                raise NotFound(f'El DNI {dni} no existe en la base de datos de RRHH.')    
        if response.status_code != 200:
                raise ValidationError(f'Error consultando el sistema RRHH.')
        return response       
class BDEmpleadosClient:    
    BASE_URL = getattr(settings, 'MS_USUARIOS_BASE_URL', 'http://127.0.0.1:8000/api/v1')
    @classmethod
    def get_by_dni(cls, dni: str) -> dict:
        try:
            response = requests.get(f"{cls.BASE_URL}/users/empleados/{dni}/", timeout=5)
            print(f"DEBUG: Consultando a: {response.url} - Status: {response.status_code }")
            if response.status_code == 404:
                raise NotFound(f'El DNI {dni} no existe en la base de datos.')
            if response.status_code != 200:
                raise ValidationError(f'Error consultando el sistema RRHH.')
            data = response.json()
            if not data.get("is_active", False):
                return {
                    "success": False,
                    "error": "Empleado inactivo."
                }

            return {
                "success": True,
                "data": data
            }
        except requests.RequestException:
            return {
                "success": False,
                "error": "Error de conexión con el sistema RRHH."
            }
            
class DependencyService:
    @staticmethod
    def get_all_dependencies()-> Dict[str, Any]:
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
    def get_dependency_by_id(dependency_id: int)-> Dict[str, Any]:
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
                    raise ValidationError(f'Ya existe una dependencia Activa con el mismo nombre.')  
                else:
                    raise ValidationError(f'Ya existe una dependencia Inactiva con el mismo nombre. Por favor active la dependencia o use otro nombre.')                   
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
            raise ValidationError(f'Dependencia no encontrada.')  
        new_name = data.get("nombre")
        if new_name:
            existing = DependencyService.get_dependency_by_name(new_name)
            if existing and existing.id != dependencia.id:
                if existing.is_active:
                    raise ValidationError(f'Ya existe una dependencia Activa con el mismo nombre.')  
                else:
                    raise ValidationError(f'Ya existe una dependencia Inactiva con el mismo nombre. Por favor active la dependencia o use otro nombre.')  
      
        DependenciaRepository.update(dependencia, data)
        return {
            "success": True,
            "message": "Dependencia: "+str(new_name)+", actualizada exitosamente."
        }
    @staticmethod
    def activate_dependency(dependency_id:int) -> Dict[str, Any]:
        dependencia=DependencyService.get_dependency_by_id(dependency_id)
        if not dependencia.get("success"):
            return dependencia
        result=dependencia['data']
        if result.is_active:
            raise ValidationError(f'La dependencia ya se encuentra activa.') 
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
            raise ValidationError(f'La dependencia ya se encuentra inactiva.') 
        DependenciaRepository.deactivate(result)
        return {
            "success": True,
            "message": "Dependencia desactivada exitosamente."
        }

class UserService:
    @staticmethod
    def _resolver_empresa(nombre_empresa_rrhh: str):
        result=UserRepository._resolver_empresa(nombre_empresa_rrhh)
        if not result:
            raise NotFound('Empresa no encontrada.')
        return result    
    @staticmethod
    def list_users() -> Dict[str, Any]:
        usuarios = UserRepository.get_all()
        if not usuarios:
            raise NotFound('No hay usuarios registrados.')
        return {"success": True, "data": usuarios}
    @staticmethod
    def get_user_by_id(user_id: int) -> Dict[str, Any]:
        result = UserRepository.get_by_id(user_id)
        if not result:
            raise NotFound('Usuario no encontrado.')
        return {"success": True, "data": result}
    @staticmethod
    def filter_users(filters: Dict[str, Any]) -> Dict[str, Any]:
        dni            = filters.get("dni")
        cargo          = filters.get("cargo")
        role_id        = filters.get("role_id")
        sede_ids       = filters.get("sede_ids")
        dependencia_id = filters.get("dependencia_id")
        empresa_id     = filters.get("empresa_id")
        modulo_id      = filters.get("modulo_id")
        es_usuario_sistema = filters.get("es_usuario_sistema")
        fecha_desde    = filters.get("fecha_desde")
        fecha_hasta    = filters.get("fecha_hasta")
        search         = filters.get("search")
 
        if dni and len(str(dni)) < 3:
            raise ValidationError('El DNI debe tener al menos 3 caracteres.')
 
        if fecha_desde and isinstance(fecha_desde, str):
            fecha_desde = datetime.strptime(fecha_desde, "%Y-%m-%d").date()
        if fecha_hasta and isinstance(fecha_hasta, str):
            fecha_hasta = datetime.strptime(fecha_hasta, "%Y-%m-%d").date()
        if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
            raise ValidationError('La fecha inicial no puede ser mayor que la final.')
 
        if sede_ids and isinstance(sede_ids, (list, tuple)):
            sede_ids = [int(x) for x in sede_ids if str(x).isdigit()]
        elif sede_ids and isinstance(sede_ids, str):
            sede_ids = [int(x) for x in sede_ids.split(",") if x.isdigit()]
 
        if role_id:
            role_id = int(role_id)
        if dependencia_id:
            dependencia_id = int(dependencia_id)
        if empresa_id:
            empresa_id = int(empresa_id)
        if modulo_id:
            modulo_id = int(modulo_id)
        if es_usuario_sistema is not None and isinstance(es_usuario_sistema, str):
            es_usuario_sistema = es_usuario_sistema.lower() == "true"
 
        usuarios = UserRepository.filter_users(
            dni=dni,
            cargo=cargo,
            role_id=role_id,
            sede_ids=sede_ids if sede_ids else None,
            dependencia_id=dependencia_id,
            empresa_id=empresa_id,
            modulo_id=modulo_id,
            es_usuario_sistema=es_usuario_sistema,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            search=search,
        )
        return {"success": True, "data": usuarios}
    @staticmethod
    @transaction.atomic
    def create_user(data: Dict[str, Any], sede_ids=None,created_by=None) -> Dict[str, Any]:
        dni = data.get("dni")
        empleado_response = BDEmpleadosService.get_by_dni(dni)
        if not empleado_response.get("success"):
            return empleado_response
        empleado = empleado_response.get("data")
        usuario = UserRepository.get_by_dni(dni)
        if usuario:
            if usuario.is_active:
                raise ValidationError('Ya existe un usuario Activo con el mismo DNI.')
            else:
                raise ValidationError(
                    'Ya existe un usuario Inactivo con el mismo DNI. '
                    'Por favor active el usuario o use otro DNI.'
                )
        empresa_obj = UserService._resolver_empresa(empleado.get("empresa", ""))
        data.update({
            "username":    dni,
            "password":    dni,
            "dni":         empleado.get("dni") or "",
            "first_name":  empleado.get("first_name") or "",
            "last_name":   empleado.get("last_name") or "",
            "cargo":       empleado.get("cargo") or "",
            "modulo_rrhh": empleado.get("modulo") or "",
            "empresa":     empresa_obj,   
            "created_by":   created_by
        })
        user = UserRepository.create(data=data, sede_ids=sede_ids)
        if data.get("es_usuario_sistema"):
            CredentialService.create(user)
        return {"success": True, "message": "Usuario  con Dni: "+str(user.dni)+" creado exitosamente."}
    @staticmethod
    @transaction.atomic
    def update_user(user_id: int, data: Dict[str, Any], sede_ids=None) -> Dict[str, Any]:
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise ValidationError('Usuario no encontrado.')
        UserRepository.update(user, data, sede_ids)
        if not data.get("es_usuario_sistema"):
            CredentialService.deactivate_user(user)
        
        return {"success": True, "message": "Usuario con Dni: "+str(user.dni)+" actualizado exitosamente."}
    @staticmethod
    def activate_user(user_id: int) -> Dict[str, Any]:
        result = UserRepository.get_by_id(user_id)
        if not result:
            raise ValidationError('Usuario no encontrado.')
        if result.is_active:
            raise ValidationError('El usuario ya se encuentra activo.')
        if result.es_usuario_sistema:
            CredentialService.activate(result)
        UserRepository.activate(result)
        return {"success": True, "message": "Usuario con Dni: "+str(result.dni)+" activado exitosamente."}
    @staticmethod
    def deactivate_user(user_id: int) -> Dict[str, Any]:
        result = UserRepository.get_by_id(user_id)
        if not result:
            raise ValidationError('Usuario no encontrado.')
        if not result.is_active:
            raise ValidationError('El usuario ya se encuentra desactivado.')
        UserRepository.deactivate(result)
        if result.es_usuario_sistema:
            CredentialService.deactivate_user(result)
        return {"success": True, "message": "Usuario con Dni: "+str(result.dni)+" desactivado exitosamente."}