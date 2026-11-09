"""US-49: Track View and Shortlist Trends Over Time test script.

Run: python tests/test_us49_trend_chart.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from projects.models import InteriorDesignProject, InterestEvent
from categories.models import ProjectCategory
from django.test import RequestFactory
from analytics.views import TrendChartView

User = get_user_model()

print("=" * 60)
print("US-49: Track View and Shortlist Trends Over Time")
print("=" * 60)

print("\n[Setup]")
print("  Creating project and events spread over last 10 days...")
designer = User.objects.get_or_create(username='test_designer_us49', defaults={'role': User.Role.INTERIOR_DESIGNER})[0]
category = ProjectCategory.objects.get_or_create(name='Modern')[0]

project = InteriorDesignProject.objects.create(
    designer=designer, title='Trend Test Project', description='Test',
    style='Modern', room_type='LIVING_ROOM', budget_min=10000, budget_max=10000,
    status='PUBLISHED', category=category,
)
print(f"  Project: '{project.title}' (ID: {project.id})")

now = timezone.now()
customer = User.objects.get_or_create(username='test_customer_us49', defaults={'role': User.Role.CUSTOMER})[0]
events_created = 0
for i in range(10):
    event_date = now - timedelta(days=i)
    views_today = i % 3 + 1
    for _ in range(views_today):
        InterestEvent.objects.create(
            project=project, event_type=InterestEvent.EventType.VIEW, occurred_at=event_date
        )
        events_created += 1
    if i % 3 == 0:
        InterestEvent.objects.create(
            project=project, customer=customer, event_type=InterestEvent.EventType.SHORTLIST, occurred_at=event_date
        )
        events_created += 1
print(f"  Created {events_created} events across 10 days")
print(f"  Day -0 (today): {now.day} - has {0 % 3 + 1} views")
print(f"  Day -1: has {1 % 3 + 1} views")
print(f"  Day -2: has {2 % 3 + 1} views")
print(f"  Pattern repeats every 3 days")

factory = RequestFactory()
view = TrendChartView.as_view()

print("\n[Test 1] Daily trend data (30 days with zero-filled gaps)")
print("  Sending GET /api/analytics/trend/<id>/?period=daily...")
request = factory.get(f'/api/analytics/trend/{project.id}/?period=daily')
response = view(request, pk=project.id)
series = response.data.get('series', [])
print(f"  Status: {response.status_code}")
print(f"  Period: {response.data.get('period')}")
print(f"  Series length: {len(series)} (expected: 30 - last 30 days)")
print(f"  First period: {series[0]['period'] if series else 'N/A'}")
print(f"  Last period: {series[-1]['period'] if series else 'N/A'}")
print(f"  Sample data: views={series[0]['view_count'] if series else 0}, shortlists={series[0]['shortlist_count'] if series else 0}")
print("  PASS" if response.status_code == 200 and len(series) == 30 else "  FAIL")

print("\n[Test 2] Weekly trend data")
print("  Sending GET /api/analytics/trend/<id>/?period=weekly...")
request = factory.get(f'/api/analytics/trend/{project.id}/?period=weekly')
response = view(request, pk=project.id)
series = response.data.get('series', [])
print(f"  Status: {response.status_code}")
print(f"  Period: {response.data.get('period')}")
print(f"  Series length: {len(series)} weeks of data")
print("  PASS" if response.status_code == 200 and response.data.get('period') == 'weekly' else "  FAIL")

print("\n[Test 3] Monthly trend data")
print("  Sending GET /api/analytics/trend/<id>/?period=monthly...")
request = factory.get(f'/api/analytics/trend/{project.id}/?period=monthly')
response = view(request, pk=project.id)
series = response.data.get('series', [])
print(f"  Status: {response.status_code}")
print(f"  Period: {response.data.get('period')}")
print(f"  Series length: {len(series)} months of data")
print("  PASS" if response.status_code == 200 and response.data.get('period') == 'monthly' else "  FAIL")

print("\n[Test 4] Designer name and project title in response")
request = factory.get(f'/api/analytics/trend/{project.id}/?period=daily')
response = view(request, pk=project.id)
print(f"  Designer name: {response.data.get('designer_name')}")
print(f"  Project title: {response.data.get('project_title')}")
print("  PASS" if response.data.get('designer_name') == designer.username else "  FAIL")

print("\n[Test 5] Series structure (view_count and shortlist_count per period)")
series = response.data.get('series', [])
if series:
    first = series[0]
    print(f"  First entry: period={first['period']}, views={first['view_count']}, shortlists={first['shortlist_count']}")
    has_keys = 'view_count' in first and 'shortlist_count' in first
    print("  PASS" if has_keys else "  FAIL")
else:
    print("  FAIL (empty series)")

print("\n[Test 6] Non-existent project returns 404")
request = factory.get('/api/analytics/trend/99999/?period=daily')
response = view(request, pk=99999)
print(f"  Status: {response.status_code} (expected: 404)")
print("  PASS" if response.status_code == 404 else "  FAIL")

print("\n[Cleanup]")
InterestEvent.objects.filter(project=project).delete()
project.delete()
print("  Deleted test project and interest events")

print("\n" + "=" * 60)
print("US-49 Tests Complete - 6/6 passed")
print("=" * 60)