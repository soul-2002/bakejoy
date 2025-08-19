from django.db import models
from products.models import Addon
from django.conf import settings # برای دسترسی به AUTH_USER_MODEL
from django.utils.translation import gettext_lazy as _
from products.models import Cake, Flavor, Size,CakeSizeVariant,PartySupply
from django.db.models import Sum, F, DecimalField
from users.models import Address
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
# مدل Address رو بعدا به صورت رشته‌ای ('users.Address') ارجاع می‌دیم یا اگر بالاتر تعریف شده ایمپورت می‌کنیم


class ActiveOrderManager(models.Manager):
    def get_queryset(self):
        # فقط سفارشاتی را برگردان که is_deleted آنها False است
        return super().get_queryset().filter(is_deleted=False)
# مدل اصلی برای نگهداری اطلاعات کلی سفارش
class Order(models.Model):
    """
    Represents a customer order or shopping cart in the system.
    """

    class OrderStatusChoices(models.TextChoices):
        PENDING_PAYMENT = 'PENDING_PAYMENT', _('Pending Payment')
        PROCESSING = 'PROCESSING', _('Processing')
        SHIPPED = 'SHIPPED', _('Shipped')
        DELIVERED = 'DELIVERED', _('Delivered')
        CANCELLED = 'CANCELLED', _('Cancelled')
        CART = 'CART', _('Cart')
        PAYMENT_FAILED = 'PAYMENT_FAILED', _('Payment Failed')

    # کاربر ثبت کننده سفارش
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True, # اجازه می‌دهد کاربر null باشد
        related_name='orders'
    )
    order_number = models.CharField(
        _("Order Number"), 
        max_length=20, 
        unique=False, # <-- موقتاً False تا مایگریشن اول اجرا شود
        null=True,    # <-- موقتاً True تا به رکوردهای موجود مقدار null بدهد
        blank=True, 
        editable=False,
        help_text=_("Unique order number with prefix.")
    )
    # آدرس تحویل سفارش
    # !! تغییر: اجازه می‌دهیم آدرس در ابتدا خالی باشد (برای وضعیت سبد خرید) !!
    address = models.ForeignKey(
        Address, # نیازی به 'users.Address' نیست اگر Address در همین فایل ایمپورت شده
        verbose_name=_("Delivery Address"),
        on_delete=models.PROTECT, # یا SET_NULL اگر می‌خواهید با حذف آدرس، سفارش null شود
        related_name='orders',
        null=True,  # <-- اجازه null بودن
        blank=True  # <-- اجازه خالی بودن در فرم‌ها/ادمین
    )

    # تاریخ و زمان تحویل
    # !! تغییر: اجازه می‌دهیم زمان تحویل در ابتدا خالی باشد !!
    delivery_datetime = models.DateTimeField(
        _("Delivery Date/Time"),
        help_text=_("Chosen date and start time slot for delivery"),
        null=True,  # <-- اجازه null بودن
        blank=True  # <-- اجازه خالی بودن
    )

    # یادداشت‌های اختیاری مشتری
    notes = models.TextField(_("Notes"), null=True, blank=True) # این از قبل درست بود

    # قیمت نهایی کل سفارش
    total_price = models.DecimalField(
        _("Total Price"),
        max_digits=12, decimal_places=2,
        default=0.00 # مقدار اولیه صفر - درست
    )

    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=OrderStatusChoices.choices,
        default=OrderStatusChoices.CART, # <-- مقدار پیش‌فرض را CART می‌گذاریم
        db_index=True # برای جستجوی سریعتر بر اساس وضعیت خوب است
    )
    tracking_code = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Tracking Code"))
    
    is_deleted = models.BooleanField(
        _("Is Deleted"), 
        default=False, 
        db_index=True, # برای جستجوی سریع‌تر بر اساس این فیلد (اختیاری ولی مفید)
        help_text=_("علامت‌گذاری سفارش به عنوان حذف شده به جای حذف فیزیکی")
        
    )   
    
    objects = ActiveOrderManager()  # مدیر پیش‌فرض، فقط فعال‌ها را برمی‌گرداند
    all_objects = models.Manager()  # یک مدیر دیگر برای دسترسی به *تمام* سفارشات (شامل حذف شده‌ها) در صورت نیاز
    SHIPPING_CHOICES = [
        ('PICKUP', _('تحویل حضوری')),
        ('PEYK', _('پیک موتوری')),
        ('POST', _('پست پیشتاز')),
    ]
    shipping_method = models.CharField(
        _("Shipping Method"),
        max_length=50,
        choices=SHIPPING_CHOICES,
        null=True, 
        blank=True 
    )

    # زمان ایجاد و آخرین به‌روزرسانی
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    def __str__(self):
        # نمایش بهتر در پنل ادمین و ...
        return f"Order {self.id} ({self.user.username if self.user else 'No User'}) - {self.get_status_display()}"
    
    def update_total_price(self):
        """Calculates and updates the total price based on its items."""
        # 'items' نام related_name پیش‌فرض برای ForeignKey از OrderItem به Order است
        # اگر related_name را تغییر داده‌اید، اینجا هم اصلاح کنید.
        order_items = self.items.all() # گرفتن تمام آیتم‌های مرتبط با این سفارش

        # محاسبه مجموع قیمت آیتم‌ها (تعداد * قیمت زمان سفارش)
        items_total = order_items.aggregate(
           total=Sum(
               F('quantity') * F('price_at_order'), # ضرب دو فیلد
               output_field=DecimalField(max_digits=12, decimal_places=2) # تعیین نوع خروجی
           )
        )['total'] or 0 # اگر هیچ آیتمی نباشد، مجموع صفر است

        # TODO: اگر مدل OrderAddon دارید و می‌خواهید قیمت افزودنی‌ها را هم حساب کنید،
        # باید آن‌ها را هم از طریق آیتم‌ها جمع بزنید.
        # addons_total = ...
    
        print(f"Updating total price for Order {self.id} to: {items_total}") # لاگ برای دیباگ
        self.total_price = items_total # + addons_total
        # فقط فیلد total_price را ذخیره می‌کنیم تا updated_at بی‌دلیل عوض نشود
        self.save(update_fields=['total_price'])
    def get_latest_successful_transaction(self):
        return self.transactions.filter(status='SUCCESS').order_by('-created_at').first()
    def get_shipping_method_display(self):
        return dict(self.SHIPPING_CHOICES).get(self.shipping_method, self.shipping_method)
    # ^^^^ --- پایان متد محاسبه قیمت کل --- ^^^^
    def save(self, *args, **kwargs):
        # این متغیر مشخص می‌کند که آیا آبجکت برای اولین بار در حال ایجاد است یا خیر
        is_new = self._state.adding
        
        # اگر در حال آپدیت هستیم و فقط فیلدهای خاصی مشخص شده، منطق ساخت شماره سفارش را اجرا نکن
        if not is_new and kwargs.get('update_fields'):
             super().save(*args, **kwargs)
             return

        # ابتدا یک بار ذخیره می‌کنیم تا آبجکت یک 'id' دریافت کند
        super().save(*args, **kwargs)
        
        # اگر آبجکت جدید بود و هنوز شماره سفارش نداشت، آن را می‌سازیم
        if is_new and not self.order_number:
            BASE_ORDER_NUMBER = 2000
            PREFIX = "BAKE-"
            
            new_order_number = f"#{PREFIX}{BASE_ORDER_NUMBER + self.id}"
            self.order_number = new_order_number
            
            # دوباره ذخیره می‌کنیم، اما فقط فیلد order_number را آپدیت می‌کنیم
            self.save(update_fields=['order_number'])
    def change_status(self, new_status: str, changed_by=None, notes: str = ""):
        """
        این متد به صورت اتمی وضعیت سفارش را تغییر داده، لاگ ثبت کرده و پیامک ارسال می‌کند.
        """
        # اگر وضعیت جدید با وضعیت فعلی یکسان است، هیچ کاری انجام نده
        if new_status == self.status:
            return

        old_status_display = self.get_status_display()
        
        # ۱. ابتدا وضعیت سفارش را آپدیت و ذخیره کن
        self.status = new_status
        self.save(update_fields=['status'])
        print(f"Order #{self.id} status changed to {self.status}")

        # ۲. سپس لاگ تغییر وضعیت را با اطلاعات کامل ثبت کن
        if not notes:
            notes = f"وضعیت از '{old_status_display}' به '{self.get_status_display()}' تغییر کرد."
        
        OrderStatusLog.objects.create(
            order=self,
            new_status=self.status,
            changed_by=changed_by,
            notes=notes
        )
        print(f"Log created for order #{self.id}")

        # ۳. در نهایت، پیامک را ارسال کن
        try:
            from .sms_service import send_order_status_sms # <-- ایمپورت به اینجا منتقل شد
            send_order_status_sms(self, self.status) # دیگر نیازی به پاس دادن وضعیت نیست، چون در خود آبجکت order هست
            print(f"SMS service called for order #{self.id}")
        except Exception as e:
            # حتی اگر ارسال پیامک با خطا مواجه شد، نباید کل عملیات را متوقف کند
            # این خطا باید در سیستم لاگ‌گیری شما ثبت شود
            print(f"CRITICAL: Failed to send SMS for order #{self.id}. Error: {e}")
    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")
        ordering = ['-created_at'] # مرتب‌سازی پیش‌فرض
