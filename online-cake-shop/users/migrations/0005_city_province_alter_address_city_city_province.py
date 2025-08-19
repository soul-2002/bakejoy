# users/migrations/0005_...py

from django.db import migrations, models
import django.db.models.deletion

# تابع جدید برای تبدیل داده‌های قدیمی
def forwards_func(apps, schema_editor):
    """
    داده‌های متنی شهرها را از مدل Address خوانده،
    آبجکت‌های Province و City را ایجاد کرده،
    و آدرس‌ها را به آبجکت City جدید متصل می‌کند.
    """
    # گرفتن مدل‌ها از تاریخچه مایگریشن
    Address = apps.get_model('users', 'Address')
    Province = apps.get_model('users', 'Province')
    City = apps.get_model('users', 'City')
    
    # برای سادگی، یک استان پیش‌فرض می‌سازیم. شما می‌توانید این بخش را کامل‌تر کنید.
    default_province, _ = Province.objects.get_or_create(name='نامشخص')

    # تمام آدرس‌های موجود را پیدا کن
    for address in Address.objects.all():
        # مقدار متنی شهر را از فیلد قدیمی بخوان
        # ما از _city_old استفاده می‌کنیم چون جنگو در پشت صحنه نام فیلد را تغییر می‌دهد
        city_name = getattr(address, '_city_old', None)

        if city_name:
            # یک شهر با نام قدیمی و استان پیش‌فرض بساز یا پیدا کن
            city_obj, _ = City.objects.get_or_create(
                name=city_name,
                defaults={'province': default_province}
            )
            # آی‌دی شهر پیدا شده را به فیلد جدید آدرس اختصاص بده
            address.city = city_obj
            address.save(update_fields=['city'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_customuser_points'),
    ]

    operations = [
        # ۱. ابتدا مدل‌های جدید را ایجاد می‌کنیم
        migrations.CreateModel(
            name='Province',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='City',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('province', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cities', to='users.province')),
            ],
        ),
        
        # ۲. نام فیلد city فعلی را موقتاً تغییر می‌دهیم تا با فیلد جدید تداخل نداشته باشد
        migrations.RenameField(
            model_name='address',
            old_name='city',
            new_name='_city_old'
        ),

        # ۳. فیلد city جدید را با نوع ForeignKey اضافه می‌کنیم
        migrations.AddField(
            model_name='address',
            name='city',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='users.city', verbose_name='City'),
        ),

        # ۴. تابع تبدیل داده را اجرا می‌کنیم
        migrations.RunPython(forwards_func),

        # ۵. حالا که داده‌ها منتقل شدند، فیلد city جدید را Not Null می‌کنیم
        migrations.AlterField(
            model_name='address',
            name='city',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='users.city', verbose_name='City'),
        ),

        # ۶. فیلد متنی قدیمی را حذف می‌کنیم
        migrations.RemoveField(
            model_name='address',
            name='_city_old',
        ),
    ]