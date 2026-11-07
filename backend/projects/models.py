from django.db import models
from django.utils import timezone
from django.conf import settings


# Interior Design Project model - managed by Interior Designers
class InteriorDesignProject(models.Model):
    """Interior Design Project - managed by Interior Designers."""

    # Publication status choices
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        UNPUBLISHED = 'UNPUBLISHED', 'Unpublished'
        ARCHIVED = 'ARCHIVED', 'Archived'
        REMOVED = 'REMOVED', 'Removed by moderation'

    # Room type choices
    class RoomType(models.TextChoices):
        LIVING_ROOM = 'LIVING_ROOM', 'Living Room'
        BEDROOM = 'BEDROOM', 'Bedroom'
        KITCHEN = 'KITCHEN', 'Kitchen'
        BATHROOM = 'BATHROOM', 'Bathroom'
        WHOLE_UNIT = 'WHOLE_UNIT', 'Whole Unit'

    # FK to the designer who owns this project
    designer = models.ForeignKey(
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
    category = models.ForeignKey(
        'categories.ProjectCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='projects',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def countByCategory(self):
        """Count projects in this category — matches naming guide."""
        if self.category:
            return InteriorDesignProject.objects.filter(category=self.category).count()
        return 0

    def __str__(self):
        return f'{self.title} ({self.get_status_display()})'


class ProjectFlag(models.Model):
    """A customer report awaiting a Platform Manager decision."""

    class Reason(models.TextChoices):
        INAPPROPRIATE = 'INAPPROPRIATE', 'Inappropriate content'
        MISLEADING = 'MISLEADING', 'Misleading information'
        COPYRIGHT = 'COPYRIGHT', 'Copyright concern'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        RESOLVED = 'RESOLVED', 'Resolved - project removed'
        DISMISSED = 'DISMISSED', 'Dismissed - project kept'

    project = models.ForeignKey(
        InteriorDesignProject,
        on_delete=models.CASCADE,
        related_name='flags',
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_project_flags',
    )
    reason = models.CharField(
        max_length=24,
        choices=Reason.choices,
    )
    details = models.TextField(blank=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.OPEN,
    )
    moderation_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_project_flags',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_reason_display()} - {self.project.title}'


# Tracks view and shortlist events on projects
class InterestEvent(models.Model):
    """Records an interest event (view or shortlist) on an Interior Design Project."""

    # Event type - view or shortlist
    class EventType(models.TextChoices):
        VIEW = 'VIEW', 'View'
        SHORTLIST = 'SHORTLIST', 'Shortlist'

    # FK to the project this event belongs to
    project = models.ForeignKey(
        InteriorDesignProject,
        on_delete=models.CASCADE,
        related_name='interest_events',
    )
    # FK to the customer (only for shortlist events)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='shortlist_events',
    )
    occurred_at = models.DateTimeField(default=timezone.now)
    event_type = models.CharField(
        max_length=16,
        choices=EventType.choices,
    )

    class Meta:
        ordering = ['-occurred_at']

    def __str__(self):
        return f'{self.get_event_type_display()} on {self.project.title} at {self.occurred_at}'
