# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r'', views.OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('cart/items/<int:pk>/', views.CartItemViewSet.as_view({
        'patch': 'partial_update', # درخواست PATCH به این آدرس
        'delete': 'destroy'        # درخواست DELETE به این آدرس
    }), name='cart-item-detail'),
    # !! یادتان نرود کد دیباگ موقت را حذف کنید !!
    # path('debug-resolve/', views.debug_resolve_order_post, name='debug_resolve_order_post'),
]