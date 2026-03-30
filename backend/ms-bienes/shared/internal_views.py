from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView


class InternalPermissionsView(APIView):
    permission_classes     = []
    def get(self, request):
        service_key  = request.headers.get('X-Service-Key', '')
        expected_key = getattr(settings, 'SERVICE_SYNC_KEY', '')
        if expected_key and service_key != expected_key:
            return Response({'error': 'Forbidden'}, status=403)
        perms = (
            Permission.objects
            .select_related('content_type')
            .order_by('content_type__app_label', 'codename')
        )
        data = [
            {
                'app_label':  p.content_type.app_label,
                'model_name': p.content_type.model,
                'codename':   p.codename,
                'name':       p.name,
            }
            for p in perms
            if p.content_type.app_label not in (
                'admin', 'auth', 'contenttypes', 'sessions', 'authtoken',
            )
        ]
        return Response(data)