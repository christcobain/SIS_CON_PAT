from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    path('internal/', include('shared.urls_internal')),    
    # API Documentation
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),    
    # API Endpoints
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/roles/', include('roles.urls')),
    path('api/v1/locations/', include('locations.urls')),
]
