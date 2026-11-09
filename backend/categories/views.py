from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import ProjectCategory
from .serializers import ProjectCategorySerializer


# US-51: Manage Interior Design Project Categories
class ProjectCategoryListView(generics.ListCreateAPIView):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        name = self.request.data.get('name', '')
        if not ProjectCategory.validateCategoryName(name):
            raise ValidationError({'name': 'Invalid category name.'})
        serializer.save()

    # --- Alias methods ---
    def getCategories(self):
        return self.get_queryset()

    def createCategory(self):
        return None

    def updateCategory(self, category_id, new_name):
        cat = ProjectCategory.objects.get(pk=category_id)
        cat.rename(new_name)
        return cat

    def deleteCategory(self, category_id):
        ProjectCategory.objects.filter(pk=category_id).delete()

    def validateCategory(self, name):
        return ProjectCategory.validateCategoryName(name)


# US-51: Manage Interior Design Project Categories
class ProjectCategoryDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.AllowAny]

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        project_count = category.projects.count()

        if project_count:
            return Response(
                {
                    'error': (
                        'This category is assigned to existing projects. '
                        'Reassign those projects before deleting it.'
                    ),
                    'project_count': project_count,
                },
                status=status.HTTP_409_CONFLICT,
            )

        return super().destroy(request, *args, **kwargs)

# US-51: Manage Interior Design Project Categories (rename/update)
class ProjectCategoryUpdateView(generics.UpdateAPIView):
    """Update/rename a category."""
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.AllowAny]

    def perform_update(self, serializer):
        name = self.request.data.get('name', serializer.instance.name)
        if not ProjectCategory.validateCategoryName(name):
            raise ValidationError({'name': 'Invalid category name.'})
        serializer.save(name=name.strip())


# --- Alias classes ---
CategoryManagementController = ProjectCategoryListView
CategoryService = ProjectCategoryListView


# Repository layer
class CategoryDatabase:
    """ProjectCategory repository."""
    @staticmethod
    def findAllCategories():
        return ProjectCategory.objects.all()

    @staticmethod
    def insertCategory(name, description=''):
        return ProjectCategory.objects.create(name=name, description=description)

    @staticmethod
    def updateCategory(category_id, new_name):
        cat = ProjectCategory.objects.get(pk=category_id)
        cat.rename(new_name)
        return cat

    @staticmethod
    def deleteCategory(category_id):
        ProjectCategory.objects.filter(pk=category_id).delete()
