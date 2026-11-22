from django.conf import settings
from django.db import models


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites',
    )
    part = models.ForeignKey(
        'parts.Part',
        on_delete=models.CASCADE,
        related_name='favorited_by',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'علاقه‌مندی'
        verbose_name_plural = 'علاقه‌مندی‌ها'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'part'], name='unique_user_part'),
        ]

    def __str__(self):
        return f'{self.user} → {self.part}'


class CarProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='car_profile',
    )
    owner_name = models.CharField('نام مالک', max_length=100, blank=True)
    car_name = models.CharField('نام خودرو', max_length=120, blank=True)
    car_model = models.CharField('مدل/موتور', max_length=120, blank=True)
    current_kilometer = models.PositiveIntegerField('کارکرد فعلی (کیلومتر)', default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'پروفایل خودرو'
        verbose_name_plural = 'پروفایل‌های خودرو'

    def __str__(self):
        return f'{self.user} — {self.car_name or "بدون خودرو"}'

    @property
    def car_label(self):
        if self.car_name and self.car_model:
            return f'{self.car_name} / {self.car_model}'
        return self.car_name or self.car_model or ''
