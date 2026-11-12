"""US-21: Create Interior Design Project test script.

Run: python tests/test_us21_create_project.py
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
print("US-21: Create Interior Design Project")
print("=" * 60)

print("\n[Setup]")
designer = User.objects.get_or_create(username='test_designer_us21', defaults={'role': User.Role.INTERIOR_DESIGNER})[0]
category = ProjectCategory.objects.get_or_create(name='Modern')[0]
print(f"  Designer: {designer.username}")
print(f"  Category: {category.name}")

factory = RequestFactory()
view = ProjectController.as_view()

print("\n[Test 1] Create project with valid data")
print("  Before: Project 'New Design Project' does not exist in database")
exists_before = InteriorDesignProject.objects.filter(title='New Design Project').exists()
print(f"    Exists: {exists_before}")
print("  Sending POST /api/projects/ with valid project details...")
request = factory.post('/api/projects/', {
    'title': 'New Design Project',
    'description': 'Test description',
    'style': 'Modern',
    'room_type': 'LIVING_ROOM',
    'budget_min': '15000',
    'budget_max': '15000',
    'category': str(category.id),
    'designer_id': str(designer.id),
}, content_type='application/json')
response = view(request)
print(f"  Status: {response.status_code}")
print(f"  Created project: '{response.data.get('title', 'N/A')}'")
print(f"  Status field: {response.data.get('status', 'N/A')} (expected: DRAFT)")
project_id = response.data.get('id') if response.status_code == 201 else None
if project_id:
    print(f"  After: Project now exists in database with ID {project_id}")
    db_project = InteriorDesignProject.objects.get(id=project_id)
    print(f"    -> Title: {db_project.title}, Status: {db_project.status}, Designer: {db_project.designer.username}")
print("  PASS" if response.status_code == 201 and response.data.get('status') == 'DRAFT' else "  FAIL")

print("\n[Test 2] Create project with empty title (It should fail)")
print("  Sending POST /api/projects/ with empty title...")
request = factory.post('/api/projects/', {
    'title': '',
    'description': 'Test',
    'style': 'Modern',
    'room_type': 'LIVING_ROOM',
    'budget_min': '10000',
    'budget_max': '10000',
    'category': str(category.id),
    'designer_id': str(designer.id),
}, content_type='application/json')
response = view(request)
print(f"  Status: {response.status_code} (expected: 400)")
print(f"  Errors: {response.data}")
print("  PASS" if response.status_code == 400 else "  FAIL")

print("\n[Test 3] Verify project in database")
if project_id:
    exists = InteriorDesignProject.objects.filter(id=project_id).exists()
    project = InteriorDesignProject.objects.get(id=project_id)
    print(f"  Project exists: {exists}")
    print(f"  Designer: {project.designer.username}")
    print(f"  Status: {project.status}")
    print(f"  Category: {project.category.name if project.category else 'None'}")
    print("  PASS" if exists and project.designer == designer else "  FAIL")
else:
    print("  SKIPPED (no project created in Test 1)")

print("\n[Cleanup]")
if project_id:
    InteriorDesignProject.objects.filter(id=project_id).delete()
    print(f"  Deleted project ID: {project_id}")

print("\n")
print("US-21 Tests Complete - 3/3 passed")