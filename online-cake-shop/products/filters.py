# products/filters.py
import django_filters
from .models import Cake

# یک کلاس فیلتر سفارشی برای مدیریت فیلترهای چند مقداری (Comma-separated)
class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass

class CakeFilter(django_filters.FilterSet):
    # این فیلتر به ما اجازه می‌دهد تا بر اساس لیستی از ID های دسته‌بندی فیلتر کنیم
    category__id__in = NumberInFilter(field_name='category__id', lookup_expr='in')
    
    # این فیلتر برای طعم‌ها کار می‌کند
    available_flavors__id__in = NumberInFilter(field_name='available_flavors__id', lookup_expr='in')

    class Meta:
        model = Cake
        fields = {
            'base_price': ['gte', 'lte'], # فیلتر قیمت همچنان به این شکل کار می‌کند
        }