from django.db.models import Q
from django.shortcuts import get_object_or_404, render

from core import api_data
from guides.models import Glossary, Guide


def guide_list(request):
    query = request.GET.get('q', '').strip()
    category = request.GET.get('category', '').strip()

    guides = Guide.objects.filter(is_published=True)
    if query:
        guides = guides.filter(
            Q(title__icontains=query)
            | Q(short_description__icontains=query)
            | Q(content__icontains=query)
        )
    if category:
        guides = guides.filter(category__iexact=category)

    categories = (
        Guide.objects.filter(is_published=True)
        .exclude(category='')
        .values_list('category', flat=True)
        .distinct()
        .order_by('category')
    )

    page_data = {'parts': api_data.parts_json()}
    return render(request, 'guides/guide_list.html', {
        'guides': guides,
        'query': query,
        'category': category,
        'categories': categories,
        'page_data': page_data,
    })


def guide_detail(request, slug):
    guide = get_object_or_404(Guide.objects.filter(is_published=True), slug=slug)
    others = Guide.objects.filter(is_published=True).exclude(pk=guide.pk)[:4]
    page_data = {'parts': api_data.parts_json()}
    return render(request, 'guides/guide_detail.html', {
        'guide': guide,
        'others': others,
        'page_data': page_data,
    })


def glossary(request):
    page_data = {'parts': api_data.parts_json(), 'glossary': api_data.glossary_json()}
    return render(request, 'guides/glossary.html', {'page_data': page_data})
