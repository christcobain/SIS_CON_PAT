from .repositories import SedeRepository, ModuloRepository, AreaRepository
from .models import Modulo, Area


class SedeService:
    @staticmethod
    def list_sedes(filters=None):
        estado = filters.get('estado') if filters else None
        search = filters.get('search') if filters else None
        if estado is not None:
            estado = estado == 'true' or estado is True
        return SedeRepository.get_all(estado=estado, search=search)

    @staticmethod
    def get_sede(sede_id):
        return SedeRepository.get_by_id(sede_id)

    @staticmethod
    def create_sede(data):
        return SedeRepository.create(data)

    @staticmethod
    def update_sede(sede_id, data):
        sede = SedeService.get_sede(sede_id)
        return SedeRepository.update(sede, data)

    @staticmethod
    def toggle_estado(sede_id):
        sede = SedeService.get_sede(sede_id)
        return SedeRepository.toggle_estado(sede)


class ModuloService:
    @staticmethod
    def list_by_sede(sede_id):
        return ModuloRepository.get_by_sede(sede_id)

    @staticmethod
    def create_modulo(data):
        return ModuloRepository.create(data)

    @staticmethod
    def toggle_estado(modulo_id):
        try:
            modulo = Modulo.objects.get(pk=modulo_id)
            return ModuloRepository.toggle_estado(modulo)
        except Modulo.DoesNotExist:
            raise Exception('Módulo no encontrado.')


class AreaService:
    @staticmethod
    def list_by_modulo(modulo_id):
        return AreaRepository.get_by_modulo(modulo_id)

    @staticmethod
    def create_area(data):
        return AreaRepository.create(data)

    @staticmethod
    def toggle_estado(area_id):
        try:
            area = Area.objects.get(pk=area_id)
            return AreaRepository.toggle_estado(area)
        except Area.DoesNotExist:
            raise Exception('Área no encontrada.')