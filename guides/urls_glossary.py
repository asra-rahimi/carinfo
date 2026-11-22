from django.urls import path

from guides import views

app_name = 'glossary'

urlpatterns = [
    path('', views.glossary, name='glossary'),
]
