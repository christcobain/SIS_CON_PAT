from django.urls import path
from rest_framework.routers import SimpleRouter
from .views import BienViewSet

router = SimpleRouter(trailing_slash=True)
router.register(r'', BienViewSet, basename='bien')

urlpatterns = router.urls