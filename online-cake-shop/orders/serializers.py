# orders/serializers.py

from rest_framework import serializers
from django.db import transaction
# ایمپورت ValidationError برای استفاده در اعتبارسنجی
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from products.serializers import CakeSerializer, PartySupplySerializer
from users.serializers import AddressSerializer
# ایمپورت مدل‌ها
from .models import CakeSizeVariant,OrderStatusLog,InternalOrderNote,Order, OrderItem, CustomDesign, OrderAddon, Transaction, Notification,SMSTemplate
from products.models import Cake, Flavor, PartySupply, Size, Addon
from users.models import Address,CustomUser

# --- Serializer های ساده‌تر ---

class CustomDesignSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomDesign
        fields = ['design_file', 'notes']


class OrderAddonSerializer(serializers.ModelSerializer):
    addon_id = serializers.PrimaryKeyRelatedField(queryset=Addon.objects.filter(is_active=True), source='addon')

    class Meta:
        model = OrderAddon
        fields = ['addon_id', 'quantity']


# --- Serializer های اصلی ---
class TransactionSerializer(serializers.ModelSerializer):
    # اضافه کردن فیلد نمایشی برای وضعیت
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True, allow_null=True) # <--- اضافه شد

    class Meta:
        model = Transaction
        fields = [
            'id',
            'status',           # کد وضعیت: PENDING, SUCCESS, FAILED
            'status_display',   # متن وضعیت: Pending, Successful, Failed
            'amount',           # مبلغ (به ریال)
            'ref_id',           # کد رهگیری نهایی زرین‌پال <-- مهم
            'gateway_reference_id', # کد Authority اولیه
            'created_at',       # زمان ایجاد تراکنش
            'gateway_response', # پاسخ درگاه (اختیاری برای دیباگ)
            'payment_method',   # روش پرداخت (اختیاری)
             'payment_method_display',
        ]
        # در این سناریو (نمایش داخل سفارش) همه فیلدها فقط خواندنی هستند
        read_only_fields = fields

class ProductMiniSerializer(serializers.ModelSerializer):
    """فقط اطلاعات ضروری محصول برای نمایش در لیست‌ها یا آیتم‌ها"""
    class Meta:
        model = Cake # یا Product
        fields = ['id', 'name', 'slug', 'base_price', 'image'] # slug برای لینک دادن؟
        read_only_fields = fields

class FlavorSerializer(serializers.ModelSerializer):
    """سریالایزر ساده برای طعم"""
    class Meta:
        model = Flavor
        fields = ['id', 'name']
        read_only_fields = fields

class SizeSerializer(serializers.ModelSerializer):
    """سریالایزر ساده برای اندازه"""
    class Meta:
        model = Size
        fields = ['id', 'name', 'estimated_weight_kg'] # وزن برای نمایش احتمالی؟
        read_only_fields = fields

class OrderItemReadSerializer(serializers.ModelSerializer):
    """
    آیتم سفارش را با جزئیات کامل محصول (کیک یا لوازم جشن) نمایش می‌دهد.
    """
    # این فیلد جدید، جزئیات محصول را به صورت داینامیک نمایش خواهد داد
    product = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product', # <-- فیلد جدید جایگزین فیلدهای قبلی شد
            'quantity',
            'notes',
            'price_at_order',
            'total_price', # پراپرتی مدل
        ]

    def get_product(self, obj: OrderItem):
        """
        بر اساس نوع محصول در OrderItem، از سریالایزر مناسب استفاده می‌کند.
        """
        product_instance = obj.content_object

        if isinstance(product_instance, Cake):
            # اگر محصول کیک است، از سریالایزر کیک استفاده می‌کنیم
            # و اطلاعات طعم و سایز را هم به آن اضافه می‌کنیم
            context = self.context
            cake_data = CakeSerializer(product_instance, context=context).data
            
            # افزودن اطلاعات طعم و سایز به صورت دستی
            cake_data['flavor'] = FlavorSerializer(obj.flavor).data if obj.flavor else None
            cake_data['size'] = SizeSerializer(obj.size_variant.size).data if obj.size_variant and obj.size_variant.size else None
            
            return cake_data
            
        elif isinstance(product_instance, PartySupply):
            # اگر محصول لوازم جشن است، از سریالایزر مربوط به خودش استفاده می‌کنیم
            return PartySupplySerializer(product_instance, context=self.context).data
            
        # اگر محصول به هر دلیلی حذف شده یا در دسترس نیست
        return None

