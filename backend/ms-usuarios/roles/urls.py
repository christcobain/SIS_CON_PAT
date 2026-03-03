from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PermissionTreeViewSet, PermissionListViewSet, KnownMicroservicesViewSet, RoleViewSet,
)
router = DefaultRouter()
router.register(r'permissionstree', PermissionTreeViewSet, basename='permissionstree')
router.register(r'permissions', PermissionListViewSet, basename='permissions')
router.register(r'microservices', KnownMicroservicesViewSet, basename='microservices')
router.register(r'roles', RoleViewSet, basename='roles')
urlpatterns = [
    path('', include(router.urls)),
]