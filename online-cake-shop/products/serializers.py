# products/serializers.py

from rest_framework import serializers
from .models import PartySupply, SupplyType, Color, Theme,WishlistItem,Category, Flavor, Size, Cake, Addon,ProductImage,Review,CakeSizeVariant, Tag
from django.contrib.auth import get_user_model
from django.db import transaction
import json


User = get_user_model()

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name', 'hex_code']

class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = ['id', 'name', 'slug']

class SupplyTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplyType
        fields = ['id', 'name', 'slug']

class PartySupplySerializer(serializers.ModelSerializer):
    # نمایش اطلاعات کامل به جای ID
    type = SupplyTypeSerializer(read_only=True)
    colors = ColorSerializer(many=True, read_only=True)
    themes = ThemeSerializer(many=True, read_only=True)

    class Meta:
        model = PartySupply
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'stock', 
            'image', 'type', 'colors', 'themes'
        ]
class RelaxedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    یک فیلد سفارشی که می‌تواند شناسه‌ها را حتی اگر به صورت رشته ارسال شوند، بپذیرد.
    """
    def to_internal_value(self, data):
        try:
            # تلاش می‌کنیم داده ورودی را به عدد صحیح تبدیل کنیم
            # و سپس آن را به متد اصلی در کلاس پدر پاس می‌دهیم.
            return super().to_internal_value(int(data))
        except (ValueError, TypeError):
            # اگر داده قابل تبدیل به عدد نبود، همان خطای استاندارد را نمایش می‌دهیم.
            self.fail('incorrect_type', data_type=type(data).__name__)

class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(read_only=True, default=0)
    image = serializers.ImageField(required=False, allow_null=True, use_url=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image','is_active','products_count'] # slug اضافه شد
# Serializer برای مدل Flavor
class FlavorSerializer(serializers.ModelSerializer):
    products_using_count = serializers.IntegerField(read_only=True, default=0) # فیلد جدید

    class Meta:
        model = Flavor
        fields = ['id', 'name', 'description', 'is_active', 'products_using_count']

# Serializer برای مدل Size
class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name', 'description', 'estimated_weight_kg','price_modifier', 'is_active']

# Serializer برای مدل Addon
class AddonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Addon
        fields = ['id', 'name', 'description', 'price', 'category', 'image', 'is_active']

# Serializer برای مدل Cake (کمی پیچیده‌تر به خاطر روابط)
class ProductImageSerializer(serializers.ModelSerializer): # <--- سریالایزر جدید
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text'] # فیلدهایی که می‌خواهید در API باشند
        read_only_fields = ['id'] # معمولا ID فقط خواندنی است
        


class CakeSizeVariantSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    class Meta:
        model = CakeSizeVariant
        fields = ['id', 'size', 'price_modifier', 'estimated_weight_kg_override', 
                  'sku_variant', 'stock_quantity', 'is_active_for_product']

class CommaSeparatedPKField(serializers.Field):
    """
    یک فیلد سفارشی که رشته‌ای از شناسه‌های جدا شده با کاما را می‌پذیرد
    و آن را به لیستی از آبجکت‌های مدل تبدیل می‌کند.
    """
    def __init__(self, **kwargs):
        # ما queryset مدل مرتبط را به عنوان آرگومان می‌گیریم
        self.queryset = kwargs.pop('queryset')
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        # اگر داده ورودی خالی است، یک لیست خالی برگردان
        if not data:
            return []
        
        try:
            # ۱. رشته را با کاما جدا کرده و به یک لیست از رشته‌ها تبدیل کن
            # ۲. هر آیتم در لیست را به عدد صحیح تبدیل کن
            id_list = [int(item.strip()) for item in data.split(',')]
        except (ValueError, TypeError):
            raise serializers.ValidationError("فرمت داده نامعتبر است. باید رشته‌ای از شناسه‌ها با کاما باشد.")

        # ۳. بررسی کن که تمام شناسه‌ها در دیتابیس موجود باشند
        objects = self.queryset.filter(pk__in=id_list)
        if len(objects) != len(id_list):
            raise serializers.ValidationError("یک یا چند شناسه نامعتبر است.")
        
        return objects

    def to_representation(self, value):
        # این متد برای تبدیل داده به خروجی است که ما اینجا به آن نیاز نداریم
        return [item.pk for item in value.all()]

class TagSerializer(serializers.ModelSerializer):
    """سریالایزر استاندارد برای مدل تگ"""
    class Meta:
        model = Tag
        fields = ['id', 'name']
class TagFindOrCreateSerializer(serializers.Serializer):
    """سریالایزر برای ورودی API جدید ما"""
    names = serializers.ListField(
        child=serializers.CharField(max_length=100, allow_blank=False),
        help_text="لیستی از نام تگ‌ها برای پیدا کردن یا ساختن"
    )

class CakeSerializer(serializers.ModelSerializer):
    # --- بخش خواندنی (برای پاسخ GET) ---
    category = CategorySerializer(read_only=True)
    available_flavors = FlavorSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True) # related_name صحیح را اینجا بگذارید
    size_variants = CakeSizeVariantSerializer(many=True, read_only=True) # related_name صحیح را اینجا بگذارید
    tag_ids = CommaSeparatedPKField(
        queryset=Tag.objects.all(),
        required=False,
        write_only=True,
        source='tags' # به DRF می‌گوییم که این فیلد باید روی رابطه 'tags' مدل کار کند
    )
    tags_details = TagSerializer(source='tags', many=True, read_only=True)

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=True, allow_null=False
    )
    flavor_ids = serializers.PrimaryKeyRelatedField(
        queryset=Flavor.objects.all(), source='available_flavors', many=True, write_only=True, required=False
    )
    # برای دریافت آرایه size_variants به صورت JSON رشته‌ای شده
    size_variants_json = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # فیلدهای مدیریت فایل‌ها
    galleryImageFiles = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    galleryImagesToRemoveIds = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    remove_main_image = serializers.BooleanField(write_only=True, required=False, default=False)
    is_wishlisted = serializers.SerializerMethodField()
    class Meta:
        model = Cake
        fields = [
            'id', 'name', 'slug', 'short_description', 'description', # یا full_description
            'image', 'images', 
            'category', 'available_flavors', 'size_variants',
            'base_price', 'price_type', 'sale_price', 'schedule_sale_enabled', 'sale_start_date', 'sale_end_date',
            'is_active', 'is_featured', 
            'ingredients_text', 'nutrition_info_text', 'allergen_info_text',
             'meta_title',
            'meta_description',
            'meta_keywords',
            'average_rating', 'review_count', 'created_at', 'updated_at', 'tag_ids','tags_details',
            'is_wishlisted',
            
            # فیلدهای فقط نوشتنی
            'category_id', 'flavor_ids', 'size_variants_json',
           'galleryImageFiles', 
            'galleryImagesToRemoveIds', 'remove_main_image',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'average_rating', 'review_count', 'images', 'category', 'available_flavors', 'size_variants']
    def get_is_wishlisted(self, obj: Cake) -> bool:
        """
        بررسی می‌کند که آیا کاربر فعلی این محصول را به علاقه‌مندی‌ها اضافه کرده است یا خیر.
        """
        user = self.context.get('request').user
        if user and user.is_authenticated:
            return WishlistItem.objects.filter(user=user, product=obj).exists()
        return False
    @transaction.atomic
    def create(self, validated_data):
        # جدا کردن تمام داده‌های روابط چند-به-چند و پیچیده
        tags_data = validated_data.pop('tags', [])
        flavors_data = validated_data.pop('available_flavors', [])
        size_variants_json_str = validated_data.pop('size_variants_json', '[]')
        # gallery_images_upload = validated_data.pop('gallery_images_upload', []) # مثال

        # ساخت آبجکت اصلی با فیلدهای ساده
        cake = super().create(validated_data)

        # حالا برقراری روابط
        if tags_data:
            cake.tags.set(tags_data)
        if flavors_data:
            cake.available_flavors.set(flavors_data)
        
        # پردازش size_variants
        if size_variants_json_str:
            size_variants_data = json.loads(size_variants_json_str)
            for sv_data in size_variants_data:
                size_id = sv_data.pop('size')
                CakeSizeVariant.objects.create(cake=cake, size_id=size_id, **sv_data)

        return cake

    @transaction.atomic
    def update(self, instance, validated_data):
     
        request = self.context.get("request")


        # --- START: لاگ‌های جدید برای عیب‌یابی ---
        print("\n--- DEBUG: Inside Serializer Update Method ---")
        if request:
            # --- START: بخش اصلاح شده ---
            # ۱. از کلید صحیح 'gallery_images_upload' برای خواندن فایل‌ها استفاده می‌کنیم
            gallery_files_to_add = request.FILES.getlist('gallery_images_upload')
            
            # ۲. از کلید صحیح 'gallery_images_to_remove_ids' برای خواندن ID ها استفاده می‌کنیم
            ids_to_remove_str = request.data.getlist('gallery_images_to_remove_ids', [])
            ids_to_remove = [int(id_str) for id_str in ids_to_remove_str if id_str]

            print(f"DEBUG: Found {len(gallery_files_to_add)} new files to upload.")
            print(f"DEBUG: Found {len(ids_to_remove)} IDs to remove.")
            # --- END: بخش اصلاح شده ---

            # حذف تصاویری که کاربر مشخص کرده است
            if ids_to_remove:
                ProductImage.objects.filter(id__in=ids_to_remove, cake=instance).delete()
                print(f"SUCCESS: Deleted images with IDs: {ids_to_remove}")

            # افزودن تصاویر جدید به گالری
            if gallery_files_to_add:
                for image_file in gallery_files_to_add:
                    ProductImage.objects.create(cake=instance, image=image_file)
                print(f"SUCCESS: Added {len(gallery_files_to_add)} new images.")
                
                
                
                
        if request and 'tag_ids' in request.data:
           
            tags_data = validated_data.pop('tag_ids', [])
            instance.tags.set(tags_data)
            print("۵. دستور `set()` برای تگ‌ها با موفقیت اجرا شد.")
        if 'available_flavors' in validated_data:
            flavors_data = validated_data.pop('available_flavors')
            instance.available_flavors.set(flavors_data)
            
        if 'size_variants_json' in validated_data:
            size_variants_json_str = validated_data.pop('size_variants_json')
            new_size_variants_data = json.loads(size_variants_json_str)
            instance.size_variants.all().delete() 
            for sv_data in new_size_variants_data:
                size_id = sv_data.pop('size')
                sv_data.pop('id', None) 
                CakeSizeVariant.objects.create(cake=instance, size_id=size_id, **sv_data)

        instance = super().update(instance, validated_data)

        return instance


class UserReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name'] # فیلدهایی که می‌خواهید از کاربر نمایش دهید
        read_only_fields = fields # چون فقط برای نمایش است

class ReviewSerializer(serializers.ModelSerializer):
    # نمایش اطلاعات کاربر به صورت nested و فقط خواندنی
    user = UserReviewSerializer(read_only=True)
    # product = serializers.PrimaryKeyRelatedField(read_only=True) # یا نمایش ندهیم

    class Meta:
        model = Review
        fields = [
            'id',
            'user',           # آبجکت کاربر (فقط خواندنی)
            'product',        # آیدی محصول (فقط خواندنی - معمولا لازم نیست در لیست باشد)
            'rating',         # قابل نوشتن و خواندن
            'comment',        # قابل نوشتن و خواندن
            'created_at',     # فقط خواندنی
        ]
        read_only_fields = [
            'id',
            'user',
            'product',        # چون در view ست می‌شود
            'created_at'
        ]

        # می‌توانید ولیدیشن اضافه کنید، مثلا مطمئن شوید rating بین ۱ تا ۵ است
        # (هرچند مدل جنگو هم این را کنترل می‌کند)
        # def validate_rating(self, value):
        #     if not 1 <= value <= 5:
        #         raise serializers.ValidationError(_("Rating must be between 1 and 5."))
        #     return value

class ProductMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cake
        fields = ['id', 'name', 'slug', 'image', 'base_price'] # فیلدهای لازم برای کارت محصول

class WishlistItemSerializer(serializers.ModelSerializer):
    # از سریالایزر تودرتو برای نمایش اطلاعات کامل محصول استفاده می‌کنیم
    product = ProductMiniSerializer(read_only=True)
    # برای افزودن آیتم، فقط ID محصول را می‌گیریم
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Cake.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'created_at']
        read_only_fields = ['id', 'product', 'created_at']

    def create(self, validated_data):
        # کاربر را از درخواست می‌گیریم و به صورت خودکار به آیتم اضافه می‌کنیم
        user = self.context['request'].user
        product = validated_data['product']
        
        # جلوگیری از افزودن آیتم تکراری
        wishlist_item, created = WishlistItem.objects.get_or_create(user=user, product=product)
        
        if not created:
            # اگر آیتم از قبل وجود داشت، می‌توانید خطا بدهید یا همان را برگردانید
            # در اینجا ما همان آیتم موجود را برمی‌گردانیم
            pass
            
        return wishlist_item