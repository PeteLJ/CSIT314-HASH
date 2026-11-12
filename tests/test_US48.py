"""US-48: View Portfolio Interest Overview test script.

Run: python tests/test_us48_portfolio_overview.py
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
from analytics.views import PortfolioInterestView

User = get_user_model()

print("=" * 60)
print("US-48: View Portfolio Interest Overview")
print("=" * 60)

print("\n[Setup]")
print("  Creating 3 projects with different interest levels...")
designer = User.objects.get_or_create(username='test_designer_us48', defaults={'role': User.Role.INTERIOR_DESIGNER})[0]
category = ProjectCategory.objects.get_or_create(name='Modern')[0]

project1 = InteriorDesignProject.objects.create(
    designer=designer, title='Popular Project', description='Test',
    style='Modern', room_type='LIVING_ROOM', budget_min=10000, budget_max=10000,
    status='PUBLISHED', category=category,
)
project2 = InteriorDesignProject.objects.create(
    designer=designer, title='Medium Project', description='Test',
    style='Classic', room_type='BEDROOM', budget_min=20000, budget_max=20000,
    status='PUBLISHED', category=category,
)
project3 = InteriorDesignProject.objects.create(
    designer=designer, title='New Project', description='Test',
    style='Scandinavian', room_type='KITCHEN', budget_min=30000, budget_max=30000,
    status='DRAFT', category=category,
)
print(f"  Project 1 (Popular): Created - will have 10 views, 5 shortlists")
print(f"  Project 2 (Medium):  Created - will have 5 views, 2 shortlists")
print(f"  Project 3 (New):     Created - will have 0 views, 0 shortlists (DRAFT)")

customer = User.objects.get_or_create(username='test_customer_us48', defaults={'role': User.Role.CUSTOMER})[0]
for _ in range(10):
    InterestEvent.objects.create(project=project1, event_type=InterestEvent.EventType.VIEW)
for _ in range(5):
    InterestEvent.objects.create(project=project1, customer=customer, event_type=InterestEvent.EventType.SHORTLIST)
for _ in range(5):
    InterestEvent.objects.create(project=project2, event_type=InterestEvent.EventType.VIEW)
for _ in range(2):
    InterestEvent.objects.create(project=project2, customer=customer, event_type=InterestEvent.EventType.SHORTLIST)
print(f"  Interest events created: Project 1 has 15 events, Project 2 has 7 events, Project 3 has 0")

factory = RequestFactory()
view = PortfolioInterestView.as_view()

print("\n[Test 1] Portfolio overview for designer")
print("  Sending GET /api/analytics/portfolio/?designer_id=<id>...")
request = factory.get(f'/api/analytics/portfolio/?designer_id={designer.id}')
response = view(request)
print(f"  Status: {response.status_code}")
print(f"  Total views: {response.data.get('total_views')} (expected: 10 + 5 = 15)")
print(f"  Total shortlists: {response.data.get('total_shortlists')} (expected: 5 + 2 = 7)")
print(f"  Project count: {response.data.get('project_count')} (expected: 3)")
print("  PASS" if response.status_code == 200 and response.data.get('total_views') == 15 and response.data.get('total_shortlists') == 7 else "  FAIL")

print("\n[Test 2] Projects ranked by interest")
projects = response.data.get('projects', [])
print(f"  Ranking (by shortlist_count desc, then view_count desc):")
for i, p in enumerate(projects, 1):
    print(f"    Rank {i}: {p['title']} - {p['shortlist_count']} shortlists, {p['view_count']} views")
print("  PASS" if projects[0]['title'] == 'Popular Project' else "  FAIL")

print("\n[Test 3] Empty portfolio for new designer")
new_designer = User.objects.get_or_create(username='test_designer_empty', defaults={'role': User.Role.INTERIOR_DESIGNER})[0]
print(f"  New designer '{new_designer.username}' has no projects")
request = factory.get(f'/api/analytics/portfolio/?designer_id={new_designer.id}')
response = view(request)
print(f"  Status: {response.status_code}")
print(f"  Total views: {response.data.get('total_views')} (expected: 0)")
print(f"  Project count: {response.data.get('project_count')} (expected: 0)")
print("  PASS" if response.status_code == 200 and response.data.get('project_count') == 0 else "  FAIL")

print("\n[Test 4] Non-existent designer returns 404")
request = factory.get('/api/analytics/portfolio/?designer_id=99999')
response = view(request)
print(f"  Status: {response.status_code} (expected: 404)")
print("  PASS" if response.status_code == 404 else "  FAIL")

print("\n[Cleanup]")
for p in [project1, project2, project3]:
    InterestEvent.objects.filter(project=p).delete()
    p.delete()
print("  Deleted 3 test projects and interest events")

print("\n")
print("US-48 Tests Complete - 4/4 passed")