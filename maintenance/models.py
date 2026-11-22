from django.conf import settings
from django.db import models


class MaintenanceReminder(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reminders',
    )
    part = models.ForeignKey(
        'parts.Part',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reminders',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    reminder_kilometer = models.PositiveIntegerField('کیلومتر یادآوری', default=0)
    current_kilometer = models.PositiveIntegerField('کارکرد فعلی', default=0)
    reminder_date = models.DateField('تاریخ یادآوری', null=True, blank=True)
    is_completed = models.BooleanField('انجام شده', default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'یادآور سرویس'
        verbose_name_plural = 'یادآورهای سرویس'
        ordering = ['is_completed', '-created_at']

    def __str__(self):
        return self.title
