from django.conf import settings
from django.db import DatabaseError
from rest_framework.authentication import BaseAuthentication, TokenAuthentication, SessionAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import MethodNotAllowed
from .models import User, PropertyType
from .company_services import CompanyRepository, BudgetRangeController, PropertyTypeController


class LocalDemoAuthentication(BaseAuthentication):
    """Opt-in local demo only; never accept an arbitrary user/company ID from a client."""
    def authenticate(self, request):
        if request.META.get('REMOTE_ADDR') not in {'127.0.0.1', '::1'}:
            return None
        if not (settings.DEBUG and getattr(settings, 'M2_DEMO_DESIGNER_ID', None)):
            return None
        user = User.objects.filter(pk=settings.M2_DEMO_DESIGNER_ID, is_active=True,
                                   role=User.Role.INTERIOR_DESIGNER).first()
        return (user, None) if user else None


class IsDesigner(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active
                    and request.user.role == User.Role.INTERIOR_DESIGNER)


class DesignerView(APIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication, LocalDemoAuthentication]
    permission_classes = [IsDesigner]

    def handle_exception(self, exc):
        if isinstance(exc, DatabaseError):
            return Response({'detail': 'Unable to save or load company data. Please retry.'}, status=503)
        return super().handle_exception(exc)


class CompanySettingsView(DesignerView):
    def get(self, request):
        company = CompanyRepository.forDesigner(request.user)
        return Response({'id': company.pk, 'name': company.name,
                         'budget': BudgetRangeController.loadRange(request.user),
                         'property_types': list(PropertyTypeController.listSupportedTypes(request.user).values('id', 'name'))})


class PropertyTypeListView(DesignerView):
    def get(self, request):
        return Response(list(PropertyType.objects.order_by('name').values('id', 'name')))


class BudgetRangeView(DesignerView):
    def patch(self, request):
        return Response({'budget': BudgetRangeController.updateRange(request.user, request.data)})


class SupportedPropertyTypeView(DesignerView):
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        allowed = {'DELETE', 'OPTIONS'} if 'type_id' in kwargs else {'POST', 'OPTIONS'}
        if request.method not in allowed:
            raise MethodNotAllowed(request.method)

    def post(self, request):
        PropertyTypeController.addSupportedType(request.user, request.data)
        return Response({'detail': 'Property type added.'}, status=201)

    def delete(self, request, type_id):
        PropertyTypeController.removeSupportedType(request.user, type_id)
        return Response(status=204)
