from .repositories import (SedeRepository, ModuloRepository,
                           DepartamentoRepository,ProvinciaRepository,DistritoRepository)
from typing import Optional, Dict, Any
from django.db import transaction

class DepartamentoService:
    @staticmethod
    def get_all()-> Dict[str, Any]:
        result=DepartamentoRepository.get_all()       
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get__by_id(id: int)-> Dict[str, Any]:
        byId=DepartamentoRepository.get_by_id(id)
        return {
            "success": True,
            "data": byId
        }
class ProvinciaService:
    @staticmethod
    def get_all()-> Dict[str, Any]:
        result=ProvinciaRepository.get_all()       
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get__by_id(id: int)-> Dict[str, Any]:
        byId=ProvinciaRepository.get_by_id(id)
        return {
            "success": True,
            "data": byId
        }
class DistritoService:
    @staticmethod
    def get_all()-> Dict[str, Any]:
        result=DistritoRepository.get_all()       
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get__by_id(id: int)-> Dict[str, Any]:
        byId=DistritoRepository.get_by_id(id)
        return {
            "success": True,
            "data": byId
        }    
        
class SedeService:
    @staticmethod
    def get_all()-> Dict[str, Any]:
        result=SedeRepository.get_all()     
        if not result:
            return {
                "success": False,
                "error": "No hay sedes registradas."                
            }      
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get__by_id(id: int)-> Dict[str, Any]:
        byId=SedeRepository.get_by_id(id)
        if not byId:
            return {
                "success": False,
                "error": "Sede no encontrada."                
            }
        return {
            "success": True,
            "data": byId
        }    
    @staticmethod
    def get_by_name(nombre: str)-> Dict[str, Any]:
        byId=SedeRepository.get_by_name(nombre)
        if not byId:
            return {
                "success": False,
                "error": "Sede no encontrada."                
            }
        return {
            "success": True,
            "data": byId
        }
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        sede=SedeService.get_by_name(data.get("nombre"))
        if sede:
            if sede.is_active:
                return {
                    "success": False,
                    "error": "Ya existe una sede activa con el mismo nombre."                
                }
            else:
                return {
                    "success": False,
                    "error": "Ya existe una sede inactiva con el mismo nombre. Por favor active la sede o use otro nombre."                
                }
        SedeRepository.create(data)
        return {
            "success": True,
            "message": "Sede creada exitosamente."
        }
    @staticmethod
    @transaction.atomic
    def update(_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        sede = SedeRepository.get_by_id(_id)
        if not sede:
            return {
                "success": False,
                "error": "Sede no encontrada."
            }        
        new_name = data.get("nombre")
        if new_name:
            existing = SedeRepository.get_by_name(new_name)
            if existing and existing.id != sede.id:
                if existing.is_active:
                    return {
                        "success": False,
                        "error": "Ya existe una sede Activa con el mismo nombre."
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ya existe una sede Inactiva con el mismo nombre. Por favor active la sede o use otro nombre."
                    }
      
        SedeRepository.update(sede, data)
        return {
            "success": True,
            "message": "Sede actualizada exitosamente."
        }
    @staticmethod
    def activate(_id:int) -> Dict[str, Any]:
        sede=SedeRepository.get_by_id(_id)
        if not sede.get("success"):
            return sede
        result=sede['data']
        if result.is_active:
            return {
                "success": False,
                "error": "La sede ya se encuentra activa."                
            }
        SedeRepository.activate(result)
        return {
            "success": True,
            "message": "Sede activada exitosamente."
        }
    @staticmethod
    def deactivate_dependency(_id:int) -> Dict[str, Any]:
        sede=SedeRepository.get_by_id(_id)
        if not sede.get("success"):
            return sede
        result=sede['data']
        if not result.is_active:
            return {
                "success": False,
                "error": "La sede ya se encuentra inactiva."                
            }
        SedeRepository.deactivate(result)
        return {
            "success": True,
            "message": "Sede desactivada exitosamente."
        }


class ModuloService:
    @staticmethod
    def get_all()-> Dict[str, Any]:
        result=ModuloRepository.get_all()     
        if not result:
            return {
                "success": False,
                "error": "No hay modulos registradas."                
            }      
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get__by_id(id: int)-> Dict[str, Any]:
        byId=ModuloRepository.get_by_id(id)
        if not byId:
            return {
                "success": False,
                "error": "Modulo no encontradp."                
            }
        return {
            "success": True,
            "data": byId
        }    
    @staticmethod
    def get_by_name(nombre: str)-> Dict[str, Any]:
        byId=ModuloRepository.get_by_name(nombre)
        if not byId:
            return {
                "success": False,
                "error": "Modulo no encontrado."                
            }
        return {
            "success": True,
            "data": byId
        }
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        modulo=ModuloRepository.get_by_name(data.get("nombre"))
        if modulo:
            if modulo.is_active:
                return {
                    "success": False,
                    "error": "Ya existe un modulo activo con el mismo nombre."                
                }
            else:
                return {
                    "success": False,
                    "error": "Ya existe un modulo inactivo con el mismo nombre. Por favor active el modulo o use otro nombre."                
                }
        ModuloRepository.create(data)
        return {
            "success": True,
            "message": "Módulo creado exitosamente."
        }
    @staticmethod
    @transaction.atomic
    def update(_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        modulo =  ModuloRepository.get_by_id(_id)
        if not modulo:
            return {
                "success": False,
                "error": "Modulo no encontradp."
            }        
        new_name = data.get("nombre")
        if new_name:
            existing = ModuloRepository.get_by_name(new_name)
            if existing and existing.id != modulo.id:
                if existing.is_active:
                    return {
                        "success": False,
                        "error": "Ya existe un modulo Activo con el mismo nombre."
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ya existe un modulo Inactivo con el mismo nombre. Por favor active el modulo o use otro nombre."
                    }
      
        ModuloRepository.update(modulo, data)
        return {
            "success": True,
            "message": "Modulo actualizado exitosamente."
        }
    @staticmethod
    def activate(_id:int) -> Dict[str, Any]:
        modulo=ModuloRepository.get_by_id(_id)
        if not modulo.get("success"):
            return modulo
        result=modulo['data']
        if result.is_active:
            return {
                "success": False,
                "error": "El modulo ya se encuentra activp."                
            }
        ModuloRepository.activate(result)
        return {
            "success": True,
            "message": "Modulo activado exitosamente."
        }
    @staticmethod
    def deactivate_dependency(_id:int) -> Dict[str, Any]:
        modulo=ModuloRepository.get_by_id(_id)
        if not modulo.get("success"):
            return modulo
        result=modulo['data']
        if not result.is_active:
            return {
                "success": False,
                "error": "El modulo  ya se encuentra inactivo."                
            }
        ModuloRepository.deactivate(result)
        return {
            "success": True,
            "message": "Modulo desactivado exitosamente."
        }

