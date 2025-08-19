from django.db import models
from django.utils.translation import gettext_lazy as _ # برای استفاده از Choices
from django.utils.text import slugify
from django.conf import settings # برای ForeignKey به User

# مدل برای دسته‌بندی کیک‌ها
class Category(models.Model):
    name = models.CharField(_("Category Name"), max_length=100, unique=True)
    description = models.TextField(_("Description"), null=True, blank=True)
    # Note: ImageField requires Pillow to be installed (pip install Pillow)
    # Also requires MEDIA_ROOT and MEDIA_URL configured in settings.py

    slug = models.SlugField(
        _("Slug"),
        max_length=120, # طول مناسب برای اسلاگ
        unique=True,    # اسلاگ باید یکتا باشد
        allow_unicode=False, # فقط حروف ASCII، اعداد و خط تیره مجاز باشد (برای URL بهتره)
        help_text=_("A URL-friendly version of the category name, usually auto-generated.")
    )
    image = models.ImageField(_("Image"), upload_to='categories/', null=True, blank=True)
    is_active = models.BooleanField(_("Is Active"), default=True, help_text=_("Is this category currently active and visible?"))

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        ordering = ['name'] # مرتب‌سازی پیش‌فرض بر اساس نام

    def __str__(self):
        return self.name
    # (اختیاری ولی به شدت توصیه شده) متد save برای تولید خودکار اسلاگ
    def save(self, *args, **kwargs):
        if not self.slug: # اگر اسلاگ خالی بود (یعنی دفعه اول ساخته می‌شه)
            self.slug = slugify(self.name, allow_unicode=False) # از نام، اسلاگ بساز
            # برای اطمینان از یکتا بودن در موارد خیلی خاص می‌شه کد بیشتری اضافه کرد
        super().save(*args, **kwargs) # متد save اصلی رو فراخوانی کن
# مدل برای طعم‌های کیک
class Flavor(models.Model):
    name = models.CharField(_("Flavor Name"), max_length=100, unique=True)
    description = models.TextField(_("Description"), null=True, blank=True)
    is_active = models.BooleanField(_("Is Active"), default=True)

    class Meta:
        verbose_name = _("Flavor")
        verbose_name_plural = _("Flavors")
        ordering = ['name']

    def __str__(self):
        return self.name

