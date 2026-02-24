from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.deprecation import MiddlewareMixin


class JWTServiceAuthMiddleware(MiddlewareMixin):
    """Middleware que intenta autenticar la petición usando JWT.
    - Soporta Authorization header 'Bearer <token>' o cookie configurada `JWT_AUTH_COOKIE`.
    - Si el token es válido, `request.user` y `request.auth` quedan poblados.
    Esto permite que microservicios backend usen el mismo método de autenticación.
    """
    def __init__(self, get_response=None):
        super().__init__(get_response)
        self.auth = JWTAuthentication()
    def process_request(self, request):
        try:
            user_auth_tuple = self.auth.authenticate(request)
            if user_auth_tuple is not None:
                request.user, request.auth = user_auth_tuple
        except Exception:
            pass
        return None
