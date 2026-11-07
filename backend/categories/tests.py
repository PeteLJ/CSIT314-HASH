from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import InteriorDesignProject
from .models import ProjectCategory


User = get_user_model()


class ProjectCategoryApiTests(APITestCase):
    def test_create_category_trims_name(self):
        response = self.client.post(
            '/api/categories/',
            {'name': '  Scandinavian  ', 'description': 'Light spaces'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Scandinavian')

    def test_rename_category(self):
        category = ProjectCategory.objects.create(name='Classic')

        response = self.client.patch(
            f'/api/categories/{category.id}/',
            {'name': 'Contemporary'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        category.refresh_from_db()
        self.assertEqual(category.name, 'Contemporary')

    def test_duplicate_name_is_case_insensitive(self):
        ProjectCategory.objects.create(name='Modern')

        response = self.client.post(
            '/api/categories/',
            {'name': 'modern'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_delete_unused_category(self):
        category = ProjectCategory.objects.create(name='Unused')

        response = self.client.delete(
            f'/api/categories/{category.id}/'
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            ProjectCategory.objects.filter(pk=category.pk).exists()
        )

    def test_cannot_delete_category_used_by_projects(self):
        designer = User.objects.create_user(
            username='category_designer',
            password='testpass123',
            role=User.Role.INTERIOR_DESIGNER,
        )
        category = ProjectCategory.objects.create(name='Kitchen')
        InteriorDesignProject.objects.create(
            designer=designer,
            title='Kitchen Project',
            category=category,
        )

        response = self.client.delete(
            f'/api/categories/{category.id}/'
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data['project_count'], 1)
        self.assertTrue(
            ProjectCategory.objects.filter(pk=category.pk).exists()
        )
