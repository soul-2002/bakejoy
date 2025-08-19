# products/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    # ... ویوهای قبلی شما مثل CakeViewSet یا CategoryList ...
    ReviewListCreateAPIView,WishlistViewSet,SupplyFilterOptionsView
    # <-- ویو جدید نظرات را ایمپورت کنید
    # ...
)# ViewSet ها رو از views.py همین اپلیکیشن ایمپورت می‌کنیم

app_name = 'products'
# یک روتر برای ثبت خودکار URL های ViewSet ها ایجاد می‌کنیم
router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'flavors', views.FlavorViewSet, basename='flavor')
router.register(r'sizes', views.SizeViewSet, basename='size')
router.register(r'cakes', views.CakeViewSet, basename='cake')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'supplies', views.PartySupplyViewSet, basename='supply')



# الگوهای URL برای این اپلیکیشن شامل URL های تولید شده توسط روتر است
urlpatterns = [
    
    path('cakes/<slug:cake_slug>/reviews/', ReviewListCreateAPIView.as_view(), name='cake-review-list-create'),
    path('supplies/filters/', SupplyFilterOptionsView.as_view(), name='supply-filters'),
    path('', include(router.urls)),
]

