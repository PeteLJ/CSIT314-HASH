from django.db.models import Count
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import InteriorDesignProject, InterestEvent
from .serializers import InteriorDesignProjectSerializer, InterestEventSerializer


# --- US-31: Browse Design Projects ---
# Guide: ProjectController.getProjectsForBrowse(), ProjectServiceImpl.fetchAllProjects()

# Browse all published projects, create new project
class ProjectController(generics.ListCreateAPIView):
    """Browse all published projects. Create a new project (draft or published)."""
    serializer_class = InteriorDesignProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = InteriorDesignProject.objects.filter(
            status=InteriorDesignProject.Status.PUBLISHED
        )
        # Search and filter (US-03)
        style = self.request.query_params.get('style')
        room_type = self.request.query_params.get('room_type')
        budget_min = self.request.query_params.get('budget_min')
        budget_max = self.request.query_params.get('budget_max')

        if style:
            queryset = queryset.filter(style__iexact=style)
        if room_type:
            queryset = queryset.filter(room_type__iexact=room_type)
        if budget_min:
            queryset = queryset.filter(budget_min__gte=budget_min)
        if budget_max:
            queryset = queryset.filter(budget_max__lte=budget_max)

        return queryset

    def perform_create(self, serializer):
        serializer.save(designer=self.request.user)


# --- US-35: View Project Details ---
# Guide: ProjectController.getProjectDetails(), ProjectServiceImpl.fetchProjectsById()

# Get, update, or delete a single project
class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InteriorDesignProject.objects.all()
    serializer_class = InteriorDesignProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


# Toggle publication status (draft/published/archived)
class ProjectPublishView(APIView):
    """Toggle publication status: DRAFT -> PUBLISHED -> ARCHIVED."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        if project.designer != request.user and not request.user.is_staff:
            return Response({'error': 'Not your project'}, status=status.HTTP_403_FORBIDDEN)
        new_status = request.data.get('status')
        if new_status not in [s.value for s in InteriorDesignProject.Status]:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        project.status = new_status
        project.save()
        return Response({'id': project.id, 'status': project.status})


# Record a view event when customer opens project detail
class RecordViewView(APIView):
    """Records a VIEW interest event. Called when a customer opens a project detail page."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        InterestEvent.objects.create(project=project, event_type=InterestEvent.EventType.VIEW)
        return Response({'status': 'recorded'}, status=status.HTTP_201_CREATED)


# --- Interest Events (shortlists/favourites) ---

# List and create interest events (shortlists/favourites)
class InterestEventListView(generics.ListCreateAPIView):
    serializer_class = InterestEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'CUSTOMER':
            return InterestEvent.objects.filter(
                customer=self.request.user,
                event_type=InterestEvent.EventType.SHORTLIST,
            )
        return InterestEvent.objects.filter(event_type=InterestEvent.EventType.SHORTLIST)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


# Remove a shortlist/favourite
class InterestEventDetailView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterestEvent.objects.filter(customer=self.request.user)


# --- Analytics endpoints ---

class PortfolioInterestView(APIView):
    """Returns total views, total shortlists, and ranked projects for the logged-in designer."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        designer = request.user
        projects = InteriorDesignProject.objects.filter(designer=designer)
        projects_data = []
        total_views = 0
        total_shortlists = 0

        for project in projects:
            vc = InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.VIEW).count()
            sc = InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.SHORTLIST).count()
            total_views += vc
            total_shortlists += sc
            projects_data.append({
                'id': project.id,
                'title': project.title,
                'style': project.style,
                'status': project.status,
                'view_count': vc,
                'shortlist_count': sc,
            })

        projects_data.sort(key=lambda x: (-x['shortlist_count'], -x['view_count']))

        return Response({
            'total_views': total_views,
            'total_shortlists': total_shortlists,
            'project_count': len(projects_data),
            'projects': projects_data,
        })


class TrendChartView(APIView):
    """Returns view and shortlist counts bucketed by period for a single project."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        period = request.query_params.get('period', 'daily')

        if period == 'weekly':
            trunc_fn = TruncWeek
        elif period == 'monthly':
            trunc_fn = TruncMonth
        else:
            trunc_fn = TruncDate

        view_qs = (
            InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.VIEW)
            .annotate(period=trunc_fn('occurred_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        view_map = {str(v['period']): v['count'] for v in view_qs}

        shortlist_qs = (
            InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.SHORTLIST)
            .annotate(period=trunc_fn('occurred_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        shortlist_map = {str(s['period']): s['count'] for s in shortlist_qs}

        all_periods = sorted(set(view_map.keys()) | set(shortlist_map.keys()))
        series = []
        for p in all_periods:
            series.append({
                'period': p,
                'views': view_map.get(p, 0),
                'shortlists': shortlist_map.get(p, 0),
            })

        return Response({
            'project_id': project.id,
            'project_title': project.title,
            'period': period,
            'series': series,
        })


class ViewCountView(APIView):
    """Returns the view count for a single project."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        count = InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.VIEW).count()
        return Response({'project_id': project.id, 'view_count': count})


class ShortlistCountView(APIView):
    """Returns the shortlist count for a single project."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        count = InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.SHORTLIST).count()
        return Response({'project_id': project.id, 'shortlist_count': count})
