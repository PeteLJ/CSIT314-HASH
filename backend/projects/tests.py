from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import InteriorDesignProject, InterestEvent

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