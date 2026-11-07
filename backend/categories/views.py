from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import ProjectCategory
from .serializers import ProjectCategorySerializer


class ProjectCategoryListView(generics.ListCreateAPIView):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.AllowAny]


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

# --- Alias class for naming guide consistency ---
# Guide: CategoryManagementController
CategoryManagementController = ProjectCategoryListView
