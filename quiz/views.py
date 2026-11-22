from django.shortcuts import render

from core import api_data


def quiz(request):
    page_data = {
        'parts': api_data.parts_json(),
        'quizQuestions': api_data.quiz_json(),
    }
    return render(request, 'quiz/quiz.html', {'page_data': page_data})
