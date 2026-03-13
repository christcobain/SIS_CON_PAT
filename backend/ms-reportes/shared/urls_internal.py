## ms-reportes/shared/
from django.urls import path
from .internal_views import InternalPermissionsView

urlpatterns = [
    path('permissions/', InternalPermissionsView.as_view()),
]
