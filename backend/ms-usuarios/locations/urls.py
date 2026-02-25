from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartamentoViewSet,ProvinciaViewSet,DistritoViewSet,SedeViewSet,ModuloViewSet

router = DefaultRouter()
router.register(r'sedes',   SedeViewSet,   basename='sede')
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')
router.register(r'provincias', ProvinciaViewSet, basename='provincia')
router.register(r'distritos', DistritoViewSet, basename='distrito')
router.register(r'modulos', ModuloViewSet, basename='modulo')



urlpatterns = [path('', include(router.urls))]