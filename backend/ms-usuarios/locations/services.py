from .repositories import (EmpresaRepository,SedeRepository, ModuloRepository,
                           DepartamentoRepository,ProvinciaRepository,DistritoRepository,
                           UbicacionRepository)
from typing import  Dict, Any
from django.db import transaction
from rest_framework.exceptions import ValidationError,NotFound



class EmpresaService:
    @staticmethod
    def get_all() -> Dict[str, Any]:
        result = EmpresaRepository.get_all()
        if not result.exists():
            return {
                'success': False,
                'error': 'No hay empresas registradas.'
            }
        return {'success': True, 'data': result}
    @staticmethod
    def get_by_id(empresa_id: int) -> Dict[str, Any]:
        empresa = EmpresaRepository.get_by_id(empresa_id)
        if not empresa:
            return {'success': False, 'error': 'Empresa no encontrada.'}
        return {'success': True, 'data': empresa}
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        if EmpresaRepository.get_by_nombre(data.get('nombre', '')):
            raise ValidationError(
                'Ya existe una empresa con el mismo nombre.'
            )
        if EmpresaRepository.get_by_nombre_corto(data.get('nombre_corto', '')):
            raise ValidationError(
                'Ya existe una empresa con el mismo nombre corto.'
            )
        empresa = EmpresaRepository.create(data)
        return {
            'success': True,
            'message': 'Empresa creada exitosamente.',
            'data': empresa
        }

    @staticmethod
    @transaction.atomic
    def update(empresa_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        empresa = EmpresaRepository.get_by_id(empresa_id)
        if not empresa:
            raise ValidationError('Empresa no encontrada.')

        new_nombre = data.get('nombre')
        if new_nombre:
            existing = EmpresaRepository.get_by_nombre(new_nombre)
            if existing and existing.id != empresa.id:
                raise ValidationError(
                    'Ya existe una empresa con el mismo nombre.'
                )

        new_corto = data.get('nombre_corto')
        if new_corto:
            existing = EmpresaRepository.get_by_nombre_corto(new_corto)
            if existing and existing.id != empresa.id:
                raise ValidationError(
                    'Ya existe una empresa con el mismo nombre corto.'
                )

        EmpresaRepository.update(empresa, data)
        return {
            'success': True,
            'message': 'Empresa actualizada exitosamente.'
        }

    @staticmethod
    def activate(empresa_id: int) -> Dict[str, Any]:
        empresa = EmpresaRepository.get_by_id(empresa_id)
        if not empresa:
            raise ValidationError('Empresa no encontrada.')
        if empresa.is_active:
            raise ValidationError('La empresa ya se encuentra activa.')
        EmpresaRepository.activate(empresa)
        return {'success': True, 'message': 'Empresa activada exitosamente.'}

    @staticmethod
    def deactivate(empresa_id: int) -> Dict[str, Any]:
        empresa = EmpresaRepository.get_by_id(empresa_id)
        if not empresa:
            raise ValidationError('Empresa no encontrada.')
        if not empresa.is_active:
            raise ValidationError('La empresa ya se encuentra inactiva.')
        EmpresaRepository.deactivate(empresa)
        return {
            'success': True,
            'message': 'Empresa desactivada exitosamente.'
        }
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
            raise ValidationError(f'No hay sedes registradas.')   
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get__by_id(id: int)-> Dict[str, Any]:
        byId=SedeRepository.get_by_id(id)
        if not byId:
            raise ValidationError(f'Sede no encontrada.')
        return {
            "success": True,
            "data": byId
        }    
    @staticmethod
    def get_by_name(nombre: str)-> Dict[str, Any]:
        byId=SedeRepository.get_by_name(nombre)
        if not byId:
            raise ValidationError(f'Sede no encontrada.')
        return {
            "success": True,
            "data": byId
        }
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        sede=SedeRepository.get_by_name(data.get("nombre"))      
        if sede:
            if sede.is_active:
                raise ValidationError(f'Ya existe una sede activa con el mismo nombre.')
            else:
                raise ValidationError(f'a existe una sede inactiva con el mismo nombre. Por favor active la sede o use otro nombre.')
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
            raise ValidationError(f'Sede no encontrada.')    
        new_name = data.get("nombre")
        if new_name:
            existing = SedeRepository.get_by_name(new_name)
            if existing and existing.id != sede.id:
                if existing.is_active:
                    raise ValidationError(f'Ya existe una sede Activa con el mismo nombre.')
                else:
                    raise ValidationError(f'Ya existe una sede Inactiva con el mismo nombre. Por favor active la sede o use otro nombre.')
        SedeRepository.update(sede, data)
        return {
            "success": True,
            "message": "Sede actualizada exitosamente."
        }
    @staticmethod
    def activate(_id:int) -> Dict[str, Any]:
        sede=SedeRepository.get_by_id(_id)
        if not sede:
            raise ValidationError(f'Sede no encontrada.') 
        if sede.is_active:
            raise ValidationError(f'La sede ya se encuentra activa.') 
        SedeRepository.activate(sede)
        return {
            "success": True,
            "message": "Sede activada exitosamente."
        }
    @staticmethod
    def deactivate_dependency(_id:int) -> Dict[str, Any]:
        sede=SedeRepository.get_by_id(_id)
        if not sede:
            raise ValidationError(f'Sede no encontrada.') 
        if not sede.is_active:
            raise ValidationError(f'La sede ya se encuentra inactiva.')
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
            raise ValidationError(f'Modulo no encontrado.')  
        new_name = data.get("nombre")
        if new_name:
            existing = ModuloRepository.get_by_name(new_name)
            if existing and existing.id != modulo.id:
                if existing.is_active:
                    raise ValidationError(f'Ya existe un modulo Activo con el mismo nombre.')  
                else:
                    raise ValidationError(f'Ya existe un modulo Inactivo con el mismo nombre. Por favor active el modulo o use otro nombre') 
        ModuloRepository.update(modulo, data)
        return {
            "success": True,
            "message": "Modulo actualizado exitosamente."
        }
    @staticmethod
    def activate(_id:int) -> Dict[str, Any]:
        modulo=ModuloRepository.get_by_id(_id)
        if not modulo:
            raise ValidationError(f'Modulo no encontrado.')  
        if modulo.is_active:
            raise ValidationError(f'El modulo ya se encuentra activo.')  
        ModuloRepository.activate(modulo)
        return {
            "success": True,
            "message": "Modulo activado exitosamente."
        }
    @staticmethod
    def deactivate_dependency(_id:int) -> Dict[str, Any]:
        modulo=ModuloRepository.get_by_id(_id)
        if not modulo:
            raise ValidationError(f'Modulo no encontrado.')  
        if not modulo.is_active:
            raise ValidationError(f'El modulo  ya se encuentra inactivo.')  
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
            raise ValidationError(f'No hay ubicaciones registradas.')  
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def get__by_id(id: int)-> Dict[str, Any]:
        byId=UbicacionRepository.get_by_id(id)
        if not byId:
            raise ValidationError(f'ubicacion no encontrado.') 
        return {
            "success": True,
            "data": byId
        }    
    @staticmethod
    def get_by_name(nombre: str)-> Dict[str, Any]:
        byId=UbicacionRepository.get_by_name(nombre)
        if not byId:
            raise ValidationError(f'Ubicacion no encontrado.') 
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
                raise ValidationError(f'Ya existe una Ubicacion activo con el mismo nombre.')
            else:
                raise ValidationError(f'Ya existe una Ubicacion inactivo con el mismo nombre. Por favor active la Ubicacion o use otro nombre.')
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
            raise ValidationError(f'Ubicacion no encontrado.')  
        new_name = data.get("nombre")
        if new_name:
            existing = UbicacionRepository.get_by_name(new_name)
            if existing and existing.id != sede.id:
                if existing.is_active:
                    raise ValidationError(f'Ya existe una Ubicacion Activa con el mismo nombre.') 
                else:
                    raise ValidationError(f'Ya existe una Ubicacion Inactiva con el mismo nombre. Por favor active la Ubicacion o use otro nombre.') 
      
        UbicacionRepository.update(sede, data)
        return {
            "success": True,
            "message": "Ubicacion actualizada exitosamente."
        } 
    @staticmethod
    def activate(_id:int) -> Dict[str, Any]:
        tipoubicaciones=UbicacionRepository.get_by_id(_id)
        if not tipoubicaciones:
            raise ValidationError(f'Ubicacion no encontrado.')
        if tipoubicaciones.is_active:
            raise ValidationError(f'Ubicacion ya se encuentra activa.')
        UbicacionRepository.activate(tipoubicaciones)
        return {
            "success": True,
            "message": "Ubicacion activada exitosamente."
        }
    @staticmethod
    def deactivate_dependency(_id:int) -> Dict[str, Any]:
        ubicacion=UbicacionRepository.get_by_id(_id)
        if not ubicacion:
            raise ValidationError(f'Ubicacion no encontrado.')
        if not ubicacion.is_active:
            raise ValidationError(f'Ubicacion  ya se encuentra inactivo.')
        UbicacionRepository.deactivate(ubicacion)
        return {
            "success": True,
            "message": "Ubicacion desactivado exitosamente."
        }


   
    
        
        
        