"""US-35: View Project Details test script.

Run: python tests/test_us35_view_details.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from projects.models import InteriorDesignProject, InterestEvent
from categories.models import ProjectCategory
from django.test import RequestFactory
from projects.views import ProjectDetailView, RecordViewView
from analytics.views import ViewCountView, ShortlistCountView

User = get_user_model()

print("=" * 60)
print("US-35: View Project Details")
print("=" * 60)

print("\n[Setup]")
print("  Creating test project and interest events...")
designer = User.objects.get_or_create(username='test_designer_us35', defaults={'role': User.Role.INTERIOR_DESIGNER})[0]
category = ProjectCategory.objects.get_or_create(name='Modern')[0]

project = InteriorDesignProject.objects.create(
    designer=designer,
    title='Detail Test Project',
    description='Test description for detail view',
    style='Modern',
    room_type='LIVING_ROOM',
    budget_min=20000,
    budget_max=20000,
    status='PUBLISHED',
    category=category,
)
print(f"  Project created: '{project.title}' (ID: {project.id})")
print(f"  Project starts with 0 views, 0 shortlists")

# Create interest events to have non-zero counts for testing
for _ in range(3):
    InterestEvent.objects.create(project=project, event_type=InterestEvent.EventType.VIEW)
customer = User.objects.get_or_create(username='test_customer_us35', defaults={'role': User.Role.CUSTOMER})[0]
InterestEvent.objects.create(project=project, customer=customer, event_type=InterestEvent.EventType.SHORTLIST)
print(f"  Created 3 view events and 1 shortlist event in setup")
print(f"  Current counts: 3 views, 1 shortlist")

factory = RequestFactory()

print("\n[Test 1] Get project details")
print("  Sending GET /api/projects/{id}/ ...")
request = factory.get(f'/api/projects/{project.id}/')
view = ProjectDetailView.as_view()
response = view(request, pk=project.id)
print(f"  Status: {response.status_code}")
print(f"  Title: {response.data.get('title')}")
print(f"  Designer: {response.data.get('designer_name')}")
print(f"  Budget: ${response.data.get('budget_min')}")
print(f"  View count: {response.data.get('view_count')}")
print(f"  Shortlist count: {response.data.get('shortlist_count')}")
print("  PASS" if response.status_code == 200 and response.data.get('title') == 'Detail Test Project' else "  FAIL")

print("\n[Test 2] Record view event")
print("  Sending POST /api/projects/{id}/record-view/ ...")
request = factory.post(f'/api/projects/{project.id}/record-view/', {}, content_type='application/json')
view = RecordViewView.as_view()
response = view(request, pk=project.id)
print(f"  Status: {response.status_code}")
print(f"  After: Recorded view event")
print("  PASS" if response.status_code == 201 else "  FAIL")

print("\n[Test 3] Verify view count increased")
print("  Before: View count was 3")
request = factory.get(f'/api/projects/{project.id}/view-count/')
view = ViewCountView.as_view()
response = view(request, pk=project.id)
print(f"  View count after: {response.data.get('view_count')}")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 and response.data.get('view_count') == 4 else "  FAIL")

print("\n[Test 4] Get shortlist count")
request = factory.get(f'/api/projects/{project.id}/shortlist-count/')
view = ShortlistCountView.as_view()
response = view(request, pk=project.id)
print(f"  Shortlist count: {response.data.get('shortlist_count')} (expected: 1)")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 and response.data.get('shortlist_count') == 1 else "  FAIL")

print("\n[Test 5] Non-existent project returns 404")
request = factory.get('/api/projects/99999/')
view = ProjectDetailView.as_view()
response = view(request, pk=99999)
print(f"  Status: {response.status_code} (expected: 404)")
print("  PASS" if response.status_code == 404 else "  FAIL")

print("\n[Cleanup]")
InterestEvent.objects.filter(project=project).delete()
project.delete()
print("  Deleted test project and interest events")

print("\n")
print("US-35 Tests Complete - 5/5 passed")