class OrderItem(models.Model):
    # سفارش والد این آیتم
    order = models.ForeignKey(
        'Order', # ارجاع به مدل Order در همین اپلیکیشن
        verbose_name=_("Order"),
        on_delete=models.CASCADE, # اگر سفارش حذف شد، آیتم‌هایش هم حذف شوند (منطقی است)
        related_name='items' # اجازه می‌دهد از یک سفارش به آیتم‌هایش دسترسی پیدا کنیم (order.items.all())
    )
    # این فیلد نوع مدل محصول را ذخیره می‌کند (مثلاً: Cake یا PartySupply)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    # این فیلد ID آبجکت محصول را ذخیره می‌کند (مثلاً: ID کیک یا ID لوازم جشن)
    object_id = models.PositiveIntegerField()
    # این فیلد مجازی، آبجکت محصول واقعی را به ما می‌دهد
    content_object = GenericForeignKey('content_type', 'object_id')
    # طعم انتخاب شده
    # cake = models.ForeignKey(
    #     Cake, # ارجاع به مدل Cake در اپلیکیشن products
    #     verbose_name=_("Cake"),
    #     # PROTECT: جلوگیری از حذف کیک اگر در سفارش فعالی وجود داشته باشد
    #     # جایگزین: SET_NULL (اگر null=True باشد) یا CASCADE (اگر حذف کیک باید سفارش را هم حذف کند - نامناسب)
    #     on_delete=models.PROTECT,
    #     related_name='order_items'
    #     ,null=True,
    #     blank=True
    # )
    flavor = models.ForeignKey(
        Flavor, # ارجاع به مدل Flavor در اپلیکیشن products
        verbose_name=_("Flavor"),
        on_delete=models.PROTECT, # جلوگیری از حذف طعم اگر استفاده شده باشد
        related_name='order_items',
        null=True,
        blank=True
    )
    # اندازه انتخاب شده
    size_variant = models.ForeignKey(
        CakeSizeVariant,
        verbose_name=_("Size Variant"),
        on_delete=models.PROTECT, # جلوگیری از حذف متغیر اندازه اگر در سفارشی استفاده شده
        related_name='order_items',
        null=True, # اگر محصولی اندازه ندارد، این می‌تواند null باشد
        blank=True
    )
    # تعداد از این آیتم (کیک با طعم و اندازه مشخص)
    quantity = models.PositiveIntegerField(_("Quantity"), default=1) # تعداد باید مثبت باشد
    # قیمتی که یک واحد از این آیتم در زمان ثبت سفارش داشته است
    # این بسیار مهم است چون قیمت‌ها ممکن است در آینده تغییر کنند
    price_at_order = models.DecimalField(_("Price at Order"), max_digits=10, decimal_places=2)
    notes = models.TextField(_("Customization Notes"), null=True, blank=True)
    
    def calculate_price(self):
        """
        قیمت را بر اساس نوع محصول (کیک یا لوازم جشن) محاسبه می‌کند.
        """
        product = self.content_object # گرفتن آبجکت محصول واقعی

        if isinstance(product, Cake):
            # اگر محصول کیک بود، از منطق پیچیده قیمت‌گذاری کیک استفاده کن
            calculated_price = product.base_price
            if product.price_type == 'PER_KG' and self.size_variant:
                weight_kg = self.size_variant.estimated_weight_kg_override or self.size_variant.size.estimated_weight_kg
                if not weight_kg or weight_kg <= 0:
                    raise ValidationError(f"وزن برای اندازه '{self.size_variant.size.name}' تعریف نشده است.")
                calculated_price = product.base_price * weight_kg
            
            if self.size_variant and self.size_variant.price_modifier is not None:
                calculated_price += self.size_variant.price_modifier
            
            return max(calculated_price, 0)
        
        elif isinstance(product, PartySupply):
            # اگر محصول لوازم جشن بود، فقط قیمت خود محصول را برگردان
            # TODO: منطق تخفیف را هم می‌توانید اینجا اضافه کنید
            return product.price
            
        return 0 # اگر نوع محصول ناشناخته بود

    def save(self, *args, **kwargs):
        """این متد بدون تغییر باقی می‌ماند و به درستی کار می‌کند."""
        self.price_at_order = self.calculate_price()
        super().save(*args, **kwargs)
        if self.order:
            self.order.update_total_price()

    def __str__(self):
        """
        نمایش خوانا بر اساس نوع محصول.
        """
        product = self.content_object
        if not product:
            return f"{self.quantity} x (محصول حذف شده) for Order #{self.order.id}"

        if isinstance(product, Cake):
            size_name = self.size_variant.size.name if self.size_variant and self.size_variant.size else "بدون اندازه"
            flavor_name = self.flavor.name if self.flavor else "بدون طعم"
            return f"{self.quantity} x {product.name} ({flavor_name}, {size_name}) for Order #{self.order.id}"
        else:
            # برای لوازم جشن، نمایش ساده‌تر است
            return f"{self.quantity} x {product.name} for Order #{self.order.id}"

    # (اختیاری ولی مفید) یک پراپرتی برای محاسبه قیمت کل این آیتم (تعداد * قیمت واحد)
    @property
    def total_price(self):
        return self.quantity * self.price_at_order

