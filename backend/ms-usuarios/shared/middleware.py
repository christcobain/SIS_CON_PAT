from django.contrib import auth
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.http import HttpResponseRedirect


class AdminAutoLoginMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if '/admin/logout/' in request.path:
            return None 
        if request.path.startswith('/admin/') and not request.user.is_authenticated:
            user = auth.authenticate(request) 
            if user:
                auth.login(request, user)
                return HttpResponseRedirect(request.path)
        
        return None