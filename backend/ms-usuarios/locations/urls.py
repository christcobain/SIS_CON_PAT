from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SedeViewSet, ModuloViewSet, AreaViewSet

router = DefaultRouter()
router.register(r'sedes',   SedeViewSet,   basename='sede')
router.register(r'modulos', ModuloViewSet, basename='modulo')
router.register(r'areas',   AreaViewSet,   basename='area')

urlpatterns = [path('', include(router.urls))]