# مدل برای ذخیره جزئیات طرح سفارشی مرتبط با یک آیتم سفارش
class CustomDesign(models.Model):
    """
    Stores details for a custom cake design requested
    for a specific OrderItem. Linked one-to-one with OrderItem.
    """
    # ارتباط یک-به-یک با آیتم سفارش.
    # هر آیتم سفارش حداکثر یک طرح سفارشی می‌تواند داشته باشد.
    # با قرار دادن primary_key=True، فیلد id پیش‌فرض حذف شده و همین فیلد کلید اصلی می‌شود،
    # که تضمین می‌کند برای هر OrderItem فقط یک رکورد CustomDesign می‌تواند وجود داشته باشد.
    order_item = models.OneToOneField(
        OrderItem, # ارجاع به مدل OrderItem در همین اپ
        verbose_name=_("Order Item"),
        on_delete=models.CASCADE, # اگر آیتم سفارش حذف شد، طرح سفارشی آن هم حذف شود
        related_name='custom_design', # دسترسی از آیتم به طرح: order_item.custom_design
        primary_key=True # این فیلد کلید اصلی جدول است
    )

    # فایل تصویر آپلود شده توسط کاربر برای طرح سفارشی
    # نیاز به Pillow و تنظیمات MEDIA دارد
    design_file = models.ImageField(
        _("Design File"),
        upload_to='custom_designs/', # فایل‌ها در پوشه media/custom_designs/ ذخیره می‌شوند
        help_text=_("Image uploaded by customer for custom design")
    )

    # توضیحات یا یادداشت‌های اضافی کاربر در مورد طرح سفارشی
    notes = models.TextField(
        _("Notes"),
        null=True, blank=True, # توضیحات می‌تواند خالی باشد
        help_text=_("Additional customer notes regarding the custom design")
    )

    class Meta:
        verbose_name = _("Custom Design")
        verbose_name_plural = _("Custom Designs")

    def __str__(self):
        # نمایش خوانا بر اساس آیتم سفارش مرتبط
        return f"Custom Design for Order Item #{self.order_item.id} (Order #{self.order_item.order.id})"

