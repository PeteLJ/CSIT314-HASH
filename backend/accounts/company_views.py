from django.db import DatabaseError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import MethodNotAllowed, ValidationError, NotFound
from django.contrib.auth import get_user_model
from .models import User, PropertyType
from .company_services import CompanyRepository, BudgetRangeController, PropertyTypeController

User = get_user_model()


class CompanyDesignerView(APIView):
    permission_classes = [AllowAny]

    def handle_exception(self, exc):
        if isinstance(exc, DatabaseError):
            return Response({'detail': 'Unable to save or load company data. Please retry.'}, status=503)
        return super().handle_exception(exc)

    def _get_designer(self, request):
        # Demo identity comes from the selector, separately from editable fields.
        designer_id = request.query_params.get('designer_id')
        if designer_id is None:
            return User.objects.filter(role=User.Role.INTERIOR_DESIGNER).first()
        if not designer_id.isascii() or not designer_id.isdecimal() or len(designer_id) > 18 or int(designer_id) < 1:
            raise ValidationError({'designer_id': 'Select a valid designer ID.'})
        try:
            return User.objects.get(pk=int(designer_id), role=User.Role.INTERIOR_DESIGNER)
        except User.DoesNotExist:
            raise NotFound('Selected designer was not found.')


class CompanySettingsView(CompanyDesignerView):
    def get(self, request):
        designer = self._get_designer(request)
        if not designer:
            return Response({'error': 'No designer found'}, status=404)
        company = CompanyRepository.forDesigner(designer)
        return Response({'id': company.pk, 'name': company.name,
                         'budget': BudgetRangeController.loadRange(designer),
                         'property_types': list(PropertyTypeController.listSupportedTypes(designer).values('id', 'name'))})


class PropertyTypeListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(list(PropertyType.objects.order_by('name').values('id', 'name')))


class BudgetRangeView(CompanyDesignerView):
    def patch(self, request):
        designer = self._get_designer(request)
        if not designer:
            return Response({'error': 'No designer found'}, status=404)
        return Response({'budget': BudgetRangeController.updateRange(designer, request.data)})


class SupportedPropertyTypeView(CompanyDesignerView):
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        allowed = {'DELETE', 'OPTIONS'} if 'type_id' in kwargs else {'POST', 'OPTIONS'}
        if request.method not in allowed:
            from rest_framework.exceptions import MethodNotAllowed
            raise MethodNotAllowed(request.method)

    def post(self, request):
        designer = self._get_designer(request)
        if not designer:
            return Response({'error': 'No designer found'}, status=404)
        PropertyTypeController.addSupportedType(designer, request.data)
        return Response({'detail': 'Property type added.'}, status=201)

    def delete(self, request, type_id):
        designer = self._get_designer(request)
        if not designer:
            return Response({'error': 'No designer found'}, status=404)
        PropertyTypeController.removeSupportedType(designer, type_id)
        return Response(status=204)