# مدل برای اندازه‌های کیک
class Size(models.Model):
    name = models.CharField(_("Size Name"), max_length=50, unique=True, help_text=_("e.g., Small, Medium, 8-inch"))
    description = models.TextField(_("Description"), null=True, blank=True)
    # وزن تخمینی برای کمک به مشتری یا قیمت‌گذاری احتمالی
    estimated_weight_kg = models.DecimalField(
        _("Estimated Weight (kg)"),
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    price_modifier = models.DecimalField(
        _("Price Modifier"),
         max_digits=10,  # تعداد ارقام کل (قبل و بعد اعشار)
         decimal_places=2, # تعداد ارقام اعشار
        default=0.00, # مقدار پیش‌فرض (بدون تغییر قیمت)
         help_text=_("مبلغی که به قیمت پایه کیک برای این سایز اضافه یا کم می‌شود (می‌تواند منفی باشد).")
    )
    is_active = models.BooleanField(_("Is Active"), default=True)

    class Meta:
        verbose_name = _("Size")
        verbose_name_plural = _("Sizes")
        ordering = ['name'] # یا شاید بر اساس یک فیلد ترتیب دیگر

    def __str__(self):
        return self.name

# مدل اصلی برای کیک
class Tag(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True, verbose_name="نام تگ")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "تگ"
        verbose_name_plural = "تگ‌ها"
        ordering = ['name']
class Cake(models.Model):
    # Enum برای نوع قیمت‌گذاری
    class PriceTypeChoices(models.TextChoices):
        FIXED = 'FIXED', _('Fixed Price')
        PER_KG = 'PER_KG', _('Price Per Kg')
        # ... می‌توانید انواع دیگری اضافه کنید

    name = models.CharField(_("Cake Name"), max_length=200)
    slug = models.SlugField(
        _("Slug"),
        max_length=255, # ممکن است نام کیک طولانی‌تر باشد
        unique=True,    # اسلاگ باید یکتا باشد
        allow_unicode=False,
        help_text=_("A URL-friendly version of the cake name, auto-generated if left blank.")
    )
    description = models.TextField(_("Description"), null=True, blank=True)
    short_description = models.CharField(_("Short Description"), max_length=300, blank=True, null=True)

    image = models.ImageField(_("Image"), upload_to='cakes/', null=True, blank=True)

    # ارتباط با دسته‌بندی: هر کیک به یک دسته‌بندی تعلق دارد
    category = models.ForeignKey(
        Category,
        verbose_name=_("Category"),
        on_delete=models.SET_NULL, # اگر دسته‌بندی حذف شد، فیلد category این کیک null شود
        null=True, # اجازه می‌دهد null باشد (اگر دسته‌بندی حذف شد)
        blank=True, # اجازه می‌دهد در فرم ادمین خالی باشد (شاید موقتاً دسته‌بندی نداشته باشد)
        related_name='cakes' # اجازه می‌دهد از یک آبجکت Category به کیک‌هایش دسترسی داشته باشیم (category.cakes.all())
    )

    # ارتباط چند-به-چند با طعم‌ها: هر کیک می‌تواند طعم‌های مختلفی داشته باشد
    available_flavors = models.ManyToManyField(
        Flavor,
        verbose_name=_("Available Flavors"),
        related_name='cakes', # اجازه می‌دهد از آبجکت Flavor به کیک‌های دارای آن طعم دسترسی پیدا کنیم
        blank=True # یک کیک می‌تواند موقتاً طعم مشخصی نداشته باشد
    )

    # ارتباط چند-به-چند با اندازه‌ها: هر کیک می‌تواند در اندازه‌های مختلفی موجود باشد
    available_sizes = models.ManyToManyField(
        Size,
        through='CakeSizeVariant', # <--- نام مدل واسط شما
        related_name='cakes', # یا هر نام مناسب دیگر
        blank=True
    )
    

    # قیمت پایه کیک
    base_price = models.DecimalField(_("Base Price"), max_digits=10, decimal_places=2)
    # نوع قیمت‌گذاری بر اساس Enum بالا
    price_type = models.CharField(
        _("Price Type"),
        max_length=10,
        choices=PriceTypeChoices.choices,
        default=PriceTypeChoices.FIXED
    )

    # آیا کیک در سایت فعال و قابل نمایش است؟
    is_active = models.BooleanField(_("Is Active"), default=True)
    average_rating = models.DecimalField(_("Average Rating"), max_digits=3, decimal_places=2, default=0.00)
    review_count = models.PositiveIntegerField(_("Review Count"), default=0)
    is_featured = models.BooleanField(_("Is Featured"), default=False, help_text=_("Show this cake in featured sections?"))
    ingredients_text = models.TextField(_("Ingredients Text"), blank=True, null=True)
    nutrition_info_text = models.TextField(_("Nutrition Info Text"), blank=True, null=True)
    allergen_info_text = models.TextField(_("Allergen Info Text"), blank=True, null=True)
    
    sale_price = models.DecimalField(_("Sale Price"), max_digits=10, decimal_places=2, null=True, blank=True)
    schedule_sale_enabled = models.BooleanField(_("Schedule Sale Enabled"), default=False)
    sale_start_date = models.DateTimeField(_("Sale Start Date"), null=True, blank=True)
    sale_end_date = models.DateTimeField(_("Sale End Date"), null=True, blank=True)
    
    tags = models.ManyToManyField(Tag, related_name='cakes', blank=True, verbose_name="برچسب‌ها")
    
    # --- SEO Fields ---
    meta_title = models.CharField(
        _("Meta Title"),
        max_length=70,  # معمولاً حداکثر ۷۰ کاراکتر برای عنوان سئو توصیه می‌شود
        blank=True,
        null=True,
        help_text=_("عنوان سئو برای نمایش در تب مرورگر و نتایج گوگل. اگر خالی باشد، از نام محصول استفاده می‌شود.")
    )
    meta_description = models.TextField(
        _("Meta Description"),
        blank=True,
        null=True,
        help_text=_("توضیحات مختصر (حدود ۱۶۰ کاراکتر) برای نمایش در نتایج گوگل.")
    )
    meta_keywords = models.TextField(
        _("Meta Keywords"),
        blank=True,
        null=True,
        help_text=_("کلمات کلیدی مرتبط با محصول، جدا شده با کاما (,). (اهمیت کمتری برای سئوی مدرن دارد)")
    )
    # زمان ایجاد و آخرین به‌روزرسانی رکورد
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True) # فقط در زمان ایجاد ثبت می‌شود
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)    # در هر بار ذخیره آپدیت می‌شود

    class Meta:
        verbose_name = _("Cake")
        verbose_name_plural = _("Cakes")
        ordering = ['name'] # مرتب‌سازی پیش‌فرض

    def __str__(self):
        return self.name

     # متد save برای تولید خودکار اسلاگ (یا آپدیت متد قبلی اگر وجود داشت)
    def save(self, *args, **kwargs):
        if not self.slug: # فقط اگر اسلاگ خالی است
            self.slug = slugify(self.name, allow_unicode=False)
            # TODO: در آینده برای اطمینان ۱۰۰٪ از یکتا بودن، می‌توان یک عدد یا شناسه به انتهای اسلاگ‌های تکراری اضافه کرد
        super().save(*args, **kwargs) # ذخیره نهایی


class WishlistItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='wishlist_items',
        verbose_name=_("User")
    )
    product = models.ForeignKey(
        Cake, # یا هر مدل محصول دیگری که دارید
        on_delete=models.CASCADE, 
        related_name='wishlisted_by',
        verbose_name=_("Product")
    )
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)

    class Meta:
        # هر کاربر فقط یک بار می‌تواند یک محصول را به علاقه‌مندی‌ها اضافه کند
        unique_together = ('user', 'product')
        ordering = ['-created_at']
        verbose_name = _("Wishlist Item")
        verbose_name_plural = _("Wishlist Items")

    def __str__(self):
        return f"{self.user.username}'s wishlist: {self.product.name}"
class CakeSizeVariant(models.Model):
    cake = models.ForeignKey(Cake, on_delete=models.CASCADE, related_name='size_variants')
    size = models.ForeignKey(Size, on_delete=models.CASCADE, related_name='cake_variants')
    
    # فیلدهای اضافی برای این ترکیب خاص کیک-اندازه
    price_modifier = models.DecimalField(
        _("Price Modifier for this Variant"), 
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        help_text=_("مبلغی که به قیمت پایه کیک برای این ترکیب اندازه اضافه یا از آن کم می‌شود.")
    )
    estimated_weight_kg_override = models.DecimalField(
        _("Specific Weight for this Variant (kg)"),
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text=_("وزن دقیق این محصول با این اندازه، اگر با وزن پیش‌فرض اندازه متفاوت است.")
    )
    sku_variant = models.CharField(_("SKU for Variant"), max_length=50, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(_("Stock Quantity for Variant"), null=True, blank=True)
    is_active_for_product = models.BooleanField(_("Is this variant active for product"), default=True)
    
    # سایر فیلدهای لازم برای این ترکیب

    class Meta:
        unique_together = ('cake', 'size') # هر ترکیب کیک و اندازه باید یکتا باشد
        verbose_name = _("Cake Size Variant")
        verbose_name_plural = _("Cake Size Variants")

    def __str__(self):
        return f"{self.cake.name} - {self.size.name} (Modifier: {self.price_modifier})"

    # می‌توانید property هایی برای دسترسی به قیمت یا وزن نهایی اضافه کنید
    @property
    def final_price(self):
        # فرض: self.cake.base_price وجود دارد
        base_price = self.cake.base_price if self.cake.base_price is not None else 0
        modifier = self.price_modifier if self.price_modifier is not None else 0
        return base_price + modifier

    @property
    def final_weight(self):
        return self.estimated_weight_kg_override if self.estimated_weight_kg_override is not None else self.size.estimated_weight_kg

# مدل برای افزودنی‌ها یا محصولات جانبی

class SupplyType(models.Model):
    name = models.CharField(_("Type Name"), max_length=100, unique=True)
    slug = models.SlugField(unique=True, allow_unicode=True)
    
    def __str__(self):
        return self.name

class Color(models.Model):
    name = models.CharField(_("Color Name"), max_length=50, unique=True)
    hex_code = models.CharField(_("Hex Code"), max_length=7, help_text=_("e.g., #FFFFFF"))

    def __str__(self):
        return self.name

class Theme(models.Model):
    name = models.CharField(_("Theme Name"), max_length=100, unique=True)
    slug = models.SlugField(unique=True, allow_unicode=True)

    def __str__(self):
        return self.name

# --- مدل Addon شما با تغییرات جدید ---
# من نام مدل را به PartySupply تغییر می‌دهم تا خواناتر باشد، اما شما می‌توانید Addon را نگه دارید
class PartySupply(models.Model):
    name = models.CharField(_("Supply Name"), max_length=150)
    slug = models.SlugField(unique=True, allow_unicode=True, help_text=_("برای آدرس URL محصول"))
    description = models.TextField(_("Description"), null=True, blank=True)
    price = models.DecimalField(_("Price"), max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(_("Stock"), default=0)
    image = models.ImageField(_("Image"), upload_to='supplies/', null=True, blank=True)
    is_active = models.BooleanField(_("Is Active"), default=True, db_index=True)

    # --- فیلدهای رابطه‌ای برای فیلتر کردن ---
    type = models.ForeignKey(SupplyType, on_delete=models.PROTECT, related_name='supplies', verbose_name=_("Product Type"))
    colors = models.ManyToManyField(Color, blank=True, related_name='supplies', verbose_name=_("Colors"))
    themes = models.ManyToManyField(Theme, blank=True, related_name='supplies', verbose_name=_("Themes"))

    class Meta:
        verbose_name = _("Party Supply")
        verbose_name_plural = _("Party Supplies")
        ordering = ['name']

    def __str__(self):
        return self.name
class Addon(models.Model):
    # Enum برای دسته‌بندی افزودنی‌ها (اختیاری ولی خوب)
    class AddonCategoryChoices(models.TextChoices):
        DECORATION = 'DECOR', _('Decorations') # تزئینات
        CANDLE = 'CANDLE', _('Candles')     # شمع
        CARD = 'CARD', _('Greeting Cards') # کارت تبریک
        UTENSIL = 'UTENSIL', _('Utensils')   # ظروف یکبار مصرف
        OTHER = 'OTHER', _('Other')        # سایر

    name = models.CharField(_("Addon Name"), max_length=150, unique=True)
    description = models.TextField(_("Description"), null=True, blank=True)
    price = models.DecimalField(_("Price"), max_digits=8, decimal_places=2)
    # برای مدیریت موجودی انبار افزودنی‌ها (اگر لازم است)
    stock = models.PositiveIntegerField(_("Stock"), null=True, blank=True, help_text=_("Leave blank if stock is not tracked"))
    # دسته‌بندی افزودنی با استفاده از Enum بالا
    category = models.CharField(
        _("Category"),
        max_length=10,
        choices=AddonCategoryChoices.choices,
        null=True, blank=True # اگر دسته‌بندی همیشه لازم نیست
    )
    image = models.ImageField(_("Image"), upload_to='addons/', null=True, blank=True)
    is_active = models.BooleanField(_("Is Active"), default=True)

    class Meta:
        verbose_name = _("Addon")
        verbose_name_plural = _("Addons")
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.price})"

