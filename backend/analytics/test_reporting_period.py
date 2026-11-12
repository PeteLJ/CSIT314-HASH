from datetime import datetime, timedelta, timezone as dt_timezone
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from projects.models import InteriorDesignProject, InterestEvent

User = get_user_model()


class PortfolioReportingPeriodTests(TestCase):
    """US-07: reporting periods, zero activity, and no owned projects."""

    @classmethod
    def setUpTestData(cls):
        cls.designer = User.objects.create_user(username='report_designer', role=User.Role.INTERIOR_DESIGNER)
        cls.other_designer = User.objects.create_user(username='other_designer', role=User.Role.INTERIOR_DESIGNER)
        cls.empty_designer = User.objects.create_user(username='empty_designer', role=User.Role.INTERIOR_DESIGNER)
        cls.active_project = InteriorDesignProject.objects.create(
            designer=cls.designer, title='Active project', status='PUBLISHED')
        cls.idle_project = InteriorDesignProject.objects.create(
            designer=cls.designer, title='Idle draft')
        cls.other_project = InteriorDesignProject.objects.create(designer=cls.other_designer, title='Other project')
        cls.now = datetime(2026, 11, 6, 4, 0, tzinfo=dt_timezone.utc)

    def setUp(self):
        self.client = APIClient()
        self.clock = patch('analytics.views.timezone.now', return_value=self.now)
        self.clock.start()
        self.addCleanup(self.clock.stop)

    def event(self, project, event_type, occurred_at):
        return InterestEvent.objects.create(project=project, event_type=event_type, occurred_at=occurred_at)

    def overview(self, **params):
        return self.client.get('/api/analytics/portfolio/', {'designer_id': self.designer.pk, **params})

    def test_default_remains_all_time(self):
        self.event(self.active_project, 'VIEW', self.now - timedelta(days=365))
        response = self.overview()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['period'], 'all')
        self.assertIsNone(response.data['period_start'])
        self.assertEqual(response.data['total_views'], 1)

    def test_each_rolling_period_includes_boundaries_and_excludes_outside_events(self):
        for period, days in [('7d', 7), ('30d', 30), ('90d', 90)]:
            with self.subTest(period=period):
                InterestEvent.objects.all().delete()
                start = self.now - timedelta(days=days)
                self.event(self.active_project, 'VIEW', start)
                self.event(self.active_project, 'VIEW', self.now)
                self.event(self.active_project, 'VIEW', start - timedelta(microseconds=1))
                self.event(self.active_project, 'VIEW', self.now + timedelta(microseconds=1))
                self.event(self.active_project, 'SHORTLIST', start + timedelta(hours=1))
                self.event(self.active_project, 'SHORTLIST', start - timedelta(seconds=1))
                response = self.overview(period=period)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data['period_start'], start.isoformat())
                self.assertEqual(response.data['period_end'], self.now.isoformat())
                self.assertEqual(response.data['total_views'], 2)
                self.assertEqual(response.data['total_shortlists'], 1)
                self.assertEqual(response.data['project_count'], 2)

    def test_period_changes_recompute_counts_and_ranking(self):
        self.event(self.active_project, 'SHORTLIST', self.now - timedelta(days=60))
        self.event(self.idle_project, 'VIEW', self.now - timedelta(days=1))
        all_time = self.overview(period='all').data
        recent = self.overview(period='7d').data
        self.assertEqual(all_time['projects'][0]['id'], self.active_project.pk)
        self.assertEqual(recent['projects'][0]['id'], self.idle_project.pk)
        self.assertEqual(all_time['total_shortlists'], 1)
        self.assertEqual(recent['total_shortlists'], 0)
        self.assertEqual(recent['total_views'], sum(p['view_count'] for p in recent['projects']))
        self.assertEqual(recent['total_shortlists'], sum(p['shortlist_count'] for p in recent['projects']))

    def test_no_events_returns_zero_for_every_owned_project(self):
        response = self.overview(period='30d')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_views'], 0)
        self.assertEqual(response.data['total_shortlists'], 0)
        self.assertEqual(response.data['project_count'], 2)
        for project in response.data['projects']:
            self.assertEqual(project['view_count'], 0)
            self.assertEqual(project['shortlist_count'], 0)

    def test_old_activity_returns_zero_without_hiding_projects(self):
        self.event(self.active_project, 'VIEW', self.now - timedelta(days=31))
        response = self.overview(period='30d')
        self.assertEqual(response.data['total_views'], 0)
        self.assertEqual({p['id'] for p in response.data['projects']},
                         {self.active_project.pk, self.idle_project.pk})

    def test_empty_designer_does_not_fall_back_to_another_portfolio(self):
        self.event(self.active_project, 'VIEW', self.now)
        for period in ['all', '7d', '30d', '90d']:
            with self.subTest(period=period):
                response = self.overview(designer_id=self.empty_designer.pk, period=period)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data['designer_id'], self.empty_designer.pk)
                self.assertEqual(response.data['projects'], [])
                self.assertEqual(response.data['project_count'], 0)
                self.assertEqual(response.data['total_views'], 0)
                self.assertEqual(response.data['total_shortlists'], 0)

    def test_only_selected_designers_events_are_counted(self):
        self.event(self.other_project, 'VIEW', self.now)
        self.event(self.other_project, 'SHORTLIST', self.now)
        response = self.overview(period='7d')
        self.assertEqual(response.data['total_views'], 0)
        self.assertEqual(response.data['total_shortlists'], 0)
        self.assertNotIn(self.other_project.pk, [p['id'] for p in response.data['projects']])

    def test_authenticated_designer_without_id_is_preserved(self):
        self.client.force_authenticate(user=self.designer)
        response = self.client.get('/api/analytics/portfolio/', {'period': '7d'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['designer_id'], self.designer.pk)

    def test_invalid_period_is_rejected(self):
        for period in ['daily', '', 'invalid', '7']:
            with self.subTest(period=period):
                response = self.overview(period=period)
                self.assertEqual(response.status_code, 400)
                self.assertIn('Invalid reporting period', response.data['error'])

    def test_invalid_or_unknown_designer_does_not_return_another_portfolio(self):
        for designer_id in ['abc', '999999', '-1', '9' * 100]:
            with self.subTest(designer_id=designer_id):
                response = self.overview(designer_id=designer_id)
                self.assertEqual(response.status_code, 404)