class OrderItemSerializer(serializers.ModelSerializer):
    cake_id = serializers.PrimaryKeyRelatedField(queryset=Cake.objects.filter(is_active=True), source='cake')
    flavor_id = serializers.PrimaryKeyRelatedField(queryset=Flavor.objects.all(), source='flavor')
    size_id = serializers.PrimaryKeyRelatedField(
        queryset=Size.objects.all(),
        source='size_variant.size'
    )
    custom_design = CustomDesignSerializer(required=False, allow_null=True)
    # 'addons' فیلد فقط برای خواندن اطلاعات در پاسخ GET استفاده می‌شود (اگر بخواهیم)
    # برای نوشتن، از فیلد write_only در پایین استفاده می‌کنیم
    addons_input = OrderAddonSerializer(many=True, required=False, write_only=True, source='addons') # اسمش رو عوض کردیم

    class Meta:
        model = OrderItem
        fields = [
            'id', # برای خواندن
            'cake_id',
            'flavor_id',
            'size_id',
            'quantity',
            'custom_design', # برای خواندن و نوشتن (اگر آپلود فایل همینجا باشد)
            # 'addons',      # این فیلد برای خواندن استفاده می‌شود (نمایش افزودنی‌های ثبت شده)
            'addons_input',# این فیلد برای نوشتن استفاده می‌شود
            'price_at_order', # فقط خواندنی
            'notes',
        ]
        read_only_fields = ('id', 'price_at_order')
        # اگر بخواهیم در پاسخ GET، اطلاعات کامل کیک، طعم و ... رو هم نشون بدیم
        # می‌توانیم depth = 1 رو به Meta اضافه کنیم یا فیلدهای سریالایزر تو در تو تعریف کنیم (فعلاً ساده نگه می‌داریم)

class OrderItemAddSerializer(serializers.Serializer):
    # product = serializers.PrimaryKeyRelatedField(
    #     queryset=Cake.objects.filter(is_active=True),
    #     required=True,
    #     source='cake'
    # )
    product_id = serializers.IntegerField(write_only=True)
    product_type = serializers.ChoiceField(
        choices=['cake', 'partysupply'], # نام مدل‌ها با حروف کوچک
        write_only=True
    )
    quantity = serializers.IntegerField(min_value=1, required=True)
    flavor = serializers.PrimaryKeyRelatedField(
        queryset=Flavor.objects.all(),
        required=False, # طعم می‌تواند برای برخی محصولات اختیاری باشد
        allow_null=True
    )
    
    size_variant = serializers.PrimaryKeyRelatedField(
        queryset=CakeSizeVariant.objects.all(), # کوئری به مدل واسط CakeSizeVariant
        required=False, # اگر محصولی اندازه ندارد، این می‌تواند اختیاری باشد
        allow_null=True
    )

    customization_notes = serializers.CharField(required=False, allow_blank=True, source='notes', allow_null=True)

    # اعتبار سنجی سازگاری طعم و متغیر اندازه با محصول
    def validate(self, data):
        """
        محصول را اعتبارسنجی کرده و سازگاری گزینه‌ها را (فقط برای کیک) بررسی می‌کند.
        """
        product_type_str = data.get('product_type')
        product_id = data.get('product_id')
        
        # ۱. پیدا کردن مدل و آبجکت محصول
        if product_type_str == 'cake':
            model_class = Cake
        elif product_type_str == 'partysupply':
            model_class = PartySupply
        else:
            # این خطا معمولاً رخ نمی‌دهد چون ChoiceField جلوی آن را می‌گیرد
            raise serializers.ValidationError("نوع محصول نامعتبر است.")
        
        try:
            product_instance = model_class.objects.get(id=product_id, is_active=True)
            # آبجکت محصول را به داده‌های اعتبارسنجی شده اضافه می‌کنیم تا در view از آن استفاده کنیم
            data['content_object'] = product_instance 
        except model_class.DoesNotExist:
            raise serializers.ValidationError(f"محصولی با شناسه {product_id} یافت نشد یا فعال نیست.")

        # ۲. اگر محصول از نوع کیک بود، سازگاری طعم و اندازه را بررسی کن
        if isinstance(product_instance, Cake):
            flavor = data.get('flavor')
            size_variant = data.get('size_variant')

            # بررسی سازگاری طعم
            if flavor and hasattr(product_instance, 'available_flavors') and flavor not in product_instance.available_flavors.all():
                raise serializers.ValidationError({
                    "flavor": f"طعم '{flavor.name}' برای کیک '{product_instance.name}' موجود نیست."
                })
            
            # بررسی سازگاری اندازه
            if size_variant and size_variant.cake != product_instance:
                raise serializers.ValidationError({
                    "size_variant": "این اندازه برای کیک انتخاب شده معتبر نیست."
                })

        return data
