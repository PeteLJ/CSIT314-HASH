from django.db import migrations


def provision(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    Company = apps.get_model('accounts', 'Company')
    db = schema_editor.connection.alias
    for user in User.objects.using(db).filter(role='INTERIOR_DESIGNER').iterator():
        Company.objects.using(db).get_or_create(
            designer_id=user.pk,
            defaults={'name': user.company.strip() or user.username},
        )


class Migration(migrations.Migration):
    dependencies = [('accounts', '0002_propertytype_company_company_valid_company_budget')]
    operations = [migrations.RunPython(provision, migrations.RunPython.noop)]
