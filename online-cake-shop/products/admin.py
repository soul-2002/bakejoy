# admin.py
from django.contrib import admin
from .models import SupplyType, Color, Theme,Category, Flavor, Size, Cake, Addon, ProductImage,CakeSizeVariant,Tag,PartySupply


admin.site.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ('name', 'estimated_weight_kg', 'price_modifier', 'is_active')
    list_editable = ('estimated_weight_kg', 'price_modifier', 'is_active')
    search_fields = ['name'] # <--- این خط را اضافه کنید
class CakeSizeVariantInline(admin.TabularInline): # یا admin.StackedInline برای نمایش عمودی
    model = CakeSizeVariant
    extra = 1 # تعداد فرم‌های خالی برای افزودن اندازه جدید به کیک
    fields = ('size', 'price_modifier', 'estimated_weight_kg_override', 'sku_variant', 'stock_quantity', 'is_active_for_product')
    # autocomplete_fields = ['size'] # اگر تعداد اندازه‌ها زیاد است، این کار انتخاب را بسیار راحت‌تر می‌کند
    verbose_name = "متغیر اندازه"
    verbose_name_plural = "متغیرهای اندازه و قیمت‌گذاری"
# --- Inline برای ProductImage ---
class ProductImageInline(admin.TabularInline): # یا StackedInline
    model = ProductImage
    extra = 1 # تعداد فرم خالی برای آپلود عکس جدید
    # می‌توانید فیلدهای دیگری را هم اینجا تنظیم کنید
    # fields = ['image', 'alt_text']
    # readonly_fields = ['id']

@admin.register(Cake)
class CakeAdmin(admin.ModelAdmin):
    list_display = ('name','slug', 'category', 'base_price', 'price_type', 'is_active', 'created_at')
    list_filter = ('category', 'is_active', 'price_type')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ('available_flavors',)
    
    inlines = [CakeSizeVariantInline,
               ProductImageInline]
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('name', 'slug', 'category', 'is_active', 'is_featured', 'tags'),
        }),
        ('توضیحات محصول', {
            'classes': ('collapse',), # برای اینکه این بخش به صورت پیش‌فرض بسته باشد
            'fields': ('short_description', 'description'),
        }),
        ('تصویر اصلی', {
            'fields': ('image',) # تصویر اصلی جدا از گالری (که با inline مدیریت می‌شود)
        }),
        ('قیمت‌گذاری', {
            'fields': ('base_price', 'price_type', 'sale_price', 'schedule_sale_enabled', 'sale_start_date', 'sale_end_date')
        }),
        ('گزینه‌ها (فقط طعم‌ها)', {
            'classes': ('collapse',),
            'fields': ('available_flavors',), # اندازه‌ها با inline مدیریت می‌شوند
        }),
        ('اطلاعات تکمیلی', {
            'classes': ('collapse',),
            'fields': ('ingredients_text', 'nutrition_info_text', 'allergen_info_text'),
        }),
        ('تنظیمات سئو (SEO)', {
            'classes': ('collapse',), # این بخش هم به صورت پیش‌فرض بسته باشد
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
        }),
        # فیلدهای سئو را هم می‌توانید در یک fieldset جداگانه قرار دهید
    )

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    # --- حذف ثبت اشتباه ProductImage از اینجا ---
    # admin.site.register(ProductImage) # <--- این خط حذف شود

# ثبت مدل‌های دیگر (اگر از دکوراتور استفاده نمی‌کنید یا تنظیمات خاصی ندارند)
admin.site.register(Flavor)

admin.site.register(Addon)
# ProductImage دیگر نیازی به ثبت جداگانه ندارد چون Inline شده است

@admin.register(SupplyType)
class SupplyTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ('name', 'hex_code')
    search_fields = ('name',)

@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(PartySupply)
class PartySupplyAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'price', 'stock', 'is_active')
    list_filter = ('is_active', 'type', 'themes', 'colors')
    search_fields = ('name', 'slug', 'description')
    list_editable = ('price', 'stock', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    
    # برای تجربه کاربری بهتر در انتخاب چندتایی
    filter_horizontal = ('colors', 'themes')

    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('name', 'slug', 'type', 'is_active', 'image')
        }),
        ('جزئیات محصول', {
            'fields': ('description',)
        }),
        ('قیمت و موجودی', {
            'fields': ('price', 'stock')
        }),
        ('ویژگی‌ها و دسته‌بندی', {
            'fields': ('colors', 'themes')
        }),
    )

