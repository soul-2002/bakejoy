# products/views.py
from django.db.models import Avg, Count # برای محاسبه میانگین و تعداد
from rest_framework import viewsets, permissions , mixins,filters 
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Review, Category, Flavor, Size, Cake, Addon,Tag,WishlistItem,PartySupply, SupplyType, Color, Theme
from .serializers import (PartySupplySerializer,
    CategorySerializer,
    FlavorSerializer,
    SizeSerializer,
    CakeSerializer,
    AddonSerializer,
    ReviewSerializer,
    TagSerializer, TagFindOrCreateSerializer,WishlistItemSerializer,SupplyTypeSerializer, ColorSerializer, ThemeSerializer
    )
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser  # برای آپلود فایل/تصویر
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from django.contrib.contenttypes.models import ContentType

# مدل‌های لازم را از اپلیکیشن orders ایمپورت کنید
from orders.models import Order, OrderItem
from .models import Cake
# سریالایزر مناسب برای نمایش محصول را ایمپورت کنید
from .serializers import ProductMiniSerializer # یا هر سریالایزر دیگری که دارید

class PartySupplyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    لیست لوازم جشن را با قابلیت فیلتر بر اساس نوع، رنگ و تم نمایش می‌دهد.
    """
    queryset = PartySupply.objects.filter(is_active=True)
    serializer_class = PartySupplySerializer
    filter_backends = [DjangoFilterBackend] # فعال‌سازی فیلتر
    
    # تعریف فیلدهایی که می‌توان بر اساس آنها فیلتر کرد
    filterset_fields = {
        'type__slug': ['exact'], # فیلتر بر اساس اسلاگ نوع: ?type__slug=candles
        'colors__id': ['in'],    # فیلتر بر اساس ID رنگ: ?colors__id__in=1,2
        'themes__slug': ['in'],  # فیلتر بر اساس اسلاگ تم: ?themes__slug__in=gold,unicorn
        
    }
    permission_classes = [permissions.AllowAny]
class SupplyFilterOptionsView(APIView):
    """
    لیست تمام گزینه‌های موجود برای فیلتر کردن لوازم جشن را برمی‌گرداند.
    """
    permission_classes = [permissions.AllowAny] # برای کاربران مهمان هم قابل مشاهده است

    def get(self, request, *args, **kwargs):
        types = SupplyType.objects.all()
        colors = Color.objects.all()
        themes = Theme.objects.all()

        data = {
            'types': SupplyTypeSerializer(types, many=True).data,
            'colors': ColorSerializer(colors, many=True).data,
            'themes': ThemeSerializer(themes, many=True).data,
        }
        return Response(data)
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    # permission_classes = [...] # دسترسی‌ها را اینجا مشخص کنید

    @action(detail=False, methods=['post'], url_path='find-or-create')
    def find_or_create(self, request):
        input_serializer = TagFindOrCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        
        tag_names = input_serializer.validated_data['names']
        tag_ids = []

        for name in tag_names:
            # --- مرحله کلیدی: نرمال‌سازی ورودی ---
            # 1. حذف فاصله‌های اضافی از ابتدا و انتهای نام
            normalized_name = name.strip() 
            
            # اگر پس از حذف فاصله‌ها، رشته خالی بود، آن را نادیده بگیر
            if not normalized_name:
                continue

            # حالا با نام نرمال‌شده در دیتابیس جستجو و ساخت را انجام بده
            tag_object, created = Tag.objects.get_or_create(name=normalized_name)
            
            # این لاگ‌ها برای دیباگ کردن بسیار مفید هستند
            if created:
                print(f"تگ جدید ساخته شد: '{normalized_name}' با شناسه {tag_object.id}")
            else:
                print(f"تگ موجود پیدا شد: '{normalized_name}' با شناسه {tag_object.id}")

            tag_ids.append(tag_object.id)

        return Response({'tag_ids': tag_ids}, status=status.HTTP_200_OK)
class TopSellingProductsView(APIView):
    """
    لیستی از پرفروش‌ترین محصولات (در حال حاضر فقط کیک‌ها) را برمی‌گرداند.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        # ۱. پارامتر limit را از URL بگیرید
        try:
            limit = int(request.query_params.get('limit', 5))
            if limit <= 0: limit = 5
        except (ValueError, TypeError):
            limit = 5

        # ۲. ContentType مربوط به مدل Cake را پیدا کنید
        try:
            cake_content_type = ContentType.objects.get_for_model(Cake)
        except ContentType.DoesNotExist:
            return Response({"error": "Content type for Cake not found."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # ۳. وضعیت‌هایی که نشانه فروش قطعی هستند را مشخص کنید
        successful_statuses = [
            Order.OrderStatusChoices.PROCESSING,
            Order.OrderStatusChoices.SHIPPED,
            Order.OrderStatusChoices.DELIVERED,
        ]

        # ۴. آیتم‌های سفارش فروخته شده که از نوع کیک هستند را پیدا کرده،
        # بر اساس شناسه محصول گروه‌بندی کرده و جمع تعداد فروش را محاسبه کنید.
        top_products_query = OrderItem.objects.filter(
            content_type=cake_content_type,
            order__status__in=successful_statuses
        ).values(
            'object_id' # object_id همان شناسه کیک (cake.id) است
        ).annotate(
            total_sold=Sum('quantity') # جمع تعداد فروش هر محصول
        ).order_by('-total_sold')

        # ۵. نتایج را بر اساس limit محدود کنید
        top_products_data = top_products_query[:limit]

        # ۶. آبجکت‌های کامل کیک را بر اساس ID های پرفروش استخراج کنید
        top_product_ids = [item['object_id'] for item in top_products_data]
        products = Cake.objects.filter(id__in=top_product_ids)
        
        # ۷. داده‌های فروش را به آبجکت‌های کیک اضافه کنید تا در سریالایزر قابل استفاده باشند
        sales_map = {item['object_id']: item['total_sold'] for item in top_products_data}
        for product in products:
            product.total_sold = sales_map.get(product.id, 0)
            
        # مرتب‌سازی نهایی لیست آبجکت‌ها بر اساس میزان فروش
        sorted_products = sorted(products, key=lambda p: p.total_sold, reverse=True)

        # ۸. سریالایز کردن و برگرداندن پاسخ
        # **نکته مهم:** باید به سریالایزر خود یک فیلد 'total_sold' اضافه کنید.
        serializer = ProductMiniSerializer(sorted_products, many=True, context={'request': request})
        
        return Response(serializer.data, status=status.HTTP_200_OK)

class ReviewListCreateAPIView(generics.ListCreateAPIView):
    """
    API view to retrieve list of reviews for a specific cake or create a new review.
    """
    serializer_class = ReviewSerializer
    # دسترسی: همه می‌توانند لیست را ببینند (GET)، فقط کاربران لاگین کرده می‌توانند نظر ثبت کنند (POST)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_product(self):
        """Helper method to get the cake object based on URL kwargs."""
        # فرض می‌کنیم در URL از slug کیک استفاده می‌کنید
        # اگر از pk استفاده می‌کنید، lookup_field را تغییر دهید
        lookup_url_kwarg = self.lookup_url_kwarg or 'cake_slug' # یا 'cake_pk'
        lookup_value = self.kwargs[lookup_url_kwarg]
        filter_kwargs = {f'{Cake._meta.get_field("slug").name}__iexact': lookup_value} # یا pk=lookup_value
        cake = get_object_or_404(Cake, **filter_kwargs)
        return cake

    def get_queryset(self):
        """
        Filter reviews to only those belonging to the specific cake identified by URL.
        """
        cake = self.get_product()
        return Review.objects.filter(product=cake).order_by('-created_at') # جدیدترین‌ها اول

    def perform_create(self, serializer):
        """
        Set the user and product automatically when creating a review.
        Prevent duplicate reviews by the same user for the same product.
        Update the cake's average rating and review count.
        """
        cake = self.get_product()
        user = self.request.user

        # 1. جلوگیری از ثبت نظر تکراری
        if Review.objects.filter(product=cake, user=user).exists():
            raise ValidationError("شما قبلاً برای این محصول نظر ثبت کرده‌اید.")

        # 2. ذخیره نظر با کاربر و محصول صحیح
        review = serializer.save(user=user, product=cake)

        # 3. آپدیت میانگین امتیاز و تعداد نظرات محصول
        # از aggregation استفاده می‌کنیم
        aggregates = Review.objects.filter(product=cake).aggregate(
            avg_rating=Avg('rating'),
            count=Count('id')
        )
        cake.average_rating = aggregates.get('avg_rating') or 0.00
        cake.review_count = aggregates.get('count') or 0
        cake.save(update_fields=['average_rating', 'review_count']) # فقط همین فیلدها آپدیت شوند

# ViewSet برای Category (فقط خواندنی)
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows categories to be viewed.
    """
    queryset = Category.objects.all().order_by('name') # تمام دسته‌بندی‌ها، مرتب شده بر اساس نام
    serializer_class = CategorySerializer
    lookup_field = 'slug' # <--- این خط رو اضافه کنید
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # دسترسی برای همه (پیش‌فرض DRF هم معمولا همینه)

# ViewSet برای Flavor (فقط خواندنی)
class FlavorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows flavors to be viewed.
    """
    queryset = Flavor.objects.all().order_by('name')
    serializer_class = FlavorSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# ViewSet برای Size (فقط خواندنی)
class SizeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows sizes to be viewed.
    """
    queryset = Size.objects.all().order_by('name')
    serializer_class = SizeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# ViewSet برای Addon (فقط خواندنی)
class AddonViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows addons to be viewed.
    """
    # فقط افزودنی‌های فعال رو نمایش بده
    queryset = Addon.objects.filter(is_active=True).order_by('name')
    serializer_class = AddonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 8  # تعداد پیش‌فرض آیتم‌ها در هر صفحه
    page_size_query_param = 'limit' # به DRF می‌گوید که از پارامتر 'limit' برای تعیین اندازه صفحه استفاده کند
    max_page_size = 100 # حداکثر تعدادی که کاربر می‌تواند در هر صفحه درخواست کند


# ViewSet برای Cake (فقط خواندنی)
from .filters import CakeFilter
class CakeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows cakes to be viewed.
    Supports filtering by category_id.
    e.g., /api/v1/products/cakes/?category_id=1
    """
    queryset = Cake.objects.filter(is_active=True).select_related('category')
    serializer_class = CakeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # --- ۲. به جای filterset_fields از filterset_class استفاده کنید ---
    filterset_class = CakeFilter
    
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['created_at', 'base_price', 'average_rating']
    lookup_field = 'slug'
    
    def get_queryset(self):
        return Cake.objects.filter(is_active=True).select_related('category').prefetch_related('available_flavors')
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_to_wishlist(self, request, slug=None): # <--- اصلاح از pk به slug
        """
        یک محصول را به لیست علاقه‌مندی‌های کاربر فعلی اضافه می‌کند.
        """
        # لاگ برای دیباگ
        print(f"--- [LOG] add_to_wishlist action called for slug: '{slug}' by user: {request.user.username} ---")
        
        try:
            product = self.get_object()
            user = request.user
            
            wishlist_item, created = WishlistItem.objects.get_or_create(user=user, product=product)
            
            if created:
                print(f"--- [LOG] Product '{product.name}' ADDED to wishlist for user '{user.username}'.")
                return Response({'status': 'added', 'detail': 'محصول به علاقه‌مندی‌ها اضافه شد.'}, status=status.HTTP_201_CREATED)
            else:
                print(f"--- [LOG] Product '{product.name}' ALREADY EXISTS in wishlist for user '{user.username}'.")
                return Response({'status': 'exists', 'detail': 'این محصول از قبل در لیست علاقه‌مندی‌های شما وجود دارد.'}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"--- [ERROR] in add_to_wishlist: {e}")
            return Response({'detail': 'خطای داخلی سرور رخ داد.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='remove-from-wishlist')
    def remove_from_wishlist(self, request, slug=None): # <--- اصلاح از pk به slug
        """
        یک محصول را از لیست علاقه‌مندی‌های کاربر فعلی حذف می‌کند.
        """
        print(f"--- [LOG] remove_from_wishlist action called for slug: '{slug}' by user: {request.user.username} ---") # لاگ اضافه شد
        
        try:
            product = self.get_object()
            user = request.user
            
            item = WishlistItem.objects.filter(user=user, product=product)
            
            if item.exists():
                item.delete()
                print(f"--- [LOG] Product '{product.name}' REMOVED from wishlist for user '{user.username}'.")
                return Response({'status': 'removed', 'detail': 'محصول از علاقه‌مندی‌ها حذف شد.'}, status=status.HTTP_204_NO_CONTENT)
            else:
                print(f"--- [LOG] Product '{product.name}' NOT FOUND in wishlist for user '{user.username}'.")
                return Response({'status': 'not_found', 'detail': 'این محصول در لیست علاقه‌مندی‌های شما وجود ندارد.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"--- [ERROR] in remove_from_wishlist: {e}")
            return Response({'detail': 'خطای داخلی سرور رخ داد.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @action(detail=True, methods=['get'], url_path='suggested', url_name='suggested-products')
    def suggested_products(self, request, slug=None): # slug از lookup_field می‌آید
        """
        محصولات پیشنهادی برای یک محصول خاص را برمی‌گرداند.
        در حال حاضر، محصولاتی از همان دسته‌بندی (به جز خود محصول) را پیشنهاد می‌دهد.
        """
        try:
            # get_object از lookup_field (یعنی slug) برای پیدا کردن محصول فعلی استفاده می‌کند
            current_product = self.get_object()
        except Cake.DoesNotExist: # یا Http404 اگر get_object آن را raise کند
            return Response({"detail": "محصول یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        if not current_product.category:
            # اگر محصول دسته‌بندی ندارد یا دسته‌بندی آن null است، لیست خالی برگردان
            return Response([], status=status.HTTP_200_OK)

        # محصولات دیگر از همان دسته‌بندی، که فعال هستند، به جز محصول فعلی
        # می‌توانید برای تنوع بیشتر از order_by('?') استفاده کنید یا بر اساس تاریخ ایجاد و ...
        # مثلاً ۴ محصول پیشنهادی
        suggested_cakes = Cake.objects.filter(
            category=current_product.category,
            is_active=True
        ).exclude(pk=current_product.pk).order_by('-created_at')[:4] # جدیدترین‌ها از همان دسته

        # اگر تعداد محصولات پیشنهادی در همان دسته کم بود، می‌توانید منطق بیشتری اضافه کنید
        # مثلاً اگر suggested_cakes.count() < 4 بود، چند محصول تصادفی دیگر از دسته‌های دیگر اضافه کنید.
        # اما برای شروع، همین کافی است.

        # از همان سریالایزر ViewSet برای سریالایز کردن محصولات پیشنهادی استفاده می‌کنیم
        serializer = self.get_serializer(suggested_cakes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
class AdminCakeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin users to perform CRUD operations on Cakes.
    """
    queryset = Cake.objects.all().select_related('category').prefetch_related('available_flavors', 'available_sizes','tags').order_by('-created_at')
    serializer_class = CakeSerializer
    permission_classes = [permissions.IsAdminUser] # فقط دسترسی ادمین
    # اضافه کردن پارسرها برای دریافت فایل (مثل تصویر کیک) در درخواست‌های POST/PUT/PATCH
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_serializer_context(self):
        """
        این متد، آبجکت request را به سریالایزر پاس می‌دهد.
        """
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """
        Deletes multiple Cake instances based on a list of IDs provided in the request body.
        Expects a POST request with a JSON body like: {"ids": [1, 2, 3]}
        """
        product_ids = request.data.get('ids', [])

        if not product_ids or not isinstance(product_ids, list):
            return Response(
                {'detail': 'لطفاً لیستی از شناسه‌های محصولات را برای حذف ارائه دهید.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # اطمینان از اینکه همه ID ها معتبر هستند (می‌تواند عددی یا UUID باشد بسته به مدل شما)
            # در اینجا فرض بر ID عددی است
            valid_ids = [int(pid) for pid in product_ids]
        except ValueError:
            return Response(
                {'detail': 'فرمت شناسه‌های محصولات نامعتبر است. باید عدد باشند.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # استفاده از transaction.atomic برای اطمینان از اینکه یا همه حذف می‌شوند یا هیچکدام
        with transaction.atomic():
            queryset = Cake.objects.filter(id__in=valid_ids)
            deleted_count, _ = queryset.delete()

        if deleted_count > 0:
            return Response(
                {'detail': f'{deleted_count} محصول با موفقیت حذف شدند.'},
                status=status.HTTP_200_OK # یا 204 No Content اگر پاسخی نمی‌خواهید برگردانید
            )
        else:
            # این حالت ممکن است رخ دهد اگر ID ها معتبر نباشند یا محصولات قبلاً حذف شده باشند
            return Response(
                {'detail': 'هیچ محصولی برای حذف با شناسه‌های ارائه شده یافت نشد یا شناسه‌ها نامعتبر بودند.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], url_path='bulk-update-status')
    def bulk_update_status(self, request):
        """
        Updates the is_active status of multiple Cake instances.
        Expects a POST request with a JSON body like: 
        {"ids": [1, 2, 3], "is_active": true} or {"ids": [1, 2, 3], "is_active": false}
        """
        product_ids = request.data.get('ids', [])
        new_is_active_status = request.data.get('is_active') # باید true یا false باشد

        if not product_ids or not isinstance(product_ids, list):
            return Response(
                {'detail': 'لطفاً لیستی از شناسه‌های محصولات را ارائه دهید.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_is_active_status is None or not isinstance(new_is_active_status, bool):
            return Response(
                {'detail': 'لطفاً وضعیت "is_active" معتبری (true یا false) ارائه دهید.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            valid_ids = [int(pid) for pid in product_ids]
        except ValueError:
            return Response(
                {'detail': 'فرمت شناسه‌های محصولات نامعتبر است. باید عدد باشند.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        with transaction.atomic():
            queryset = Cake.objects.filter(id__in=valid_ids)
            updated_count = queryset.update(is_active=new_is_active_status)

        if updated_count > 0:
            status_text = "فعال" if new_is_active_status else "غیرفعال"
            return Response(
                {'detail': f'وضعیت {updated_count} محصول با موفقیت به "{status_text}" تغییر یافت.'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'detail': 'هیچ محصولی برای به‌روزرسانی وضعیت با شناسه‌های ارائه شده یافت نشد یا شناسه‌ها نامعتبر بودند.'},
                status=status.HTTP_404_NOT_FOUND
            )
# (اختیاری) می‌توانید ViewSet های مشابهی برای مدیریت Category, Flavor, Size هم بسازید:
class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    def get_queryset(self):
        return Category.objects.annotate(products_count=Count('cakes')).order_by('name')

class AdminFlavorViewSet(viewsets.ModelViewSet):
    queryset = Flavor.objects.all().order_by('name')
    serializer_class = FlavorSerializer
    permission_classes = [permissions.IsAdminUser]
    def get_queryset(self):
        # فرض می‌کنیم مدل محصول شما (مثلاً Cake) یک ManyToManyField به Flavor به نام 'available_flavors' دارد
        # یا اگر Flavor یک ForeignKey در یک مدل واسط دیگر است، باید بر اساس آن Count کنید.
        # این بخش بستگی به ساختار مدل‌های شما دارد.
        # مثال ساده (اگر مدل Cake یک M2M به نام available_flavors دارد):
        return Flavor.objects.annotate(products_using_count=Count('cakes', distinct=True)).order_by('name')

class AdminSizeViewSet(viewsets.ModelViewSet):
    queryset = Size.objects.all().order_by('estimated_weight_kg')
    serializer_class = SizeSerializer
    permission_classes = [permissions.IsAdminUser]
    

class WishlistViewSet(mixins.CreateModelMixin, 
                      mixins.ListModelMixin,
                      mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    """
    API endpoint for the user's wishlist.
    - GET /wishlist/: Returns a list of the user's wishlist items.
    - POST /wishlist/: Adds a product to the user's wishlist.
    - DELETE /wishlist/{pk}/: Removes an item from the user's wishlist.
    """
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        این ویو باید فقط آیتم‌های علاقه‌مندی کاربر لاگین کرده را برگرداند.
        """
        return WishlistItem.objects.filter(user=self.request.user).select_related('product')
        
    def perform_create(self, serializer):
        # کاربر به صورت خودکار از درخواست گرفته می‌شود
        serializer.save(user=self.request.user)


