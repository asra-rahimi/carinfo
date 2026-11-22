from django.contrib import admin

from .models import Glossary, Guide


@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_published', 'created_at')
    list_filter = ('is_published', 'category')
    search_fields = ('title', 'short_description', 'content')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(Glossary)
class GlossaryAdmin(admin.ModelAdmin):
    list_display = ('term', 'english_term', 'category')
    list_filter = ('category',)
    search_fields = ('term', 'english_term', 'description')
