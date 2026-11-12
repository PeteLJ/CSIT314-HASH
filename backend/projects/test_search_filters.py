from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import InteriorDesignProject


class US03SearchFilterTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        designer = get_user_model().objects.create_user(
            username='us03_designer', role='INTERIOR_DESIGNER',
        )
        published = InteriorDesignProject.Status.PUBLISHED
        draft = InteriorDesignProject.Status.DRAFT

        def project(title, style, room_type, budget, status=published):
            return InteriorDesignProject.objects.create(
                designer=designer, title=title, style=style,
                room_type=room_type, budget_min=budget, status=status,
            )

        cls.oak = project('Oak Studio', 'Modern', 'LIVING_ROOM', 20000)
        cls.birch = project('Birch Studio', 'Scandinavian', 'BEDROOM', 40000)
        cls.maple = project('Maple Retreat', 'Modern', 'BEDROOM', 50000)
        cls.zero = project('Garden Nook', 'Classic', 'KITCHEN', 0)
        project('Oak Studio (draft)', 'Modern', 'LIVING_ROOM', 20000, draft)

    def assert_projects(self, params, *projects):
        response = self.client.get('/api/projects/', params)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertCountEqual([row['id'] for row in response.data], [p.pk for p in projects])

    def test_keyword_matches_title_style_and_room_type(self):
        for keyword, expected in (
            ('sTuDiO', [self.oak, self.birch]),
            ('scandi', [self.birch]),
            ('living', [self.oak]),
        ):
            with self.subTest(keyword=keyword):
                self.assert_projects({'search': keyword}, *expected)

    def test_style_is_case_insensitive(self):
        self.assert_projects({'style': 'modern'}, self.oak, self.maple)

    def test_room_type_returns_only_matching_projects(self):
        self.assert_projects({'room_type': 'bedroom'}, self.birch, self.maple)

    def test_budget_bounds_are_inclusive_and_optional(self):
        self.assert_projects({'budget_min': '20000', 'budget_max': '40000'}, self.oak, self.birch)
        self.assert_projects({'budget_min': '40000'}, self.birch, self.maple)
        self.assert_projects({'budget_max': '0'}, self.zero)

    def test_combined_criteria_exclude_drafts(self):
        self.assert_projects(
            {'search': 'studio', 'style': 'Modern', 'room_type': 'LIVING_ROOM',
             'budget_min': '20000', 'budget_max': '20000'},
            self.oak,
        )

    def test_no_results_returns_empty_page(self):
        response = self.client.get('/api/projects/', {'search': 'no such project', 'page': 1})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'], [])
        self.assertEqual(response.data['total'], 0)

    def test_reversed_budget_returns_field_error(self):
        response = self.client.get('/api/projects/', {'budget_min': '40000', 'budget_max': '20000'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('budget_max', response.data)

    def test_invalid_budget_values_return_field_errors(self):
        for field, value in (
            ('budget_min', 'abc'), ('budget_max', '-1'), ('budget_max', 'NaN'),
            ('budget_min', '1.001'), ('budget_max', '100000000'),
        ):
            with self.subTest(field=field, value=value):
                response = self.client.get('/api/projects/', {field: value})
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.data)
