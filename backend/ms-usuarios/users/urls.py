from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet,DependencyViewSet,BDEmpleadosViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'dependencies', DependencyViewSet, basename='dependencies')
router.register(r'empleados', BDEmpleadosViewSet, basename='empleados')
urlpatterns = [
    path('', include(router.urls)),
]
