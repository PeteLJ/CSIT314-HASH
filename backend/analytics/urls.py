from django.urls import path
from . import views

urlpatterns = [
    path('analytics/portfolio/', views.PortfolioInterestView.as_view(), name='portfolio-interest'),
    path('analytics/trend/<int:pk>/', views.TrendChartView.as_view(), name='trend-chart'),
    path('analytics/generate-event/', views.GenerateEventView.as_view(), name='generate-event'),
    path('projects/<int:pk>/view-count/', views.ViewCountView.as_view(), name='project-view-count'),
    path('projects/<int:pk>/shortlist-count/', views.ShortlistCountView.as_view(), name='project-shortlist-count'),
]