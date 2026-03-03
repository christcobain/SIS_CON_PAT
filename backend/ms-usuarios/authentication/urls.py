from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import (LoginViewSet,LoginSessionViewSet, LogoutViewSet, RefreshTokenViewSet, 
                    ChangePasswordViewSet,chancePasswordUserViewSet,MultipleSessionViewSet,
    PasswordPolicyView,PasswordHistoryView)
router = DefaultRouter()
router.register(r'login', LoginViewSet, basename='login')
router.register(r'login/sessions', LoginSessionViewSet, basename='sessions')
router.register(r'logout', LogoutViewSet, basename='logout')
router.register(r'refreshtokens', RefreshTokenViewSet, basename='refreshtokens')
router.register(r'changepassword', ChangePasswordViewSet, basename='changepassword')
router.register(r'changepassworduser', chancePasswordUserViewSet, basename='changepassworduser')
router.register(r'multiplesession', MultipleSessionViewSet, basename='multiplesession')
router.register(r'passwordpolicy', PasswordPolicyView, basename='passwordpolicy')
router.register(r'passwordhistory', PasswordHistoryView, basename='passwordhistory')

urlpatterns = [
    path('', include(router.urls)),
]
