"""
Run this script on PythonAnywhere to fix existing projects without categories.

Usage:
    python fix_categories.py

Or in Django shell:
    python manage.py shell < fix_categories.py
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) if '__file__' in dir() else '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from projects.models import InteriorDesignProject
from categories.models import ProjectCategory

updated = 0
for p in InteriorDesignProject.objects.filter(category__isnull=True):
    cat = ProjectCategory.objects.filter(name__iexact=p.style).first()
    if cat:
        p.category = cat
        p.save()
        updated += 1

print(f'Updated {updated} projects with categories')
for cat in ProjectCategory.objects.all():
    print(f'  {cat.name}: {cat.projects.count()} projects')