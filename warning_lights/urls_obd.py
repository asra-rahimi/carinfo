from django.urls import path

from warning_lights import views

app_name = 'obd'

urlpatterns = [
    path('', views.obd_lookup, name='obd_lookup'),
]
