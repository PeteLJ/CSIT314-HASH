from django.db.models import Count
from django.utils import timezone
from datetime import timedelta, date
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
        view_map = {str(v['period'].date() if hasattr(v['period'], 'date') else v['period']): v['count'] for v in view_qs}

        shortlist_qs = (
            InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.SHORTLIST)
            .annotate(period=trunc_fn('occurred_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        shortlist_map = {str(s['period'].date() if hasattr(s['period'], 'date') else s['period']): s['count'] for s in shortlist_qs}

        # Build full date range (last 30 days for daily, last 12 weeks for weekly, last 12 months for monthly)
        if period == 'weekly':
            num_periods = 12
            delta = timedelta(weeks=1)
        elif period == 'monthly':
            num_periods = 12
            delta = timedelta(days=30)
        else:
            num_periods = 30
            delta = timedelta(days=1)

        # Generate all periods in range
        end_date = timezone.localdate() if period == 'daily' else timezone.now()
        if period == 'daily':
            all_dates = [end_date - timedelta(days=i) for i in range(num_periods - 1, -1, -1)]
            all_periods = [str(d) for d in all_dates]
        else:
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
            'designer_name': project.designer.username,
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


# --- Alias classes for naming guide consistency ---
# Guide: InterestAnalyticsControl / AnalyticsController
InterestAnalyticsControl = PortfolioInterestView
AnalyticsController = PortfolioInterestView

# Guide: InterestEventRepo
class InterestEventRepo:
    """Repository alias for InterestEvent data access — matches naming guide."""
    @staticmethod
    def findByPeriod(project_id, period):
        from projects.models import InterestEvent
        from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
        trunc_fn = TruncDate
        if period == 'weekly':
            trunc_fn = TruncWeek
        elif period == 'monthly':
            trunc_fn = TruncMonth
        return InterestEvent.objects.filter(project_id=project_id).annotate(period=trunc_fn('occurred_at'))

    @staticmethod
    def countByType(project_id):
        from projects.models import InterestEvent
        views = InterestEvent.objects.filter(project_id=project_id, event_type=InterestEvent.EventType.VIEW).count()
        shortlists = InterestEvent.objects.filter(project_id=project_id, event_type=InterestEvent.EventType.SHORTLIST).count()
        return {'view_count': views, 'shortlist_count': shortlists}


class GenerateEventView(APIView):
    """Generates random view/shortlist events for demo purposes. Called periodically by the frontend."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import django.utils.timezone as tz
        now = tz.now()
        published = InteriorDesignProject.objects.filter(status=InteriorDesignProject.Status.PUBLISHED)
        if not published.exists():
            return Response({'status': 'no published projects'}, status=status.HTTP_200_OK)

        project = random.choice(list(published))
        # Generate 1-3 view events
        num_views = random.randint(1, 3)
        for _ in range(num_views):
            InterestEvent.objects.create(
                project=project,
                event_type=InterestEvent.EventType.VIEW,
                occurred_at=now,
            )
        # 20% chance of a shortlist
        if random.random() < 0.2:
            customers = User.objects.filter(role=User.Role.CUSTOMER)
            if customers.exists():
                cust = random.choice(list(customers))
                try:
                    InterestEvent.objects.create(
                        project=project,
                        customer=cust,
                        event_type=InterestEvent.EventType.SHORTLIST,
                        occurred_at=now,
                    )
                except Exception:
                    pass

        return Response({
            'status': 'ok',
            'project': project.title,
            'views_added': num_views,
        })