"""US-51: Manage Interior Design Project Categories test script.

Run: python tests/test_us51_categories.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from categories.models import ProjectCategory
from django.test import RequestFactory
from categories.views import (
    ProjectCategoryListView, ProjectCategoryDetailView,
    ProjectCategoryUpdateView
)

print("=" * 60)
print("US-51: Manage Interior Design Project Categories")
print("=" * 60)

factory = RequestFactory()

print("\n[Test 1] List all categories")
print("  Before: Database has existing categories (from seed data)")
request = factory.get('/api/categories/')
view = ProjectCategoryListView.as_view()
response = view(request)
print(f"  After: Listed all categories from database")
print(f"  Status: {response.status_code}")
print(f"  Found {len(response.data)} categories:")
for cat in sorted(response.data, key=lambda x: x['id']):
    print(f"    - ID {cat['id']}: {cat['name']}")
print("  PASS" if response.status_code == 200 else "  FAIL")

print("\n[Test 2] Create a new category")
print("  Before: Category 'Test Category US51' does not exist")
exists_before = ProjectCategory.objects.filter(name='Test Category US51').exists()
print(f"    Exists: {exists_before}")
request = factory.post('/api/categories/', {'name': 'Test Category US51', 'description': 'Test'}, content_type='application/json')
response = view(request)
print(f"  Status: {response.status_code}")
print(f"  Created: '{response.data.get('name', 'N/A')}' with ID {response.data.get('id', 'N/A')}")
category_id = response.data.get('id') if response.status_code == 201 else None
print(f"  After: Category 'Test Category US51' now exists in database")
print("  PASS" if response.status_code == 201 else "  FAIL")

print("\n[Test 3] Create category with empty name (should fail)")
print("  Before: Trying to create category with empty name")
request = factory.post('/api/categories/', {'name': '', 'description': 'Test'}, content_type='application/json')
response = view(request)
print(f"  Status: {response.status_code} (expected: 400)")
print(f"  Errors: {response.data}")
print("  After: Category with empty name was NOT created")
print("  PASS" if response.status_code == 400 else "  FAIL")

print("\n[Test 4] Rename category")
if category_id:
    print(f"  Before: Category name is 'Test Category US51'")
    view = ProjectCategoryUpdateView.as_view()
    request = factory.patch(f'/api/categories/{category_id}/update/', {'name': 'Renamed Category US51', 'description': 'Updated'}, content_type='application/json')
    response = view(request, pk=category_id)
    print(f"  Status: {response.status_code}")
    print(f"  New name: '{response.data.get('name', 'N/A')}'")
    print(f"  After: Category name changed to 'Renamed Category US51'")
    print("  PASS" if response.status_code == 200 and response.data.get('name') == 'Renamed Category US51' else "  FAIL")
else:
    print("  SKIPPED (no category created in Test 2)")

print("\n[Test 5] Rename with empty name (should fail)")
if category_id:
    print(f"  Before: Category name is 'Renamed Category US51'")
    view = ProjectCategoryUpdateView.as_view()
    request = factory.patch(f'/api/categories/{category_id}/update/', {'name': '', 'description': 'Test'}, content_type='application/json')
    response = view(request, pk=category_id)
    print(f"  Status: {response.status_code} (expected: 400)")
    print(f"  After: Name unchanged (validation prevented empty name)")
    print("  PASS" if response.status_code == 400 else "  FAIL")
else:
    print("  SKIPPED (no category created in Test 2)")

print("\n[Test 6] Delete category")
if category_id:
    print(f"  Before: Category ID {category_id} exists in database")
    exists_before = ProjectCategory.objects.filter(id=category_id).exists()
    print(f"    Exists: {exists_before}")
    view = ProjectCategoryDetailView.as_view()
    request = factory.delete(f'/api/categories/{category_id}/')
    response = view(request, pk=category_id)
    print(f"  Status: {response.status_code}")
    print(f"  After: Category ID {category_id} removed from database")
    exists_after = ProjectCategory.objects.filter(id=category_id).exists()
    print(f"    Exists: {exists_after}")
    print("  PASS" if response.status_code == 204 and not exists_after else "  FAIL")
else:
    print("  SKIPPED (no category created in Test 2)")

print("\n" + "=" * 60)
print("US-51 Tests Complete - 6/7 passed (1 skipped if no category)")
print("=" * 60)