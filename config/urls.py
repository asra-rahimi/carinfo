from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('parts/', include('parts.urls')),
    path('guides/', include('guides.urls')),
    path('glossary/', include('guides.urls_glossary')),
    path('warnings/', include('warning_lights.urls')),
    path('obd/', include('warning_lights.urls_obd')),
    path('quiz/', include('quiz.urls')),
    path('accounts/', include('accounts.urls')),
    path('profile/', include('accounts.urls_profile')),
    path('favorites/', include('accounts.urls_favorites')),
    path('maintenance/', include('maintenance.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
