"""M2 controls and repositories. Company identity always comes from request.user."""
from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from .models import Company, PropertyType


class BudgetRangeValidator(serializers.Serializer):
    minimum = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    maximum = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)

    def validate(self, attrs):
        if set(self.initial_data) - {'minimum', 'maximum'}:
            raise serializers.ValidationError('Unexpected budget fields.')
        if attrs['minimum'] > attrs['maximum']:
            raise serializers.ValidationError('Minimum must not exceed maximum.')
        return attrs


class PropertyTypeCatalog:
    @staticmethod
    def findByIds(ids):
        return PropertyType.objects.filter(pk__in=ids).order_by('name')

    @staticmethod
    def exists(type_id):
        return PropertyType.objects.filter(pk=type_id).exists()


class PropertyTypeValidator(serializers.Serializer):
    type_id = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        if set(self.initial_data) != {'type_id'}:
            raise serializers.ValidationError('Only type_id is accepted.')
        if not PropertyTypeCatalog.exists(attrs['type_id']):
            raise serializers.ValidationError('Select a valid property type.')
        if attrs['type_id'] in self.context['existing']:
            raise serializers.ValidationError('This property type is already supported.')
        return attrs


class CompanyRepository:
    @staticmethod
    def forDesigner(user, lock=False):
        query = Company.objects.select_for_update() if lock else Company.objects
        try:
            return query.get(designer=user)
        except Company.DoesNotExist:
            raise NotFound('Company settings have not been created for this designer.')

    @staticmethod
    def save(company):
        company.save()


class BudgetRangeController:
    @staticmethod
    def loadRange(user):
        return CompanyRepository.forDesigner(user).getBudgetRange()

    @staticmethod
    @transaction.atomic
    def updateRange(user, data):
        validator = BudgetRangeValidator(data=data)
        validator.is_valid(raise_exception=True)
        company = CompanyRepository.forDesigner(user, lock=True)
        company.setBudgetRange(validator.validated_data['minimum'], validator.validated_data['maximum'])
        CompanyRepository.save(company)
        return company.getBudgetRange()


class PropertyTypeController:
    @staticmethod
    def listSupportedTypes(user):
        company = CompanyRepository.forDesigner(user)
        return PropertyTypeCatalog.findByIds(company.getSupportedTypeIds())

    @staticmethod
    @transaction.atomic
    def addSupportedType(user, data):
        company = CompanyRepository.forDesigner(user, lock=True)
        validator = PropertyTypeValidator(data=data, context={'existing': company.getSupportedTypeIds()})
        validator.is_valid(raise_exception=True)
        company.addSupportedType(validator.validated_data['type_id'])

    @staticmethod
    @transaction.atomic
    def removeSupportedType(user, type_id):
        company = CompanyRepository.forDesigner(user, lock=True)
        if type_id not in company.getSupportedTypeIds():
            raise serializers.ValidationError('This property type is not currently supported.')
        company.removeSupportedType(type_id)
