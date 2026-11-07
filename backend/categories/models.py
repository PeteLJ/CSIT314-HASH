from django.db import models


class ProjectCategory(models.Model):
    """Interior Design Project category - managed by Platform Management."""

    name = models.CharField(max_length=100, unique=True)
    category_type = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

    def rename(self, new_name):
        """Rename this category."""
        self.name = new_name
        self.save()

    @staticmethod
    def validateCategoryName(name):
        """Validate category name."""
        if not name or not name.strip():
            return False
        if len(name.strip()) > 100:
            return False
        return True