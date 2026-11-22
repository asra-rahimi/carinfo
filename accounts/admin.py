from django.contrib import admin

from .models import CarProfile, Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'part', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'part__name')
    list_select_related = ('user', 'part')


@admin.register(CarProfile)
class CarProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'owner_name', 'car_name', 'car_model', 'current_kilometer')
    search_fields = ('user__username', 'owner_name', 'car_name', 'car_model')
