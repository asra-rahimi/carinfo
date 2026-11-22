from django.db import models
from django.utils.text import slugify

SEVERITY_CHOICES = [
    ('red', 'قرمز (توقف فوری)'),
    ('yellow', 'زرد (بررسی سریع)'),
]


class WarningLight(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True, allow_unicode=True)
    image = models.ImageField(upload_to='warnings/', blank=True, null=True)
    meaning = models.TextField('معنی چراغ', blank=True)
    severity = models.CharField(
        max_length=10, choices=SEVERITY_CHOICES, default='yellow'
    )
    recommended_action = models.TextField('اقدام پیشنهادی', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'چراغ هشدار'
        verbose_name_plural = 'چراغ‌های هشدار'
        ordering = ['severity', 'title']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


class OBDCode(models.Model):
    code = models.CharField('کد خطا', max_length=10, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    possible_causes = models.TextField('علل احتمالی', blank=True)
    recommended_action = models.TextField('اقدام پیشنهادی', blank=True)
    severity = models.CharField(
        max_length=10, choices=SEVERITY_CHOICES, default='yellow'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'کد خطای OBD-II'
        verbose_name_plural = 'کدهای خطای OBD-II'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} — {self.title}'

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        super().save(*args, **kwargs)
