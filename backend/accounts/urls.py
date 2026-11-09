from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]
from .company_views import CompanySettingsView, PropertyTypeListView, BudgetRangeView, SupportedPropertyTypeView
urlpatterns += [
    path('company/settings/', CompanySettingsView.as_view()),
    path('property-types/', PropertyTypeListView.as_view()),
    path('company/budget-range/', BudgetRangeView.as_view()),
    path('company/property-types/', SupportedPropertyTypeView.as_view()),
    path('company/property-types/<int:type_id>/', SupportedPropertyTypeView.as_view()),
]