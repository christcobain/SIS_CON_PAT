from .repositories import (SedeRepository, ModuloRepository,
                           DepartamentoRepository,ProvinciaRepository,DistritoRepository,
                           UbicacionRepository)
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
        sede=SedeRepository.get_by_name(data.get("nombre"))      
        if sede.get("success"):
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
        if not sede:
            return {
            "success": False,
            "error": "Sede no encontrada."
        }
        if sede.is_active:
            return {
                "success": False,
                "error": "La sede ya se encuentra activa."                
            }
        SedeRepository.activate(sede)
        return {
            "success": True,
            "message": "Sede activada exitosamente."
        }
    @staticmethod
    def deactivate_dependency(_id:int) -> Dict[str, Any]:
        sede=SedeRepository.get_by_id(_id)
        if not sede:
            return {
            "success": False,
            "error": "Sede no encontrada."
        }
        if not sede.is_active:
            return {
                "success": False,
                "error": "La sede ya se encuentra inactiva."                
            }
        SedeRepository.deactivate(sede)
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
                "error": "Modulo no encontrado."                
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
        if not modulo:
            return {
            "success": False,
            "error": "Modulo no encontrado."
        }
        if modulo.is_active:
            return {
                "success": False,
                "error": "El modulo ya se encuentra activo."                
            }
        ModuloRepository.activate(modulo)
        return {
            "success": True,
            "message": "Modulo activado exitosamente."
        }
    @staticmethod
    def deactivate_dependency(_id:int) -> Dict[str, Any]:
        modulo=ModuloRepository.get__by_id(_id)
        if not modulo:
            return {
            "success": False,
            "error": "Modulo no encontrado."
        }
        if not modulo.is_active:
            return {
                "success": False,
                "error": "El modulo  ya se encuentra inactivo."                
            }
        ModuloRepository.deactivate(modulo)
        return {
            "success": True,
            "message": "Modulo desactivado exitosamente."
        }

class UbicacionService:
    @staticmethod
    def get_all()-> Dict[str, Any]:
        result=UbicacionRepository.get_all()     
        if not result:
            return {
                "success": False,
                "error": "No hay ubicaciones registradas."                
            }      
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get__by_id(id: int)-> Dict[str, Any]:
        byId=UbicacionRepository.get_by_id(id)
        if not byId:
            return {
                "success": False,
                "error": "ubicacion no encontrado."                
            }
        return {
            "success": True,
            "data": byId
        }    
    @staticmethod
    def get_by_name(nombre: str)-> Dict[str, Any]:
        byId=UbicacionRepository.get_by_name(nombre)
        if not byId:
            return {
                "success": False,
                "error": "Ubicacion no encontrado."                
            }
        return {
            "success": True,
            "data": byId
        }
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        ubicaciones=UbicacionRepository.get_by_name(data.get("nombre"))   
        if ubicaciones:
            if ubicaciones.is_active:
                return {
                    "success": False,
                    "error": "Ya existe una Ubicacion activo con el mismo nombre."                
                }
            else:
                return {
                    "success": False,
                    "error": "Ya existe una Ubicacion inactivo con el mismo nombre. Por favor active la Ubicacion o use otro nombre."                
                }
        UbicacionRepository.create(data)
        return {
            "success": True,
            "message": "Ubicacion creada exitosamente."
        }
    @staticmethod
    @transaction.atomic
    def update(_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        sede = UbicacionRepository.get_by_id(_id)
        if not sede:
            return {
                "success": False,
                "error": "Ubicacion no encontrado."
            }        
        new_name = data.get("nombre")
        if new_name:
            existing = UbicacionRepository.get_by_name(new_name)
            if existing and existing.id != sede.id:
                if existing.is_active:
                    return {
                        "success": False,
                        "error": "Ya existe una Ubicacion Activa con el mismo nombre."
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ya existe una Ubicacion Inactiva con el mismo nombre. Por favor active la Ubicacion o use otro nombre."
                    }
      
        UbicacionRepository.update(sede, data)
        return {
            "success": True,
            "message": "Ubicacion actualizada exitosamente."
        } 
    @staticmethod
    def activate(_id:int) -> Dict[str, Any]:
        tipoubicaciones=UbicacionRepository.get_by_id(_id)
        if not tipoubicaciones:
            return {
            "success": False,
            "error": "Ubicacion no encontrado."
        }
        if tipoubicaciones.is_active:
            return {
                "success": False,
                "error": "Ubicacion ya se encuentra activa."                
            }
        UbicacionRepository.activate(tipoubicaciones)
        return {
            "success": True,
            "message": "Ubicacion activada exitosamente."
        }
    @staticmethod
    def deactivate_dependency(_id:int) -> Dict[str, Any]:
        ubicacion=UbicacionRepository.get_by_id(_id)
        if not ubicacion:
            return {
            "success": False,
            "error": "Ubicacion no encontrado."
        }
        if not ubicacion.is_active:
            return {
                "success": False,
                "error": "El Ubicacion  ya se encuentra inactivo."                
            }
        UbicacionRepository.deactivate(ubicacion)
        return {
            "success": True,
            "message": "Ubicacion desactivado exitosamente."
        }


   
    
        
        
        