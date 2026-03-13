from rest_framework.routers import SimpleRouter
from .views import BajaViewSet

router = SimpleRouter(trailing_slash=True)
router.register(r'', BajaViewSet, basename='baja')

urlpatterns = router.urls