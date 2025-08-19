# orders/admin_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ( # اطمینان از اینکه views از همین اپلیکیشن ('.') ایمپورت می‌شوند
    AdminOrderViewSet,
    AdminDashboardStatsView,
    SMSTemplateViewSet,
    NotificationLogViewSet,
    SalesDataAPIView,
    AdminSmsStatsView,
    SmsCreditBalanceView,
)
from products.views import TopSellingProductsView

router = DefaultRouter()
# اینها مسیرهای نسبی به پیشوندی خواهند بود که در urls.py اصلی پروژه برای این فایل تعریف می‌شود
router.register(r'list', AdminOrderViewSet, basename='admin-order')
router.register(r'sms-templates', SMSTemplateViewSet, basename='admin-sms-template')
router.register(r'sms-logs', NotificationLogViewSet, basename='admin-sms-log') # یا 'notification-logs'

urlpatterns = [
    path('sms-stats/', AdminSmsStatsView.as_view(), name='admin-sms-stats'),
    
    # این مسیر نسبت به پیشوند کلی admin_urls خواهد بود
    path('dashboard-stats/', AdminDashboardStatsView.as_view(), name='admin-dashboard-stats'),
    path('top-selling-products/', TopSellingProductsView.as_view(), name='admin-top-selling-products'), # <--- مسیر جدید
    path('sales-chart-data/', SalesDataAPIView.as_view(), name='admin-sales-chart-data'), # <--- مسیر جدید
    path('sms-credit-balance/', SmsCreditBalanceView.as_view(), name='admin-sms-credit-balance'),

    # این خط، URL های روتر را به ریشه این فایل admin_urls.py اضافه می‌کند
    path('', include(router.urls)),
]