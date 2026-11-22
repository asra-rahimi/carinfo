from django.contrib import admin

from .models import OBDCode, WarningLight


@admin.register(WarningLight)
class WarningLightAdmin(admin.ModelAdmin):
    list_display = ('title', 'severity', 'created_at')
    list_filter = ('severity',)
    search_fields = ('title', 'meaning', 'recommended_action')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(OBDCode)
class OBDCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'severity', 'created_at')
    list_filter = ('severity',)
    search_fields = ('code', 'title', 'description', 'possible_causes')
