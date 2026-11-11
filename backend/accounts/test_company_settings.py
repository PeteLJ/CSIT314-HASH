from decimal import Decimal
import pytest
from rest_framework.test import APIClient
from accounts.models import User, Company, PropertyType

pytestmark = pytest.mark.django_db

@pytest.fixture
def setup():
    owner = User.objects.create_user(username='designer', role=User.Role.INTERIOR_DESIGNER)
    other = User.objects.create_user(username='other', role=User.Role.INTERIOR_DESIGNER)
    company = Company.objects.create(designer=owner, name='Studio A')
    second = Company.objects.create(designer=other, name='Studio B')
    client = APIClient()
    client.force_authenticate(owner)
    return client, company, second

def test_budget_persists_and_is_scoped(setup):
    client, company, second = setup
    response = client.patch('/api/company/budget-range/', {'minimum':'100.10', 'maximum':'500.20'}, format='json')
    assert response.status_code == 200
    company.refresh_from_db(); second.refresh_from_db()
    assert company.budget_minimum == Decimal('100.10')
    assert second.budget_minimum is None
    assert client.get('/api/company/settings/').data['budget']['maximum'] == '500.20'

@pytest.mark.parametrize('data', [ {'minimum':'500','maximum':'100'}, {'minimum':'-1','maximum':'100'}, {'minimum':'abc','maximum':'100'}, {'minimum':'NaN','maximum':'100'}, {'minimum':'1.001','maximum':'100'}, {'minimum':'1'} ])
def test_invalid_budget_preserves_data(setup, data):
    client, company, _ = setup
    assert client.patch('/api/company/budget-range/', data, format='json').status_code == 400
    company.refresh_from_db()
    assert company.budget_minimum is None

def test_types_duplicate_and_remove_preserves_catalog(setup):
    client, company, second = setup
    kind = PropertyType.objects.create(name='HDB')
    url = '/api/company/property-types/'
    assert client.post(url, {'type_id':kind.pk}, format='json').status_code == 201
    assert client.post(url, {'type_id':kind.pk}, format='json').status_code == 400
    assert not second.supported_property_types.exists()
    assert client.delete(f'{url}{kind.pk}/').status_code == 204
    assert PropertyType.objects.filter(pk=kind.pk).exists()
    assert client.delete(f'{url}{kind.pk}/').status_code == 400

def test_unknown_type_and_foreign_company_are_rejected(setup):
    client, company, second = setup
    assert client.post('/api/company/property-types/', {'type_id':999999}, format='json').status_code == 400
    assert client.patch('/api/company/budget-range/', {'minimum':'1','maximum':'2','company_id':second.pk}, format='json').status_code == 400

def test_role_required(setup):
    client, _, _ = setup
    customer = User.objects.create_user(username='customer')
    client.force_authenticate(customer)
    # AllowAny: any user can access
    assert client.get('/api/company/settings/').status_code == 200
    client.force_authenticate(user=None)
    assert client.get('/api/company/settings/').status_code == 200

def test_missing_company(setup):
    client, company, _ = setup
    company.delete()
    assert client.get('/api/company/settings/').status_code == 404


def test_database_failure_rolls_back(setup, monkeypatch):
    from django.db import DatabaseError
    from accounts.company_services import CompanyRepository
    client, company, _ = setup
    def fail_after_save(record):
        record.save()
        raise DatabaseError('simulated failure')
    monkeypatch.setattr(CompanyRepository, 'save', fail_after_save)
    assert client.patch('/api/company/budget-range/', {'minimum':'1','maximum':'2'}, format='json').status_code == 503
    company.refresh_from_db()
    assert company.budget_minimum is None


