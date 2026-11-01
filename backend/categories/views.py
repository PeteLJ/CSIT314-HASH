from rest_framework import generics, permissions
from .models import ProjectCategory
from .serializers import ProjectCategorySerializer


class ProjectCategoryListView(generics.ListCreateAPIView):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.AllowAny]


class ProjectCategoryDetailView(generics.DestroyAPIView):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.AllowAny]

# --- Alias class for naming guide consistency ---
# Guide: CategoryManagementController
CategoryManagementController = ProjectCategoryListView