class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser # یا User اگر از get_user_model استفاده می‌کنید
        fields = ['id', 'username', 'avatar', 'first_name', 'last_name', 'phone','email','date_joined'] # اضافه کردن فیلد avatar
        # اگر می‌خواهید نام و نام خانوادگی هم باشد:
        # fields = ['id', 'username', 'first_name', 'last_name', 'avatar']
        read_only_fields = fields # تمام فیلدها در این سریالایزر تودرتو فقط خواندنی هستند

class OrderStatusLogSerializer(serializers.ModelSerializer):
    # changed_by = UserForNoteSerializer(read_only=True) # نمایش اطلاعات کاربر تغییر دهنده
    # اگر می‌خواهید فقط نام کاربری را نشان دهید:
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True, allow_null=True)
    
    # برای نمایش لیبل فارسی وضعیت جدید
    new_status_display = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusLog
        fields = [
            'id', 
            'timestamp', 
            'new_status',           # کلید وضعیت جدید (مثلاً 'PROCESSING')
            'new_status_display',   # لیبل فارسی وضعیت جدید (مثلاً 'در حال پردازش')
            # 'old_status',         # اگر فیلد وضعیت قبلی را در مدل دارید
            'changed_by_username',  # نام کاربری کسی که تغییر را اعمال کرده
            'notes'                 # توضیحات اضافی
        ]
        read_only_fields = fields # این سریالایزر فقط برای خواندن است

    def get_new_status_display(self, obj):
        # این تابع لیبل فارسی وضعیت را از Order.OrderStatusChoices می‌گیرد
        # مطمئن شوید Order.OrderStatusChoices در مدل Order شما به درستی تعریف شده است.
        return dict(Order.OrderStatusChoices.choices).get(obj.new_status, obj.new_status)
class OrderSerializer(serializers.ModelSerializer):
    # --- فیلدهای خواندنی ---
    user = UserNestedSerializer(read_only=True)
    items = OrderItemReadSerializer(many=True, read_only=True)
    transactions = TransactionSerializer(many=True, read_only=True) # <-- **اضافه شد: نمایش تراکنش‌ها**
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    address = AddressSerializer(read_only=True) # <-- **فعال شد: نمایش آبجکت کامل آدرس**
    delivery_datetime_read = serializers.DateTimeField(source='delivery_datetime', read_only=True, format="%Y-%m-%d %H:%M") # <-- **اضافه شد: نمایش زمان تحویل** (فرمت اختیاری)
    notes_read = serializers.CharField(source='notes', read_only=True) # <-- **اضافه شد: نمایش یادداشت‌ها**
    # فیلدهای status و total_price قبلاً read_only بودند و درست است
    # status = serializers.CharField(read_only=True) # نیازی به تعریف مجدد نیست اگر در fields باشد
    # total_price = serializers.DecimalField(...) # نیازی به تعریف مجدد نیست اگر در fields باشد
    status_logs = OrderStatusLogSerializer(many=True, read_only=True) # نام related_name شما status_logs است

    # --- فیلدهای نوشتنی (برای checkout) ---
    address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(),
        source='address',
        write_only=True,
        required=False, # در آپدیت checkout ممکن است لازم نباشد اگر قبلا تعیین شده
        allow_null=True
    )
    delivery_datetime = serializers.DateTimeField(
        required=False, # در آپدیت checkout ممکن است لازم نباشد
        allow_null=True,
        write_only=True
     )
    # notes برای نوشتن هم باید باشد
    notes = serializers.CharField(required=False, allow_blank=True, write_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'user',
            'address',              # <-- آبجکت خواندنی آدرس
            'status',
            'status_display',
            'total_price',
            'delivery_datetime_read', # <-- زمان تحویل خواندنی
            'notes_read',             # <-- یادداشت خواندنی
            'created_at',
            'updated_at',
            'items',                # <-- لیست خواندنی آیتم‌ها
            'transactions',         # <-- **اضافه شد: لیست خواندنی تراکنش‌ها**

            # فیلدهای فقط نوشتنی برای استفاده در آپدیت checkout
            'address_id',
            'delivery_datetime',
            'notes',      
            'shipping_method',
            'status_logs'
            
            # <-- فیلد نوشتنی یادداشت
        ]
        # نیازی به read_only_fields نیست وقتی اکثر فیلدها را صریحاً read_only=True تعریف کرده‌ایم
        # اما برای اطمینان می‌توان نوشت:
        read_only_fields = (
            'id', 'user', 'address', 'status', 'status_display',
            'total_price', 'delivery_datetime_read', 'notes_read',
            'created_at', 'updated_at', 'items', 'transactions'
        )

    # validate_address_id برای چک کردن مالکیت آدرس هنگام نوشتن لازم است
    def validate_address_id(self, address):
        # اگر کاربر ناشناس بود یا context وجود نداشت
        if not self.context['request'].user.is_authenticated:
             raise serializers.ValidationError("Authentication required.") # یا خطای مناسب دیگر

        request_user = self.context['request'].user
        # اجازه بده ادمین هر آدرسی را انتخاب کند (اگر لازم است)
        # if request_user.is_staff:
        #     return address
        if address.user != request_user:
            raise serializers.ValidationError(_("Selected address does not belong to the current user."))
        return address

class AdminOrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']
class OrderCheckoutUpdateSerializer(serializers.ModelSerializer):
    # این فیلدها در این مرحله اجباری هستند
    address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(), # کوئری ست می‌تواند بعدا بهینه شود
        source='address',
        required=True # <-- اجباری
    )
    delivery_datetime = serializers.DateTimeField(
         required=True # <-- اجباری
    )
    # یادداشت‌ها اختیاری باقی می‌مانند
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Order
        # فقط فیلدهایی که می‌خواهیم در این مرحله آپدیت شوند
        fields = ['address_id', 'delivery_datetime', 'notes']

    # اعتبارسنجی آدرس همچنان لازم است
    def validate_address_id(self, address):
        """بررسی اینکه آدرس انتخاب شده متعلق به کاربر درخواست دهنده باشد"""
        if 'request' in self.context:
             request_user = self.context['request'].user
             if address.user != request_user:
                 raise serializers.ValidationError(_("Selected address does not belong to the current user."))
        else:
             # اگر context به هر دلیلی نبود (بعید است در view)، خطا بده
             raise serializers.ValidationError(_("Could not verify address ownership."))
        return address

    # می‌توانید اعتبارسنجی برای delivery_datetime هم اضافه کنید
    # مثلاً اینکه تاریخ آن در گذشته نباشد یا در بازه‌های مجاز باشد
    # def validate_delivery_datetime(self, value):
    #     if value < timezone.now(): # نیاز به ایمپورت timezone از django.utils
    #         raise serializers.ValidationError(_("Delivery date/time cannot be in the past."))
    #     # ... سایر بررسی‌ها ...
    #     return value

class CartItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['quantity','notes'] # فقط فیلد تعداد قابل ویرایش است

    # می‌توانید اعتبارسنجی اضافه کنید که تعداد منفی نباشد و ...
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(_("Quantity must be positive."))
        # TODO: در اینجا می‌توانید موجودی انبار (stock) محصول را هم چک کنید اگر لازم است
        # item = self.instance # دسترسی به آیتم فعلی (فقط در آپدیت)
        # if item and value > item.cake.stock: # یا item.product.stock
        #     raise serializers.ValidationError(_("Not enough stock available."))
        return value

class AdminDashboardStatsSerializer(serializers.Serializer):
    """
    Serializes the calculated dashboard statistics for the admin.
    """
    todays_orders_count = serializers.IntegerField(help_text=_("تعداد کل سفارشات ثبت شده امروز"))
    processing_orders_count = serializers.IntegerField(help_text=_("تعداد سفارشات در حال پردازش فعلی")) # این فیلد از قبل وجود داشت
    delivered_orders_count = serializers.IntegerField(help_text=_("تعداد کل سفارشات تحویل داده شده"))
    cancelled_orders_count = serializers.IntegerField(help_text=_("تعداد کل سفارشات لغو شده"))
    
    pending_orders_count = serializers.IntegerField(
        help_text=_("تعداد سفارشات در انتظار پرداخت"), 
        required=False # این فیلد ممکن است در ۴ کارت اصلی شما نباشد
    )
    total_orders_count = serializers.IntegerField(
        help_text=_("تعداد کل سفارشات (به جز سبد خرید)"), 
        required=False
    )
    total_users_count = serializers.IntegerField(
        help_text=_("تعداد کل کاربران"), 
        required=False
    )
    active_products_count = serializers.IntegerField(
        help_text=_("تعداد محصولات فعال"), 
        required=False
    )
    total_revenue_month = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        help_text=_("مجموع درآمد این ماه"), 
        required=False
    )
    today_revenue = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        help_text=_("مجموع درآمد امروز"), 
        required=False
    )

    # می‌توانید آمارهای دیگری هم اضافه کنید
    # latest_orders = OrderSerializer(many=True, read_only=True) # مثلا ۵ سفارش آخر
  
