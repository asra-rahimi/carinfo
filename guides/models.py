from django.db import models
from django.urls import reverse
from django.utils.text import slugify


class Guide(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True, allow_unicode=True)
    image = models.ImageField(upload_to='guides/', blank=True, null=True)
    image_url = models.URLField('آدرس تصویر جایگزین', blank=True)
    category = models.CharField(max_length=100, blank=True)
    short_description = models.CharField(max_length=300, blank=True)
    content = models.TextField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'آموزش'
        verbose_name_plural = 'آموزش‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('guides:guide_detail', args=[self.slug])

    @property
    def visual_url(self):
        if self.image:
            return self.image.url
        return self.image_url


class Glossary(models.Model):
    term = models.CharField('اصطلاح', max_length=100)
    english_term = models.CharField('معادل انگلیسی', max_length=200, blank=True)
    description = models.TextField('توضیح', blank=True)
    category = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = 'واژه'
        verbose_name_plural = 'واژه‌نامه'
        ordering = ['term']

    def __str__(self):
        return self.term
