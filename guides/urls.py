from django.urls import path

from guides import views

app_name = 'guides'

urlpatterns = [
    path('', views.guide_list, name='guide_list'),
    path('<str:slug>/', views.guide_detail, name='guide_detail'),
]
