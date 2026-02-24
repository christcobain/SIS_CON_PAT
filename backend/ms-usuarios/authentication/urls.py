from django.urls import path
from .views import LoginView, LogoutView, RefreshTokenView, ChangePasswordView

urlpatterns = [
    path('login/',           LoginView.as_view(),        name='login'),
    path('logout/',          LogoutView.as_view(),       name='logout'),
    path('refresh/',         RefreshTokenView.as_view(), name='refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]