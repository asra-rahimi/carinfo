from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

from . import api_data


@ensure_csrf_cookie
def home(request):
    page_data = {
        'parts': api_data.parts_json(),
        'categories': api_data.categories_json(),
        'warningLights': api_data.warnings_json(),
        'glossary': api_data.glossary_json(),
        'obdCodes': api_data.obd_json(),
        'quizQuestions': api_data.quiz_json(),
    }
    return render(request, 'core/home.html', {'page_data': page_data})


def about(request):
    page_data = {'parts': api_data.parts_json()}
    return render(request, 'core/about.html', {'page_data': page_data})


def contact(request):
    success = False
    if request.method == 'POST':
        success = True
    page_data = {'parts': api_data.parts_json()}
    return render(request, 'core/contact.html', {'success': success, 'page_data': page_data})
