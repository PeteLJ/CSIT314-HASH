from rest_framework import generics, permissions
from .models import Category
from .serializers import CategorySerializer


# List and create categories
class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