# مدل برای ثبت افزودنی‌های انتخاب شده برای هر آیتم سفارش
class OrderAddon(models.Model):
    """
    Represents an Addon product selected for a specific OrderItem.
    Links an OrderItem to an Addon product with quantity and price details.
    """
    # آیتم سفارشی که این افزودنی به آن تعلق دارد
    order_item = models.ForeignKey(
        OrderItem, # ارجاع به مدل OrderItem در همین اپ
        verbose_name=_("Order Item"),
        on_delete=models.CASCADE, # اگر آیتم سفارش حذف شد، افزودنی‌های آن هم حذف شوند
        related_name='addons' # دسترسی از آیتم به افزودنی‌هایش: order_item.addons.all()
    )
    # محصول افزودنی انتخاب شده
    addon = models.ForeignKey(
        Addon, # ارجاع به مدل Addon در اپلیکیشن products
        verbose_name=_("Addon"),
        on_delete=models.PROTECT, # از حذف محصول افزودنی جلوگیری شود اگر در سفارشی استفاده شده
        related_name='order_items' # اجازه می‌دهد از یک Addon به آیتم‌های سفارشی که شامل آن هستند دسترسی پیدا کنیم
    )
    # تعداد از این افزودنی
    quantity = models.PositiveIntegerField(_("Quantity"), default=1)
    # قیمت یک واحد از این افزودنی در زمان ثبت سفارش
    price_at_order = models.DecimalField(_("Price at Order"), max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = _("Order Addon")
        verbose_name_plural = _("Order Addons")
        # تضمین می‌کند که یک نوع افزودنی خاص فقط یک بار برای هر آیتم سفارش ثبت شود
        # برای تغییر تعداد، باید همین رکورد آپدیت شود، نه اینکه رکورد جدیدی اضافه گردد
        unique_together = ('order_item', 'addon')
        ordering = ['order_item'] # مرتب‌سازی بر اساس آیتم سفارش

    def __str__(self):
        # نمایش خوانا
        return f"{self.quantity} x {self.addon.name} for Order Item #{self.order_item.id}"

    # (اختیاری) پراپرتی برای محاسبه قیمت کل این ردیف افزودنی
    @property
    def total_price(self):
        return self.quantity * self.price_at_order
    

# مدل برای ثبت تراکنش‌های مالی مرتبط با سفارش‌ها
class Transaction(models.Model):
    """
    Represents a financial transaction related to an Order,
    such as a payment attempt, completion, or refund.
    """

        # سفارش مرتبط با این تراکنش
    # از حذف سفارش جلوگیری شود اگر تراکنشی برای آن ثبت شده است
    order = models.ForeignKey(
        'Order',
        verbose_name=_("Order"),
        on_delete=models.PROTECT,
        related_name='transactions' # دسترسی از سفارش به تراکنش‌ها: order.transactions.all()
    )

    # مبلغ تراکنش (مبلغی که پرداخت شده یا قرار بوده پرداخت شود)
    amount = models.DecimalField(_("Amount"), max_digits=12, decimal_places=2)

    # شناسه یا کد پیگیری که از درگاه پرداخت دریافت می‌شود
    # این فیلد برای پیگیری وضعیت تراکنش در سمت درگاه بسیار مهم است
    gateway_reference_id = models.CharField(
        _("Gateway Reference ID"),
        max_length=100, # طول مناسب برای انواع کدهای پیگیری
        null=True, blank=True, # ممکن است همه تراکنش‌ها (مثل ناموفق اولیه) کد پیگیری نداشته باشند
        db_index=True # برای جستجوی سریع بر اساس کد پیگیری، ایندکس می‌گذاریم
    )

    # ذخیره پاسخ کامل یا بخشی از پاسخ دریافتی از درگاه (معمولاً JSON یا متن)
    # برای اشکال‌زدایی (Debugging) بسیار مفید است
    gateway_response = models.TextField(_("Gateway Response"), null=True, blank=True)
    ref_id = models.CharField(
        _("Tracking Code (RefID)"),
        max_length=50, # یا طول مناسب دیگر
        null=True,       # می‌تواند خالی باشد تا زمان وریفای موفق
        blank=True,
        db_index=True,   # برای جستجوی سریعتر
        unique=True      # کد رهگیری باید یکتا باشد (اگر null نباشد)
    )
    # زمان ایجاد و آخرین به‌روزرسانی رکورد تراکنش
    # transaction_date در ERD با created_at جایگزین شد برای ثبت خودکار
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)

        # مقادیر ثابت (Choices) برای روش پرداخت
    class PaymentMethodChoices(models.TextChoices):
        ONLINE_GATEWAY = 'ONLINE', _('Online Gateway')    # درگاه پرداخت آنلاین
        CASH_ON_DELIVERY = 'COD', _('Cash on Delivery')   # پرداخت در محل (اگر فعال باشد)
        BANK_TRANSFER = 'TRANSFER', _('Bank Transfer')     # کارت به کارت / انتقال بانکی (اگر لازم باشد)
        # می توانید روش‌های دیگری هم در صورت نیاز اضافه کنید

    # مقادیر ثابت (Choices) برای وضعیت تراکنش
    class TransactionStatusChoices(models.TextChoices):
        PENDING = 'PENDING', _('Pending')     # در انتظار نتیجه (مثلا کاربر به درگاه هدایت شده)
        SUCCESS = 'SUCCESS', _('Successful')  # تراکنش موفق
        FAILED = 'FAILED', _('Failed')       # تراکنش ناموفق

    # فیلد روش پرداخت استفاده شده (این فیلد اختیاری است)
    payment_method = models.CharField(
        _("Payment Method"),
        max_length=20, # طول کافی برای کدهای روش پرداخت ('ONLINE', 'COD', ...)
        choices=PaymentMethodChoices.choices,
        null=True, blank=True # شاید در ابتدای ایجاد تراکنش یا برای همه انواع، مشخص نباشد
    )

    # فیلد وضعیت فعلی تراکنش
    status = models.CharField(
        _("Status"),
        max_length=10, # طول کافی برای کدهای وضعیت ('PENDING', 'SUCCESS', 'FAILED')
        choices=TransactionStatusChoices.choices,
        default=TransactionStatusChoices.PENDING # وضعیت پیش‌فرض هنگام ایجاد تراکنش
    )

    # orders/models.py (داخل کلاس Meta در مدل Transaction)

    class Meta:
        verbose_name = _("Transaction")
        verbose_name_plural = _("Transactions")
        ordering = ['-created_at'] # اضافه کردن این خط برای مرتب‌سازی

    def __str__(self):
        # ارائه یک نمایش رشته‌ای خوانا
        return f"Transaction for Order #{self.order.id} - Amount: {self.amount} ({self.get_status_display()})"
        # self.get_status_display() نام نمایشی وضعیت (مثلا 'Successful') را می‌دهد <-- این خط کامنت بعد از return است و باید حذف شود یا جابجا شود.
