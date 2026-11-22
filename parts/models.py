from django.db import models
from django.urls import reverse
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True, allow_unicode=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'دسته‌بندی قطعه'
        verbose_name_plural = 'دسته‌بندی قطعات'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Part(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name='parts'
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True, allow_unicode=True)
    en_name = models.CharField('نام انگلیسی', max_length=200, blank=True)
    image = models.ImageField(upload_to='parts/', blank=True, null=True)
    image_url = models.URLField('آدرس تصویر جایگزین', blank=True)
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    function = models.TextField('وظیفه قطعه', blank=True)
    location = models.CharField('محل قرارگیری', max_length=200, blank=True)
    lifespan = models.CharField('طول عمر استاندارد', max_length=100, blank=True)
    failure_signs = models.TextField('علائم خرابی (هر مورد در یک خط)', blank=True)
    maintenance_tips = models.TextField('نکات نگهداری (هر مورد در یک خط)', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'قطعه'
        verbose_name_plural = 'قطعات'
        ordering = ['category__name', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('parts:part_detail', args=[self.slug])

    @property
    def failure_signs_list(self):
        return [line.strip() for line in self.failure_signs.splitlines() if line.strip()]

    @property
    def maintenance_tips_list(self):
        return [line.strip() for line in self.maintenance_tips.splitlines() if line.strip()]

    @property
    def visual_url(self):
        if self.image:
            return self.image.url
        return self.image_url
