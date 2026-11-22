from django.contrib import admin

from .models import MaintenanceReminder


@admin.register(MaintenanceReminder)
class MaintenanceReminderAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'user',
        'part',
        'reminder_kilometer',
        'reminder_date',
        'is_completed',
        'created_at',
    )
    list_filter = ('is_completed', 'reminder_date')
    search_fields = ('title', 'description', 'user__username', 'part__name')
    list_select_related = ('user', 'part')
