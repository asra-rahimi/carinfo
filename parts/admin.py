from django.contrib import admin

from .models import Category, Part


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = ('name', 'en_name', 'category', 'lifespan', 'updated_at')
    list_filter = ('category',)
    search_fields = ('name', 'en_name', 'short_description', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_select_related = ('category',)
