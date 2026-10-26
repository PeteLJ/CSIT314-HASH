from django.db import models
from django.conf import settings


# Interior Design Project model - managed by Interior Designers\nclass InteriorDesignProject(models.Model):
    """Interior Design Project - managed by Interior Designers."""

    # Publication status choices\n    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        ARCHIVED = 'ARCHIVED', 'Archived'

    # Room type choices\n    class RoomType(models.TextChoices):
        LIVING_ROOM = 'LIVING_ROOM', 'Living Room'
        BEDROOM = 'BEDROOM', 'Bedroom'
        KITCHEN = 'KITCHEN', 'Kitchen'
        BATHROOM = 'BATHROOM', 'Bathroom'
        WHOLE_UNIT = 'WHOLE_UNIT', 'Whole Unit'

    # FK to the designer who owns this project\n    designer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interior_design_projects',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    style = models.CharField(max_length=100, blank=True)
    room_type = models.CharField(
        max_length=20,
        choices=RoomType.choices,
        blank=True,
    )
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.get_status_display()})'


# Tracks view and shortlist events on projects\nclass InterestEvent(models.Model):
    """Records an interest event (view or shortlist) on an Interior Design Project."""

    # Event type - view or shortlist\n    class EventType(models.TextChoices):
        VIEW = 'VIEW', 'View'
        SHORTLIST = 'SHORTLIST', 'Shortlist'

    # FK to the project this event belongs to\n    project = models.ForeignKey(
        InteriorDesignProject,
        on_delete=models.CASCADE,
        related_name='interest_events',
    )
    # FK to the customer (only for shortlist events)\n    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='shortlist_events',
    )
    occurred_at = models.DateTimeField(auto_now_add=True)
    event_type = models.CharField(
        max_length=16,
        choices=EventType.choices,
    )

    class Meta:
        ordering = ['-occurred_at']

    def __str__(self):
        return f'{self.get_event_type_display()} on {self.project.title} at {self.occurred_at}'
