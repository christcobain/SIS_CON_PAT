from rest_framework.routers import SimpleRouter
from .views import TransferenciaViewSet

router = SimpleRouter(trailing_slash=True)
router.register(r'', TransferenciaViewSet, basename='transferencia')

urlpatterns = router.urls