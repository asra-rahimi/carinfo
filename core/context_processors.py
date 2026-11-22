from django.urls import reverse

from accounts.models import CarProfile
from core import api_data


def user_state(request):
    user = request.user
    state = {
        'is_authenticated': user.is_authenticated,
        'username': user.get_username() if user.is_authenticated else '',
        'profile': None,
        'favorites': [],
        'reminders': [],
        'urls': {
            'profile': reverse('profile:home'),
            'login': reverse('accounts:login'),
            'register': reverse('accounts:register'),
            'toggle_favorite': reverse('accounts:toggle_favorite'),
            'save_profile': reverse('accounts:save_profile'),
            'add_reminder': reverse('maintenance:api_add_reminder'),
            'delete_reminder': reverse('maintenance:api_delete_reminder', args=[0]),
        },
    }
    if user.is_authenticated:
        profile = CarProfile.objects.filter(user=user).first()
        if profile:
            state['profile'] = {
                'name': profile.owner_name or user.get_username(),
                'car': profile.car_label or 'بدون خودرو',
                'km': profile.current_kilometer,
            }
        else:
            state['profile'] = {
                'name': user.get_username(),
                'car': 'بدون خودرو',
                'km': 0,
            }
        state['favorites'] = list(
            user.favorites.values_list('part__slug', flat=True)
        )
        state['reminders'] = api_data.reminders_json(user)
    return {'user_state': state}