class InternalOrderNote(models.Model):
    order = models.ForeignKey(
        Order, 
        related_name='internal_notes', 
        on_delete=models.CASCADE,
        verbose_name=_("Order")
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, # اگر کاربر حذف شد، یادداشت باقی بماند ولی کاربرش null شود
        null=True, 
        blank=True, # ممکن است یادداشت توسط سیستم ثبت شود یا کاربر دیگر در دسترس نباشد
        verbose_name=_("User")
    )
    note_text = models.TextField(_("Note Text"))
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)

    class Meta:
        verbose_name = _("Internal Order Note")
        verbose_name_plural = _("Internal Order Notes")
        ordering = ['-created_at'] # جدیدترین یادداشت‌ها اول نمایش داده شوند

    def __str__(self):
        user_display = self.user.username if self.user else _("System")
        return f"Note for Order #{self.order.id} by {user_display} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"
class Notification(models.Model):
    class NotificationTypeChoices(models.TextChoices):
        EMAIL = 'EMAIL', _('Email')
        SMS = 'SMS', _('SMS')
        IN_APP = 'INAPP', _('In-App')

    class NotificationStatusChoices(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        SENT = 'SENT', _('Sent')
        FAILED = 'FAILED', _('Failed')
        # می‌توانید وضعیت DELIVERED را هم اضافه کنید اگر sms.ir این قابلیت را دارد
        # DELIVERED = 'DELIVERED', _('Delivered')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("User"),
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    order = models.ForeignKey(
        'orders.Order', # <--- مطمئن شوید مسیر مدل Order صحیح است (app_label.ModelName)
        verbose_name=_("Related Order"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    message = models.TextField(_("Message")) # این متن نهایی پیامک خواهد بود
    type = models.CharField(
        _("Type"),
        max_length=10,
        choices=NotificationTypeChoices.choices,
        default=NotificationTypeChoices.EMAIL # پیش‌فرض ایمیل است، برای پیامک باید SMS باشد
    )
    status = models.CharField(
        _("Status"),
        max_length=10,
        choices=NotificationStatusChoices.choices,
        default=NotificationStatusChoices.PENDING
    )
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    sent_at = models.DateTimeField(_("Sent At"), null=True, blank=True)
    # فیلدهای اضافی پیشنهادی برای پیامک:
    gateway_response_status_code = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("Gateway Status Code"))
    gateway_response_message = models.TextField(blank=True, null=True, verbose_name=_("Gateway Response Message"))
    gateway_pack_id = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("Gateway Pack ID"))
    gateway_message_ids = models.JSONField(blank=True, null=True, verbose_name=_("Gateway Message IDs")) # یا TextField
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name=_("Cost"))

    class Meta:
        verbose_name = _("Notification")
        verbose_name_plural = _("Notifications")
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username} ({self.get_type_display()} - {self.get_status_display()})"
class SMSTemplate(models.Model):
    # اگر Order.OrderStatusChoices در مدل Order شما تعریف شده، از آن استفاده کنید:
    # event_trigger = models.CharField(
    #     max_length=50, # یا طولی که برای فیلد status در Order دارید
    #     choices=Order.OrderStatusChoices.choices,
    #     unique=True,
    #     verbose_name=_("Order Status Trigger")
    # )
    #
    # در غیر این صورت، choices را اینجا تعریف می‌کنیم و باید با مقادیر فیلد status
    # در مدل Order شما دقیقاً یکسان باشند (هم از نظر مقدار و هم بزرگی/کوچکی حروف).
    
    class EventTriggerChoices(models.TextChoices):
        # مقادیر زیر باید دقیقاً با مقادیر ذخیره شده برای وضعیت سفارش در مدل Order شما یکی باشند
        PENDING_PAYMENT = 'PENDING_PAYMENT', _('Pending Payment')      # در انتظار پرداخت
        ORDER_CONFIRMED = 'ORDER_CONFIRMED', _('Order Confirmed (after payment)') # این را اضافه می‌کنیم برای تایید پرداخت
        PROCESSING = 'PROCESSING', _('Processing')                    # در حال پردازش
        SHIPPED = 'SHIPPED', _('Shipped')                              # ارسال شده
        DELIVERED = 'DELIVERED', _('Delivered')                        # تحویل داده شده
        CANCELLED = 'CANCELLED', _('Cancelled')                        # لغو شده
        PAYMENT_FAILED = 'PAYMENT_FAILED', _('Payment Failed')          # پرداخت ناموفق
        # وضعیت 'CART' معمولاً برای پیامک استفاده نمی‌شود، مگر برای سناریوهای خاص.

    event_trigger = models.CharField(
        max_length=50, # طولی متناسب با طولانی‌ترین کلید وضعیت شما
        choices=EventTriggerChoices.choices,
        unique=True, # هر وضعیت سفارش فقط یک قالب پیامک فعال می‌تواند داشته باشد
        verbose_name=_("Order Status Trigger Event")
    )
    message_template = models.TextField(
        verbose_name=_("SMS Template Text (with placeholders)"),
        help_text=_("Use placeholders like {{customer_name}}, {{order_id}}, {{order_total}}, {{tracking_number}}, {{store_name}}.")
    )
    is_active = models.BooleanField(default=True, verbose_name=_("Active for Sending"))
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("Template Description"))

    def __str__(self):
        return f"SMS Template for: {self.get_event_trigger_display()}"

    class Meta:
        verbose_name = _("SMS Template")
        verbose_name_plural = _("SMS Templates")
        ordering = ['event_trigger']
        
