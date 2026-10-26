from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from projects.models import InteriorDesignProject, InterestEvent

User = get_user_model()


class AnalyticsAPITest(TestCase):
    def setUp(self):
        self.designer = User.objects.create_user(username='designer1', password='testpass123', role=User.Role.INTERIOR_DESIGNER)
        self.project = InteriorDesignProject.objects.create(designer=self.designer, title='Test Project', status=InteriorDesignProject.Status.PUBLISHED)
        self.client = APIClient()
        self.client.force_authenticate(user=self.designer)

    def test_portfolio_interest_empty(self):
        response = self.client.get('/api/analytics/portfolio/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_views'], 0)

    def test_portfolio_interest_with_views(self):
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.VIEW)
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.VIEW)
        response = self.client.get('/api/analytics/portfolio/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_views'], 2)
        self.assertEqual(response.data['projects'][0]['view_count'], 2)

    def test_portfolio_interest_with_shortlists(self):
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.SHORTLIST)
        response = self.client.get('/api/analytics/portfolio/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_shortlists'], 1)
        self.assertEqual(response.data['projects'][0]['shortlist_count'], 1)

    def test_portfolio_interest_ranking(self):
        project2 = InteriorDesignProject.objects.create(designer=self.designer, title='Second Project', status=InteriorDesignProject.Status.PUBLISHED)
        customer2 = User.objects.create_user(username='customer2', password='testpass123', role=User.Role.CUSTOMER)
        InterestEvent.objects.create(project=project2, event_type=InterestEvent.EventType.SHORTLIST, customer=customer2)
        InterestEvent.objects.create(project=project2, event_type=InterestEvent.EventType.SHORTLIST, customer=User.objects.create_user(username='customer3', password='testpass123', role=User.Role.CUSTOMER))
        response = self.client.get('/api/analytics/portfolio/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['projects'][0]['id'], project2.id)

    def test_trend_chart_empty(self):
        response = self.client.get(f'/api/analytics/trend/{self.project.id}/?period=daily')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['series'], [])

    def test_trend_chart_with_events(self):
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.VIEW)
        response = self.client.get(f'/api/analytics/trend/{self.project.id}/?period=daily')
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data['series']), 0)

    def test_view_count_endpoint(self):
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.VIEW)
        response = self.client.get(f'/api/projects/{self.project.id}/view-count/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['view_count'], 1)

    def test_shortlist_count_endpoint(self):
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.SHORTLIST)
        response = self.client.get(f'/api/projects/{self.project.id}/shortlist-count/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['shortlist_count'], 1)

    def test_publish_status_toggle(self):
        project = InteriorDesignProject.objects.create(designer=self.designer, title='Draft Project', status=InteriorDesignProject.Status.DRAFT)
        response = self.client.patch(f'/api/projects/{project.id}/publish/', {'status': 'PUBLISHED'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'PUBLISHED')

    def test_record_view(self):
        response = self.client.post(f'/api/projects/{self.project.id}/record-view/')
        self.assertEqual(response.status_code, 201)

    def test_interest_event_create_shortlist(self):
        response = self.client.post('/api/interest-events/', {'project': self.project.id, 'event_type': 'SHORTLIST'})
        self.assertEqual(response.status_code, 201)

    def test_interest_event_duplicate_shortlist_prevented(self):
        customer = User.objects.create_user(username='cust1', password='pass', role=User.Role.CUSTOMER)
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.SHORTLIST, customer=customer)
        self.client.force_authenticate(user=customer)
        response = self.client.post('/api/interest-events/', {'project': self.project.id, 'event_type': 'SHORTLIST'})
        self.assertEqual(response.status_code, 400)