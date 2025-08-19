# products/admin_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
# ViewSet هایی که در مرحله قبل ساختید را ایمپورت کنید
from .views import TagViewSet,AdminCakeViewSet, AdminCategoryViewSet, AdminFlavorViewSet, AdminSizeViewSet

router = DefaultRouter()
# ثبت ViewSet ها در روتر
router.register(r'cakes', AdminCakeViewSet, basename='admin-cake')
router.register(r'categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'flavors', AdminFlavorViewSet, basename='admin-flavor')
router.register(r'sizes', AdminSizeViewSet, basename='admin-size')
router.register(r'tags', TagViewSet, basename='tag')


urlpatterns = [
    path('', include(router.urls)),
]

# URL های تولید شده:
# /cakes/, /cakes/{pk}/
# /categories/, /categories/{pk}/
# /flavors/, /flavors/{pk}/
# /sizes/, /sizes/{pk}/
# (همه نسبت به پیشوندی که در مرحله بعد در config/urls.py تعریف می‌کنیم)