class ProductImage(models.Model):
    cake = models.ForeignKey(Cake, related_name='images', on_delete=models.CASCADE, verbose_name=_("Cake"))
    image = models.ImageField(_("Image"), upload_to='cakes/gallery/')
    alt_text = models.CharField(_("Alt Text"), max_length=255, blank=True, null=True)
    # می‌توانید فیلد ترتیب نمایش هم اضافه کنید
    # display_order = models.PositiveIntegerField(default=0)

    class Meta:
         ordering = ['cake', 'id'] # یا بر اساس display_order
         verbose_name = _("Product Image")
         verbose_name_plural = _("Product Images")

class Review(models.Model):
    product = models.ForeignKey(Cake, on_delete=models.CASCADE, related_name='reviews', verbose_name=_("Product"))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews', verbose_name=_("User"))
    rating = models.PositiveSmallIntegerField(_("Rating"), choices=[(i, str(i)) for i in range(1, 6)]) # امتیاز ۱ تا ۵
    comment = models.TextField(_("Comment"), blank=True, null=True)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)

    class Meta:
        verbose_name = _("Review")
        verbose_name_plural = _("Reviews")
        ordering = ['-created_at']
        # هر کاربر برای هر محصول فقط یک نظر بتواند ثبت کند
        unique_together = ('product', 'user')

    def __str__(self):
        return f"Review by {self.user} for {self.product}"

    # TODO: در متد save یا با استفاده از signal، فیلدهای average_rating و review_count مدل Cake را آپدیت کنید.