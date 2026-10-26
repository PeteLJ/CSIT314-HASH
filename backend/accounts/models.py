from django.contrib.auth.models import AbstractUser
from django.db import models


# Custom user model with 4 roles as required by the spec
class User(AbstractUser):
    """Custom user model with 4 roles as required by the Project Specification."""

    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        INTERIOR_DESIGNER = 'INTERIOR_DESIGNER', 'Interior Designer'
        USER_ADMIN = 'USER_ADMIN', 'User Admin'
        PLATFORM_MANAGEMENT = 'PLATFORM_MANAGEMENT', 'Platform Management'

    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    # Company name for interior designers
    company = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'