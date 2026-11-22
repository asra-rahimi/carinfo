from django.urls import path

from accounts import views

app_name = 'favorites'

urlpatterns = [
    path('', views.favorites, name='home'),
]
