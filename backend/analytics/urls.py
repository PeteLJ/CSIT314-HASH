from django.urls import path
from . import views

urlpatterns = [
    path('analytics/portfolio/', views.PortfolioInterestView.as_view(), name='portfolio-interest'),
    path('analytics/trend/<int:pk>/', views.TrendChartView.as_view(), name='trend-chart'),
]