from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('internal/', include('shared.urls_internal')),

    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),  

    path('api/v1/bienes/', include('bienes.urls')),
    path('api/v1/catalogos/', include('catalogos.urls')),
    path('api/v1/mantenimientos/', include('mantenimientos.urls')),
    path('api/v1/transferencias/', include('transferencias.urls')),
    path('api/v1/bajas/', include('bajas.urls')),
]
