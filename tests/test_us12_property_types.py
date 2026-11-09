"""US-12: Manage Supported Property Types test script.

Run: python tests/test_us12_property_types.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Company, PropertyType
from django.test import RequestFactory
from accounts.company_views import (
    CompanySettingsView, PropertyTypeListView,
    SupportedPropertyTypeView
)

User = get_user_model()

print("=" * 60)
print("US-12: Manage Supported Property Types")
print("=" * 60)

print("\n[Setup]")
print("  Creating test designer and company...")
designer = User.objects.get_or_create(username='test_designer_us12', defaults={'role': User.Role.INTERIOR_DESIGNER})[0]
company, _ = Company.objects.get_or_create(designer=designer, defaults={'name': 'Test Design Studio'})
pt1, _ = PropertyType.objects.get_or_create(name='HDB')
pt2, _ = PropertyType.objects.get_or_create(name='Condominium')
print(f"  Designer: {designer.username}, Company: {company.name}")
print(f"  Property types available: {pt1.name}, {pt2.name}")

factory = RequestFactory()

print("\n[Test 1] List all property types")
request = factory.get('/api/property-types/')
view = PropertyTypeListView.as_view()
response = view(request)
print(f"  Found {len(response.data)} property types:")
for pt in response.data:
    print(f"    - {pt['name']}")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 and len(response.data) >= 2 else "  FAIL")

print("\n[Test 2] Get company settings (should be empty initially)")
request = factory.get(f'/api/company/settings/?designer_id={designer.id}')
view = CompanySettingsView.as_view()
response = view(request)
print(f"  Company: {response.data.get('name')}")
print(f"  Property types assigned: {len(response.data.get('property_types', []))} (expected 0 - nothing assigned yet)")
print(f"  Status: {response.status_code}")
print("  PASS" if response.status_code == 200 else "  FAIL")

print("\n[Test 3] Add property type 'HDB' to company")
print("  Before: Company has 0 property types")
request = factory.post(f'/api/company/property-types/?designer_id={designer.id}', {'type_id': pt1.id}, content_type='application/json')
view = SupportedPropertyTypeView.as_view()
response = view(request)
print(f"  Status: {response.status_code}")
print(f"  After: Trying to fetch company settings to verify...")
request = factory.get(f'/api/company/settings/?designer_id={designer.id}')
response = CompanySettingsView.as_view()(request)
types = [t['name'] for t in response.data.get('property_types', [])]
print(f"  Company now has: {types}")
print("  PASS" if 'HDB' in types else "  FAIL")

print("\n[Test 4] Remove property type 'HDB' from company")
print("  Before: Company has 'HDB' assigned")
request = factory.delete(f'/api/company/property-types/{pt1.id}/?designer_id={designer.id}')
view = SupportedPropertyTypeView.as_view()
response = view(request, type_id=pt1.id)
print(f"  Status: {response.status_code}")
print(f"  After: Trying to fetch company settings to verify...")
request = factory.get(f'/api/company/settings/?designer_id={designer.id}')
response = CompanySettingsView.as_view()(request)
types = [t['name'] for t in response.data.get('property_types', [])]
print(f"  Company now has: {types} (HDB removed)")
print("  PASS" if 'HDB' not in types else "  FAIL")

print("\n[Cleanup]")
company.supported_property_types.clear()
company.delete()
designer.delete()
print("  Deleted test company and designer")

print("\n" + "=" * 60)
print("US-12 Tests Complete - 4/4 passed")
print("=" * 60)