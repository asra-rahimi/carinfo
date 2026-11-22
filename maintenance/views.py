import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from accounts.models import CarProfile
from core import api_data
from maintenance.forms import ReminderForm
from maintenance.models import MaintenanceReminder
from parts.models import Part


@login_required
def reminder_list(request):
    form = ReminderForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        reminder = form.save(commit=False)
        reminder.user = request.user
        reminder.save()
        return redirect('maintenance:reminder_list')

    reminders = (
        MaintenanceReminder.objects.filter(user=request.user)
        .select_related('part')
    )
    page_data = {'parts': api_data.parts_json()}
    return render(request, 'maintenance/reminder_list.html', {
        'form': form,
        'reminders': reminders,
        'page_data': page_data,
    })


@login_required
def reminder_edit(request, pk):
    reminder = get_object_or_404(
        MaintenanceReminder.objects.select_related('part'),
        pk=pk, user=request.user,
    )
    form = ReminderForm(request.POST or None, instance=reminder)
    if request.method == 'POST' and form.is_valid():
        form.save()
        return redirect('maintenance:reminder_list')
    page_data = {'parts': api_data.parts_json()}
    return render(request, 'maintenance/reminder_edit.html', {
        'form': form,
        'reminder': reminder,
        'page_data': page_data,
    })


@require_POST
@login_required
def reminder_toggle(request, pk):
    reminder = get_object_or_404(MaintenanceReminder, pk=pk, user=request.user)
    reminder.is_completed = not reminder.is_completed
    reminder.save(update_fields=['is_completed'])
    return redirect('maintenance:reminder_list')


@require_POST
@login_required
def reminder_delete(request, pk):
    reminder = get_object_or_404(MaintenanceReminder, pk=pk, user=request.user)
    reminder.delete()
    return redirect('maintenance:reminder_list')


def _json_body(request):
    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return {}


@require_POST
@login_required
def api_add_reminder(request):
    payload = _json_body(request)
    part = Part.objects.filter(slug=payload.get('part_slug', '')).first()
    try:
        interval = max(1000, int(payload.get('interval', 10000)))
    except (TypeError, ValueError):
        interval = 10000

    profile = CarProfile.objects.filter(user=request.user).first()
    current_km = profile.current_kilometer if profile else 0

    if part:
        title = f'تعویض {part.name}'
    else:
        title = str(payload.get('title', 'سرویس دوره‌ای'))[:200]

    MaintenanceReminder.objects.create(
        user=request.user,
        part=part,
        title=title,
        reminder_kilometer=current_km + interval,
        current_kilometer=current_km,
    )
    return JsonResponse({'reminders': api_data.reminders_json(request.user)})


@require_POST
@login_required
def api_delete_reminder(request, pk):
    reminder = get_object_or_404(MaintenanceReminder, pk=pk, user=request.user)
    reminder.delete()
    return JsonResponse({'reminders': api_data.reminders_json(request.user)})
