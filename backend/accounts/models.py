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

class PropertyType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Company(models.Model):
    designer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_settings')
    name = models.CharField(max_length=200)
    budget_minimum = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_maximum = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    supported_property_types = models.ManyToManyField(PropertyType, blank=True)

    class Meta:
        constraints = [models.CheckConstraint(
            name='valid_company_budget',
            check=(models.Q(budget_minimum__isnull=True, budget_maximum__isnull=True) |
                   (models.Q(budget_minimum__isnull=False, budget_maximum__isnull=False) &
                    models.Q(budget_minimum__gte=0, budget_maximum__gte=models.F('budget_minimum')))),
        )]

    def getBudgetRange(self):
        if self.budget_minimum is None:
            return None
        return {'minimum': str(self.budget_minimum), 'maximum': str(self.budget_maximum)}

    def setBudgetRange(self, minimum, maximum):
        self.budget_minimum, self.budget_maximum = minimum, maximum

    def getSupportedTypeIds(self):
        return list(self.supported_property_types.values_list('pk', flat=True))

    def addSupportedType(self, type_id):
        self.supported_property_types.add(type_id)

    def removeSupportedType(self, type_id):
        self.supported_property_types.remove(type_id)
