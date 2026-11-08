from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User, Company, PropertyType


class Command(BaseCommand):
    help = 'Create missing company settings and property types for designers.'

    @transaction.atomic
    def handle(self, *args, **options):
        # Create property types
        property_type_names = ['HDB', 'Condominium', 'Landed', 'Commercial', 'Bungalow']
        for name in property_type_names:
            PropertyType.objects.get_or_create(name=name)
        
        count = 0
        for user in User.objects.filter(role=User.Role.INTERIOR_DESIGNER).iterator():
            company_name = user.company.strip() if user.company.strip() else f'{user.username} Design Studio'
            _, created = Company.objects.get_or_create(
                designer=user, defaults={'name': company_name})
            count += created
        self.stdout.write(f'Created {count} company settings records.')
        self.stdout.write(f'Property types: {PropertyType.objects.count()}')