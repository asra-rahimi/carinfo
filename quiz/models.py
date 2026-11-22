from django.db import models

ANSWER_CHOICES = [
    ('A', 'گزینه A'),
    ('B', 'گزینه B'),
    ('C', 'گزینه C'),
    ('D', 'گزینه D'),
]


class QuizQuestion(models.Model):
    question = models.TextField('متن سوال')
    image = models.ImageField(upload_to='quiz/', blank=True, null=True)
    part = models.ForeignKey(
        'parts.Part',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quiz_questions',
        verbose_name='قطعه مرتبط (برای تصویر سوال)',
    )
    option_a = models.CharField(max_length=200)
    option_b = models.CharField(max_length=200)
    option_c = models.CharField(max_length=200)
    option_d = models.CharField(max_length=200)
    correct_answer = models.CharField(max_length=1, choices=ANSWER_CHOICES)
    explanation = models.TextField('توضیح پاسخ', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'سوال آزمون'
        verbose_name_plural = 'سوالات آزمون'
        ordering = ['id']

    def __str__(self):
        return self.question[:80]

    @property
    def options(self):
        return [self.option_a, self.option_b, self.option_c, self.option_d]

    @property
    def correct_index(self):
        return {'A': 0, 'B': 1, 'C': 2, 'D': 3}.get(self.correct_answer, 0)
