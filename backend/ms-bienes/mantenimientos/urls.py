from rest_framework.routers import SimpleRouter
from .views import MantenimientoViewSet

router = SimpleRouter(trailing_slash=True)
router.register(r'', MantenimientoViewSet, basename='mantenimiento')

urlpatterns = router.urls