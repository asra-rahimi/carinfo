from django.shortcuts import render

from core import api_data
from warning_lights.models import OBDCode


def warning_list(request):
    page_data = {
        'parts': api_data.parts_json(),
        'warningLights': api_data.warnings_json(),
    }
    return render(request, 'warnings/warning_list.html', {
        'page_data': page_data,
    })


def obd_lookup(request):
    page_data = {
        'parts': api_data.parts_json(),
        'obdCodes': api_data.obd_json(),
    }
    return render(request, 'warnings/obd.html', {
        'codes': OBDCode.objects.all(),
        'page_data': page_data,
    })