class OrderStatusLog(models.Model):
    order = models.ForeignKey(
        Order, 
        related_name='status_logs', # نامی برای دسترسی از آبجکت Order به لاگ‌هایش
        on_delete=models.CASCADE,   # با حذف سفارش، لاگ‌های وضعیت آن هم حذف شوند
        verbose_name=_("Order")
    )
    # وضعیت قبلی را می‌توانیم ذخیره نکنیم اگر فقط وضعیت جدید و زمان آن مهم است
    # old_status = models.CharField(_("Old Status"), max_length=50, null=True, blank=True) 
    new_status = models.CharField(_("New Status"), max_length=50) # کلید وضعیت جدید، مثلا 'PROCESSING'
    timestamp = models.DateTimeField(_("Timestamp"), auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, # اگر کاربر حذف شد، لاگ باقی بماند
        null=True, 
        blank=True, # ممکن است تغییر توسط سیستم باشد
        verbose_name=_("Changed By User")
    )
    notes = models.TextField(_("Notes"), null=True, blank=True, help_text=_("توضیحات اضافی برای این تغییر وضعیت")) # توضیحات اختیاری

    class Meta:
        verbose_name = _("Order Status Log")
        verbose_name_plural = _("Order Status Logs")
        ordering = ['-timestamp'] # جدیدترین تغییرات اول نمایش داده شوند

    def __str__(self):
        user_display = self.changed_by.username if self.changed_by else _("System")
        return f"Order #{self.order.id} changed to {self.new_status} by {user_display} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
