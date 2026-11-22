from parts.models import Category, Part
from guides.models import Glossary
from warning_lights.models import OBDCode, WarningLight
from quiz.models import QuizQuestion
from maintenance.models import MaintenanceReminder


def parts_json():
    parts = Part.objects.select_related('category').all()
    return [
        {
            'id': p.slug,
            'slug': p.slug,
            'name': p.name,
            'enName': p.en_name,
            'category': p.category.name,
            'location': p.location,
            'lifespan': p.lifespan,
            'image': p.visual_url,
            'shortDesc': p.short_description,
            'fullDesc': p.description,
            'symptoms': p.failure_signs_list,
        }
        for p in parts
    ]


def categories_json():
    return list(Category.objects.values_list('name', flat=True))


def warnings_json():
    return [
        {
            'id': w.slug,
            'title': w.title,
            'severity': w.severity,
            'meaning': w.meaning,
            'action': w.recommended_action,
        }
        for w in WarningLight.objects.all()
    ]


def glossary_json():
    return [
        {'term': g.term, 'en': g.english_term, 'desc': g.description}
        for g in Glossary.objects.all()
    ]


def obd_json():
    return {
        c.code: {
            'title': c.title,
            'detail': c.recommended_action,
            'description': c.description,
            'possibleCauses': c.possible_causes,
            'severity': c.severity,
        }
        for c in OBDCode.objects.all()
    }


def quiz_json():
    questions = QuizQuestion.objects.select_related('part').all()
    return [
        {
            'partId': q.part.slug if q.part else '',
            'question': q.question,
            'options': q.options,
            'correct': q.correct_index,
            'reason': q.explanation,
        }
        for q in questions
    ]


def reminders_json(user):
    return [
        {
            'id': r.id,
            'partId': r.part.slug if r.part else '',
            'partName': r.part.name if r.part else r.title,
            'title': r.title,
            'targetKm': r.reminder_kilometer,
            'completed': r.is_completed,
        }
        for r in MaintenanceReminder.objects.filter(user=user).select_related('part')
    ]
