from django.urls import path,include
from shared.internal_views import InternalPermissionsView
urlpatterns = [path('permissions/', InternalPermissionsView.as_view())]

path('internal/', include('shared.urls_internal')),