from django.db.models import Count
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from projects.models import InteriorDesignProject, InterestEvent

User = get_user_model()


# Portfolio interest overview for a designer
class PortfolioInterestView(APIView):
    """Returns total views, total shortlists, and ranked projects for the logged-in designer."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        designer_id = request.query_params.get('designer_id')
        if designer_id:
            try:
                designer = User.objects.get(pk=designer_id)
            except User.DoesNotExist:
                return Response({'error': 'Designer not found'}, status=status.HTTP_404_NOT_FOUND)
        elif request.user.is_authenticated:
            designer = request.user
        else:
            designer = User.objects.filter(role=User.Role.INTERIOR_DESIGNER).first()
        if not designer:
            return Response({'error': 'No designer found'}, status=status.HTTP_404_NOT_FOUND)

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


# Trend chart data for a single project
class TrendChartView(APIView):
    """Returns view and shortlist counts bucketed by period for a single project."""
    permission_classes = [permissions.AllowAny]

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
                'view_count': view_map.get(p, 0),
                'shortlist_count': shortlist_map.get(p, 0),
            })

        return Response({
            'project_id': project.id,
            'project_title': project.title,
            'period': period,
            'series': series,
        })


# Get view count for a single project
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


# Get shortlist count for a single project
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
