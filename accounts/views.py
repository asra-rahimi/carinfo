import json

from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from accounts.forms import CarProfileForm, RegisterForm
from accounts.models import CarProfile, Favorite
from core import api_data
from parts.models import Part


def register(request):
    if request.user.is_authenticated:
        return redirect('profile:home')
    form = RegisterForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save()
        login(request, user)
        return redirect('profile:home')
    return render(request, 'accounts/register.html', {'form': form})


@login_required
def profile(request):
    profile, _ = CarProfile.objects.get_or_create(user=request.user)
    form = CarProfileForm(request.POST or None, instance=profile)
    if request.method == 'POST' and form.is_valid():
        form.save()
        return redirect('profile:home')
    page_data = {'parts': api_data.parts_json()}
    return render(request, 'accounts/profile.html', {
        'form': form,
        'profile': profile,
        'page_data': page_data,
    })


@login_required
def favorites(request):
    favorite_parts = Part.objects.filter(
        favorited_by__user=request.user
    ).select_related('category')
    page_data = {'parts': api_data.parts_json()}
    return render(request, 'accounts/favorites.html', {
        'favorite_parts': favorite_parts,
        'page_data': page_data,
    })


def _json_body(request):
    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return {}


@require_POST
@login_required
def toggle_favorite(request):
    payload = _json_body(request)
    part = get_object_or_404(Part, slug=payload.get('part_slug', ''))
    favorite, created = Favorite.objects.get_or_create(user=request.user, part=part)
    if not created:
        favorite.delete()
        favorited = False
    else:
        favorited = True
    return JsonResponse({'favorited': favorited})


@require_POST
@login_required
def save_profile(request):
    payload = _json_body(request)
    profile, _ = CarProfile.objects.get_or_create(user=request.user)
    profile.owner_name = str(payload.get('owner_name', ''))[:100]
    profile.car_name = str(payload.get('car_name', ''))[:120]
    profile.car_model = str(payload.get('car_model', ''))[:120]
    try:
        profile.current_kilometer = max(0, int(payload.get('current_kilometer', 0)))
    except (TypeError, ValueError):
        profile.current_kilometer = 0
    profile.save()
    return JsonResponse({'profile': {
        'name': profile.owner_name or request.user.get_username(),
        'car': profile.car_label or 'بدون خودرو',
        'km': profile.current_kilometer,
    }})
