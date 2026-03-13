from django.urls import path
from .views import CatalogoViewSet

catalogo_list       = CatalogoViewSet.as_view({'get': 'list',     'post': 'create'})
catalogo_detail     = CatalogoViewSet.as_view({'get': 'retrieve', 'put':  'update'})
catalogo_activate   = CatalogoViewSet.as_view({'patch': 'activate'})
catalogo_deactivate = CatalogoViewSet.as_view({'patch': 'deactivate'})

urlpatterns = [
    path('<str:catalogo_slug>/',                     catalogo_list,       name='catalogo-list-create'),
    path('<str:catalogo_slug>/<int:pk>/',             catalogo_detail,     name='catalogo-detail'),
    path('<str:catalogo_slug>/<int:pk>/activate/',    catalogo_activate,   name='catalogo-activate'),
    path('<str:catalogo_slug>/<int:pk>/deactivate/',  catalogo_deactivate, name='catalogo-deactivate'),
]