from django.contrib import auth
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.http import HttpResponseRedirect

class AdminAutoLoginMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if '/admin/logout/' in request.path or request.GET.get('next') == '/admin/':
            response = HttpResponseRedirect('/admin/login/') 
            response.delete_cookie(
                getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access'),
                path='/' 
            )
            return response
        if request.path.startswith('/admin/') and not request.user.is_authenticated:
            user = auth.authenticate(request)
            if user:
                auth.login(request, user)