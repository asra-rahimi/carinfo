from django.contrib import admin

from .models import QuizQuestion


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('question', 'part', 'correct_answer', 'created_at')
    list_filter = ('correct_answer',)
    search_fields = ('question', 'option_a', 'option_b', 'option_c', 'option_d')
    list_select_related = ('part',)
