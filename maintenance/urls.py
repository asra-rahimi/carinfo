from django.urls import path

from maintenance import views

app_name = 'maintenance'

urlpatterns = [
    path('', views.reminder_list, name='reminder_list'),
    path('<int:pk>/edit/', views.reminder_edit, name='reminder_edit'),
    path('<int:pk>/toggle/', views.reminder_toggle, name='reminder_toggle'),
    path('<int:pk>/delete/', views.reminder_delete, name='reminder_delete'),
    path('api/add/', views.api_add_reminder, name='api_add_reminder'),
    path('api/delete/<int:pk>/', views.api_delete_reminder, name='api_delete_reminder'),
]
