from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import InteriorDesignProject, InterestEvent
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class InteriorDesignProjectModelTest(TestCase):
    def setUp(self):
        self.designer = User.objects.create_user(username='designer1', password='testpass123', role=User.Role.INTERIOR_DESIGNER)

    def test_create_project(self):
        project = InteriorDesignProject.objects.create(designer=self.designer, title='Modern Living Room', style='Modern', status=InteriorDesignProject.Status.DRAFT)
        self.assertEqual(project.title, 'Modern Living Room')
        self.assertEqual(project.status, InteriorDesignProject.Status.DRAFT)

    def test_default_status_is_draft(self):
        project = InteriorDesignProject.objects.create(designer=self.designer, title='Test Project')
        self.assertEqual(project.status, InteriorDesignProject.Status.DRAFT)

    def test_publish_project(self):
        project = InteriorDesignProject.objects.create(designer=self.designer, title='Test Project', status=InteriorDesignProject.Status.DRAFT)
        project.status = InteriorDesignProject.Status.PUBLISHED
        project.save()
        self.assertEqual(project.status, InteriorDesignProject.Status.PUBLISHED)

    def test_archive_project(self):
        project = InteriorDesignProject.objects.create(designer=self.designer, title='Test Project', status=InteriorDesignProject.Status.PUBLISHED)
        project.status = InteriorDesignProject.Status.ARCHIVED
        project.save()
        self.assertEqual(project.status, InteriorDesignProject.Status.ARCHIVED)


class InterestEventModelTest(TestCase):
    def setUp(self):
        self.designer = User.objects.create_user(username='designer1', password='testpass123', role=User.Role.INTERIOR_DESIGNER)
        self.project = InteriorDesignProject.objects.create(designer=self.designer, title='Test Project')

    def test_create_view_event(self):
        event = InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.VIEW)
        self.assertEqual(event.event_type, InterestEvent.EventType.VIEW)

    def test_create_shortlist_event(self):
        event = InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.SHORTLIST)
        self.assertEqual(event.event_type, InterestEvent.EventType.SHORTLIST)

    def test_view_count(self):
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.VIEW)
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.VIEW)
        self.assertEqual(InterestEvent.objects.filter(project=self.project, event_type=InterestEvent.EventType.VIEW).count(), 2)

    def test_shortlist_count(self):
        InterestEvent.objects.create(project=self.project, event_type=InterestEvent.EventType.SHORTLIST)
        self.assertEqual(InterestEvent.objects.filter(project=self.project, event_type=InterestEvent.EventType.SHORTLIST).count(), 1)


class US21CreateProjectTests(APITestCase):

    def setUp(self):
        self.designer = User.objects.create_user(
            username='us21_designer',
            password='testpass123',
            role=User.Role.INTERIOR_DESIGNER
        )
        self.client.force_authenticate(user=self.designer)

    def test_create_project_as_draft(self):
        response = self.client.post(
            '/api/projects/',
            {
                'title': 'Modern Living Room',
                'description': 'Modern interior design project',
                'style': 'Modern',
                'status': 'PUBLISHED'
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        project = InteriorDesignProject.objects.get(
            id=response.data['id']
        )

        self.assertEqual(
            project.status,
            InteriorDesignProject.Status.DRAFT
        )

    def test_create_project_without_title(self):
        response = self.client.post(
            '/api/projects/',
            {
                'description': 'Project without title',
                'style': 'Modern'
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_unauthenticated_user_cannot_create_project(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            '/api/projects/',
            {
                'title': 'Unauthorised Project',
                'style': 'Modern'
            },
            format='json'
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN
            ]
        )


class US24PublicationStatusTests(APITestCase):

    def setUp(self):
        self.designer = User.objects.create_user(
            username='us24_designer',
            password='testpass123',
            role=User.Role.INTERIOR_DESIGNER
        )

        self.other_designer = User.objects.create_user(
            username='other_designer',
            password='testpass123',
            role=User.Role.INTERIOR_DESIGNER
        )

        self.project = InteriorDesignProject.objects.create(
            designer=self.designer,
            title='Modern Living Room',
            status=InteriorDesignProject.Status.DRAFT
        )

        self.client.force_authenticate(user=self.designer)

    def test_publish_incomplete_project_fails(self):
        response = self.client.patch(
            f'/api/projects/{self.project.id}/publish/',
            {'status': 'PUBLISHED'},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.project.refresh_from_db()

        self.assertEqual(
            self.project.status,
            InteriorDesignProject.Status.DRAFT
        )

    def test_other_designer_cannot_publish_project(self):
        self.client.force_authenticate(
            user=self.other_designer
        )

        response = self.client.patch(
            f'/api/projects/{self.project.id}/publish/',
            {'status': 'PUBLISHED'},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_invalid_status_transition(self):
        response = self.client.patch(
            f'/api/projects/{self.project.id}/publish/',
            {'status': 'INVALID_STATUS'},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_unpublish_project(self):
        self.project.status = (
            InteriorDesignProject.Status.PUBLISHED
        )
        self.project.save()

        response = self.client.patch(
            f'/api/projects/{self.project.id}/publish/',
            {'status': 'UNPUBLISHED'},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.project.refresh_from_db()

        self.assertEqual(
            self.project.status,
            InteriorDesignProject.Status.UNPUBLISHED
        )
