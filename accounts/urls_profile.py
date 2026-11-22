from django.urls import path

from accounts import views

app_name = 'profile'

urlpatterns = [
    path('', views.profile, name='home'),
]
