from django.db.models import Q
from django.shortcuts import get_object_or_404, render

from core import api_data

from .models import Category, Part


def part_list(request):
    parts = Part.objects.select_related('category').all()
    categories = Category.objects.all()
    query = request.GET.get('q', '').strip()
    category_slug = request.GET.get('category', '').strip()

    if query:
        parts = parts.filter(
            Q(name__icontains=query)
            | Q(en_name__icontains=query)
            | Q(short_description__icontains=query)
            | Q(description__icontains=query)
        )
    if category_slug:
        parts = parts.filter(category__slug=category_slug)

    context = {
        'parts': parts,
        'categories': categories,
        'query': query,
        'category_slug': category_slug,
        'page_data': {'parts': api_data.parts_json()},
    }
    return render(request, 'parts/part_list.html', context)


def part_detail(request, slug):
    part = get_object_or_404(Part.objects.select_related('category'), slug=slug)
    is_fav = (
        request.user.is_authenticated
        and request.user.favorites.filter(part=part).exists()
    )
    context = {
        'part': part,
        'is_fav': is_fav,
        'page_data': {'parts': api_data.parts_json()},
    }
    return render(request, 'parts/part_detail.html', context)
