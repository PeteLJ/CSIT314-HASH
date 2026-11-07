from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.ProjectCategoryListView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.ProjectCategoryDetailView.as_view(), name='category-detail'),
    path('categories/<int:pk>/update/', views.ProjectCategoryUpdateView.as_view(), name='category-update'),
]