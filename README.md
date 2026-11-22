# CarInfo — Car Info

An interactive educational reference for car parts, dashboard warning lights and basic car diagnostics — built with Django and SQLite, featuring a glassmorphism UI and right-to-left layout.

[![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-6.1-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![HTML](https://img.shields.io/badge/HTML-39.8%25-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS-0.7%25-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-28.1%25-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

![CarInfo site](screenshot.png)

## Introduction

CarInfo is an educational, interactive website for drivers and car enthusiasts. All site data (parts, warning lights, OBD codes, glossary and quiz questions) is read from the database and can be edited through the Django admin panel without touching the code.

## Features

- Car parts encyclopedia with search, category filter and a detail page per part
- 2D X-ray view and 3D engine model with open/close parts (Three.js)
- 4-stroke combustion engine cycle simulator
- Visual quiz for recognizing parts with scoring
- Studio for comparing two parts
- Automotive glossary with live search
- OBD-II diagnostic trouble code lookup (e.g. P0300 and P0420)
- Car maintenance articles and guides
- User accounts: register, login and favorite parts
- Personal garage: car profile and service reminders with full CRUD
- Smart mechanic (chatbot), dark/light theme and responsive design

## Languages & Technologies

| Language / Technology | Purpose |
|---|---|
| Python 3.14 | Backend, logic and APIs |
| Django 6.1 | Framework, ORM, templates and admin panel |
| SQLite | Database |
| HTML | Page templates (Django Templates) |
| CSS + Tailwind CSS | Glassmorphism styling, dark/light theme, responsiveness |
| JavaScript + Three.js | Page interactions, simulator and 3D view |

## Architecture

```
Browser (HTML/CSS/JS + Three.js)
      │
      ├── Server-rendered pages (Django Templates)
      ├── DB data via json_script
      └── JSON fetch with CSRF for logged-in users
                  │
                  ▼
            Django (config + 7 apps)
                  │
                  ├── ORM ──── SQLite (db.sqlite3)
                  ├── Admin ── /admin/
                  └── Media ── /media/ (uploaded images)
```

## Setup

```bash
python -m venv venv
venv\Scripts\activate              # Windows
python -m pip install -r requirements.txt

python manage.py migrate           # create tables
python manage.py seed_data         # initial data (parts, lights, codes, quiz...)
python manage.py createsuperuser   # admin user

python manage.py runserver
```

- Site: `http://127.0.0.1:8000`
- Admin panel: `http://127.0.0.1:8000/admin`

Demo development superuser: `admin` / `carinfo-admin-2026` — change it after deployment.

## Site URLs

| URL | Page |
|---|---|
| `/` | Home (X-ray view, simulator, quiz, comparison and garage) |
| `/parts/` and `/parts/<slug>/` | Parts list and detail |
| `/guides/` and `/guides/<slug>/` | Maintenance guides |
| `/glossary/` | Automotive glossary |
| `/warnings/` | Dashboard warning lights |
| `/obd/` | OBD trouble code lookup |
| `/quiz/` | Visual quiz |
| `/about/` and `/contact/` | About and contact |
| `/accounts/login/` and `/accounts/register/` | Login and registration |
| `/profile/` | User and car profile |
| `/favorites/` | Favorites |
| `/maintenance/` | Service reminders |

## Project Structure

```text
carinfo/
├── config/          # project settings and root URLs
├── core/            # home page, shared data and seed command
├── parts/           # parts and categories
├── guides/          # guides and glossary
├── warning_lights/  # warning lights and OBD-II codes
├── quiz/            # visual quiz questions
├── accounts/        # login, register, profile and favorites
├── maintenance/     # service reminders and garage
├── templates/       # page templates
├── static/          # CSS and JavaScript
└── media/           # uploaded images (gitignored)
```

## Security Notes

- `SECRET_KEY` is read from the `DJANGO_SECRET_KEY` environment variable (the default value is for development only).
- All forms and APIs are CSRF-protected.
- Private pages (profile, favorites, reminders) require login and each user only sees their own data.