class NotificationLogSerializer(serializers.ModelSerializer):
    # برای نمایش اطلاعات خواناتر از فیلدهای مرتبط
    user_info = serializers.SerializerMethodField(read_only=True)
    order_info = serializers.SerializerMethodField(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # اگر فیلدهای gateway را به مدل Notification اضافه کرده‌اید، آن‌ها را هم اینجا بیاورید
    # gateway_pack_id = serializers.CharField(read_only=True)
    # gateway_message_ids = serializers.JSONField(read_only=True) # یا CharField
    # cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)


    class Meta:
        model = Notification
        fields = [
            'id',
            'user', # ID کاربر
            'user_info', # اطلاعات خوانای کاربر
            'order', # ID سفارش
            'order_info', # اطلاعات خوانای سفارش
            'message',
            'type',
            'type_display',
            'status',
            'status_display',
            'created_at',
            'sent_at',
            'gateway_response_status_code', # اگر به مدل اضافه کرده‌اید
            'gateway_response_message',   # اگر به مدل اضافه کرده‌اید
            # 'gateway_pack_id',            # اگر به مدل اضافه کرده‌اید
            # 'gateway_message_ids',        # اگر به مدل اضافه کرده‌اید
            # 'cost',                       # اگر به مدل اضافه کرده‌اید
        ]
        read_only_fields = fields # چون این سریالایزر فقط برای خواندن لاگ‌هاست

    def get_user_info(self, obj):
        if obj.user:
            # می‌توانید اطلاعات بیشتری هم برگردانید
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'full_name': obj.user.get_full_name()
            }
        return None

    def get_order_info(self, obj):
        if obj.order:
            # می‌توانید اطلاعات بیشتری هم برگردانید
            return {
                'id': obj.order.id,
                # 'order_number': obj.order.order_number, # اگر فیلد شماره سفارش جداگانه دارید
            }
        return None  
class SMSTemplateSerializer(serializers.ModelSerializer):
    # نمایش خوانای event_trigger (اختیاری، برای راحتی در API)
    event_trigger_display = serializers.CharField(source='get_event_trigger_display', read_only=True)

    class Meta:
        model = SMSTemplate
        fields = [
            'id',
            'event_trigger',
            'event_trigger_display', # نمایش خوانا
            'message_template',
            'is_active',
            'description'
        ]
        read_only_fields = ['id', 'event_trigger_display']

    def validate_event_trigger(self, value):
        """
        اعتبارسنجی برای اینکه event_trigger یکی از مقادیر مجاز باشد.
        اگر از choices در مدل استفاده می‌کنید، DRF به طور خودکار این اعتبارسنجی را انجام می‌دهد.
        این تابع بیشتر برای نمایش نحوه اعتبارسنجی سفارشی است.
        """
        # اگر choices مستقیماً از Order.OrderStatusChoices گرفته شده:
        # valid_triggers = [choice[0] for choice in Order.OrderStatusChoices.choices]
        # اگر از SMSTemplate.EventTriggerChoices استفاده شده:
        valid_triggers = [choice[0] for choice in SMSTemplate.EventTriggerChoices.choices]
        if value not in valid_triggers:
            raise serializers.ValidationError(f"مقدار '{value}' برای event_trigger معتبر نیست.")
        return value
    def update(self, instance, validated_data):
        """
        این متد به ما اجازه می‌دهد که فقط فیلدهایی که در درخواست PATCH آمده‌اند را آپدیت کنیم.
        """
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.message_template = validated_data.get('message_template', instance.message_template)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance


class UserForNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser # یا CustomUser شما
        fields = ['id', 'username', 'first_name', 'last_name'] # فیلدهای مورد نیاز برای نمایش
        read_only_fields = fields

class InternalOrderNoteSerializer(serializers.ModelSerializer):
    user = UserForNoteSerializer(read_only=True) # نمایش اطلاعات کاربر به صورت تودرتو و فقط خواندنی
    # اگر می‌خواهید هنگام ایجاد، کاربر به صورت ID ارسال شود و در خواندن آبجکت باشد:
    # user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True, allow_null=True, required=False)

    class Meta:
        model = InternalOrderNote
        fields = ['id', 'order', 'user', 'note_text', 'created_at']
        read_only_fields = ['order', 'user', 'created_at', 'id'] # order و user در ویو ست می‌شوند

    # اگر user_id را برای نوشتن استفاده می‌کنید، باید در create هم آن را در نظر بگیرید
    # اما در این سناریو، user از request.user در ویو گرفته می‌شود، پس نیازی نیست.
    

