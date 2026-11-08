from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User, Company


class Command(BaseCommand):
    help = 'Create missing company settings for designers without overwriting existing data.'

    @transaction.atomic
    def handle(self, *args, **options):
        count = 0
        for user in User.objects.filter(role=User.Role.INTERIOR_DESIGNER).iterator():
            company_name = user.company.strip() if user.company.strip() else f'{user.username} Design Studio'
            _, created = Company.objects.get_or_create(
                designer=user, defaults={'name': company_name})
            count += created
        self.stdout.write(f'Created {count} company settings records.')