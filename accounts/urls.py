from django.contrib.auth import views as auth_views
from django.urls import path

from accounts import views

app_name = 'accounts'

urlpatterns = [
    path(
        'login/',
        auth_views.LoginView.as_view(template_name='accounts/login.html'),
        name='login',
    ),
    path(
        'logout/',
        auth_views.LogoutView.as_view(),
        name='logout',
    ),
    path('register/', views.register, name='register'),
    path('api/toggle-favorite/', views.toggle_favorite, name='toggle_favorite'),
    path('api/save-profile/', views.save_profile, name='save_profile'),
]
