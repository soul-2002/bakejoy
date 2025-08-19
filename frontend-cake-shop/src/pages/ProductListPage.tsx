// src/pages/ProductListPage.tsx
import React, { useState, useEffect } from 'react';
import { getCategories, getProducts, Category, Cake } from '../services/api'; // ایمپورت توابع و اینترفیس‌ها
import { Link as RouterLink } from 'react-router-dom'; // ایمپورت Link از روتر

// ایمپورت کامپوننت‌های MUI
import Container from '@mui/material/Container';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia'; // برای نمایش عکس
import CircularProgress from '@mui/material/CircularProgress'; // لودینگ
import Alert from '@mui/material/Alert';           // نمایش خطا
import Button from '@mui/material/Button';         // برای فیلتر دسته‌بندی
import Box from '@mui/material/Box';               // برای چیدمان

const ProductListPage: React.FC = () => {
  // تعریف State ها با تایپ‌های مشخص
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Cake[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect برای گرفتن داده‌ها هنگام لود شدن کامپوننت
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // گرفتن همزمان دسته‌بندی‌ها و محصولات (بدون فیلتر اولیه)
        const [categoriesData, productsData] = await Promise.all([
          getCategories(),
          getProducts() // در ابتدا همه محصولات رو می‌گیریم
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
      } catch (err) {
        setError('خطا در دریافت اطلاعات محصولات.');
        console.error(err); // نمایش خطای کامل در کنسول
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // آرایه خالی یعنی فقط یک بار بعد از اولین رندر اجرا شود

  // تابع برای فیلتر کردن محصولات بر اساس دسته‌بندی
  const handleCategoryFilter = async (categoryId: number | null) => {
    setSelectedCategoryId(categoryId); // ذخیره دسته‌بندی انتخاب شده
    setLoading(true);
    setError(null);
    try {
      const productsData = await getProducts(categoryId ?? undefined); // اگر categoryId null بود، فیلتر نمی‌کنیم
      setProducts(productsData);
    } catch (err) {
      setError('خطا در فیلتر کردن محصولات.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // نمایش حالت لودینگ
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  // نمایش حالت خطا
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  // نمایش اصلی صفحه
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3, mb: 3 }}>
        لیست کیک‌ها
      </Typography>

      {/* نمایش دکمه‌های دسته‌بندی برای فیلتر */}
      <Box sx={{ mb: 3 }}>
        <Button
           variant={selectedCategoryId === null ? 'contained' : 'outlined'}
           onClick={() => handleCategoryFilter(null)}
           sx={{ mr: 1, mb: 1 }}
         >
          همه دسته‌بندی‌ها
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategoryId === category.id ? 'contained' : 'outlined'}
            onClick={() => handleCategoryFilter(category.id)}
            sx={{ mr: 1, mb: 1 }}
          >
            {category.name}
          </Button>
        ))}
      </Box>

      {/* نمایش محصولات در گرید */}
      <Grid container spacing={3}>
        {products.length === 0 && !loading ? (
          <Grid xs={12} >
            <Typography>هیچ محصولی یافت نشد.</Typography>
          </Grid>
        ) : (
          products.map((cake) => (
            <Grid key={cake.id} xs={12} sm={6} md={4}>
              <Card>
                {/* TODO: نمایش تصویر کیک */}
                {cake.image && (
                   <CardMedia
                    component="img"
                    height="140"
                    image={cake.image} // آدرس کامل تصویر از بک‌اند
                    alt={cake.name}
                  />
                )}
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {cake.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {/* نمایش خلاصه توضیحات یا قیمت */}
                    قیمت پایه: {cake.base_price}
                    {/* TODO: نمایش لینک به صفحه جزئیات */}
                    {/* <Link to={`/products/${cake.slug}`}>مشاهده جزئیات</Link> */}
                  </Typography>
                </CardContent>
                <CardActions> {/* اکشن‌های کارت */}
                    {/* لینک به صفحه جزئیات با استفاده از slug */}
                    <Button
                      component={RouterLink} // <--- استفاده از Link روتر
                      to={`/products/${cake.slug}`} // <--- آدرس صفحه جزئیات با slug
                      size="small"
                      variant="contained"
                    >
                      مشاهده جزئیات و سفارش {/* <--- متن دکمه */}
                    </Button>
                  </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default ProductListPage;