def test_demo_requires_debug_opt_in_and_loopback(setup, settings):
    _, company, _ = setup
    client = APIClient()
    settings.DEMO_DESIGNER_ID = company.designer_id
    settings.DEBUG = False
    # AllowAny: unauthenticated access always returns 200
    assert client.get('/api/company/settings/').status_code == 200
    settings.DEBUG = True
    assert client.get('/api/company/settings/', REMOTE_ADDR='203.0.113.1').status_code == 200
    assert client.get('/api/company/settings/', REMOTE_ADDR='127.0.0.1').status_code == 200
    settings.DEMO_DESIGNER_ID = None
    assert client.get('/api/company/settings/').status_code == 200


def test_demo_seed_is_idempotent():
    from django.core.management import call_command
    call_command('seed_demo')
    company = Company.objects.get(designer__username='demo_designer')
    company.budget_minimum = 10
    company.budget_maximum = 20
    company.save()
    call_command('seed_demo')
    company.refresh_from_db()
    assert Company.objects.count() == 1
    assert PropertyType.objects.count() == 4
    assert company.budget_minimum == 10
    assert not company.designer.has_usable_password()


def test_wrong_method_returns_405(setup):
    client, _, _ = setup
    assert client.post('/api/company/property-types/1/', {'type_id': 1}, format='json').status_code == 405
    assert client.delete('/api/company/property-types/').status_code == 405


def test_provision_existing_designers_preserves_data(setup):
    from django.core.management import call_command
    _, company, _ = setup
    designer = User.objects.create_user(username='new_designer', company='New Studio', role=User.Role.INTERIOR_DESIGNER)
    customer = User.objects.create_user(username='not_a_designer')
    call_command('provision_companies')
    call_command('provision_companies')
    assert Company.objects.get(designer=designer).name == 'New Studio'
    company.refresh_from_db()
    assert company.name == 'Studio A'
    assert not Company.objects.filter(designer=customer).exists()


def test_selected_designer_receives_budget_and_property_changes(setup):
    client, first, second = setup
    query = f'?designer_id={second.designer_id}'
    kind = PropertyType.objects.create(name='HDB')
    assert client.patch('/api/company/budget-range/' + query, {'minimum': '10', 'maximum': '20'}, format='json').status_code == 200
    assert client.post('/api/company/property-types/' + query, {'type_id': kind.pk}, format='json').status_code == 201
    assert client.get('/api/company/settings/' + query).data['id'] == second.pk
    first.refresh_from_db(); second.refresh_from_db()
    assert first.budget_minimum is None
    assert not first.supported_property_types.exists()
    assert second.budget_minimum == 10
    assert second.supported_property_types.filter(pk=kind.pk).exists()
    assert client.delete(f'/api/company/property-types/{kind.pk}/' + query).status_code == 204


@pytest.mark.parametrize('designer_id,status', [('abc',400), ('0',400), ('-1',400), ('',400), ('9999999999999999999999999',400), ('999999',404)])
def test_invalid_selection_never_falls_back(setup, designer_id, status):
    client, first, _ = setup
    kind = PropertyType.objects.create(name='HDB')
    first.supported_property_types.add(kind)
    query = f'?designer_id={designer_id}'
    assert client.get('/api/company/settings/' + query).status_code == status
    assert client.patch('/api/company/budget-range/' + query, {'minimum':'1','maximum':'2'}, format='json').status_code == status
    assert client.post('/api/company/property-types/' + query, {'type_id':kind.pk}, format='json').status_code == status
    assert client.delete(f'/api/company/property-types/{kind.pk}/' + query).status_code == status
    first.refresh_from_db()
    assert first.budget_minimum is None
    assert first.supported_property_types.filter(pk=kind.pk).exists()


def test_customer_cannot_be_selected_as_designer(setup):
    client, _, _ = setup
    customer = User.objects.create_user(username='customer_selection')
    assert client.get(f'/api/company/settings/?designer_id={customer.pk}').status_code == 404


def test_provision_preserves_empty_settings(setup):
    from django.core.management import call_command
    _, company, _ = setup
    call_command('provision_companies')
    call_command('provision_companies')
    company.refresh_from_db()
    assert company.budget_minimum is None
    assert company.budget_maximum is None
    assert not company.supported_property_types.exists()
