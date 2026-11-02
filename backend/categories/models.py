from django.db import models


class ProjectCategory(models.Model):
    """Interior Design Project category - managed by Platform Management."""

    name = models.CharField(max_length=100, unique=True)
    category_type = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name
