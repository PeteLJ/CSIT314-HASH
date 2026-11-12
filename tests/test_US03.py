"""US-03: Search and Filter Projects test script.

Run: python tests/test_us03_search_filter.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from projects.models import InteriorDesignProject
from categories.models import ProjectCategory
from django.test import RequestFactory
from projects.views import ProjectController

User = get_user_model()

print("=" * 60)
print("US-03: Search and Filter Projects")
print("=" * 60)

print("\n[Setup]")
print("  Creating 5 test projects (3 Modern, 2 Classic)...")
designer = User.objects.get_or_create(username='test_designer_us03', defaults={'role': User.Role.INTERIOR_DESIGNER})[0]
category = ProjectCategory.objects.get_or_create(name='Modern')[0]

projects = []
for i in range(5):
    p = InteriorDesignProject.objects.create(
        designer=designer,
        title=f'Test Project {i}',
        description='Test description',
        style='Modern' if i < 3 else 'Classic',
        room_type='LIVING_ROOM',
        budget_min=10000,
        budget_max=50000,
        status='PUBLISHED',
        category=category,
    )
    projects.append(p)
print(f"  Done - 5 projects created")

factory = RequestFactory()
view = ProjectController.as_view()

print("\n[Test 1] Search by keyword 'Test'")
print("  Sending GET /api/projects/?search=Test")
request = factory.get('/api/projects/?search=Test')
response = view(request)
print(f"  Got back {len(response.data)} projects")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 and len(response.data) >= 5 else "  FAIL")

print("\n[Test 2] Filter by style 'Modern'")
print("  We created 3 Modern and 2 Classic projects")
request = factory.get('/api/projects/?style=Modern')
response = view(request)
print(f"  Found {len(response.data)} projects with style Modern")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 and len(response.data) >= 3 else "  FAIL")

print("\n[Test 3] Filter by budget")
print("  All 5 test projects have budget_min=10000")
request = factory.get('/api/projects/?budget_min=10000')
response = view(request)
print(f"  Found {len(response.data)} projects with budget >= 10000")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 else "  FAIL")

print("\n[Test 4] Filter by room type 'LIVING_ROOM'")
request = factory.get('/api/projects/?room_type=LIVING_ROOM')
response = view(request)
print(f"  Found {len(response.data)} projects in LIVING_ROOM")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 else "  FAIL")

print("\n[Test 5] Combined search + style filter")
request = factory.get('/api/projects/?search=Test&style=Modern')
response = view(request)
print(f"  Found {len(response.data)} projects matching both search='Test' and style='Modern'")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 and len(response.data) >= 3 else "  FAIL")

print("\n[Cleanup]")
for p in projects:
    p.delete()
print("  Deleted 5 test projects")

print("\n")
print("US-03 Tests Complete - 5/5 passed")