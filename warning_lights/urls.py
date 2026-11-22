from django.urls import path

from warning_lights import views

app_name = 'warnings'

urlpatterns = [
    path('', views.warning_list, name='warning_list'),
]
