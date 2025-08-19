// src/pages/LoginPage.tsx
import React, { useState } from 'react';
// useLocation را اضافه کنید
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';

// MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// ایمپورت تابع login از سرویس API و تغییر نام آن برای جلوگیری از تداخل
import { login as apiLogin, AuthTokens } from '../services/api';
// ایمپورت هوک useAuth برای دسترسی به توابع Context
import { useAuth } from '../contexts/AuthContext';

// تعریف نوع داده‌های ورودی فرم
interface LoginFormInputs {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // <--- هوک useLocation برای دسترسی به state
  const { login: contextLogin } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormInputs>();

  // خواندن مسیر "from" از location.state که توسط ProtectedRoute پاس داده شده
  // اگر location.state یا location.state.from وجود نداشت، به مسیر پیش‌فرض '/' بروید.
  // همچنین query parameters (بخش search) را هم در نظر می‌گیریم.
  const fromPath = (location.state as { from?: { pathname: string; search?: string } })?.from?.pathname || '/';
  const fromSearch = (location.state as { from?: { pathname: string; search?: string } })?.from?.search || '';
  const redirectTo = `${fromPath}${fromSearch}`; // مسیر کامل برای هدایت

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    console.log("1. onSubmit called with data:", data);
    setServerError(null);
    try {
      console.log("2. Trying to call apiLogin...");
      const tokens: AuthTokens = await apiLogin({ username: data.username, password: data.password });
      console.log("3. apiLogin successful, tokens received:", tokens);
      await contextLogin(tokens);
      console.log("4. contextLogin finished, navigating to:", redirectTo); // <--- لاگ مسیر هدایت
      // به جای navigate('/') از redirectTo استفاده کنید
      navigate(redirectTo, { replace: true }); // <--- تغییر اصلی اینجاست
    } catch (err: any) {
      console.error("!!! Login failed in onSubmit catch block:", err);
      setServerError(err.message || 'خطا در ورود. لطفاً دوباره تلاش کنید.');
    }
    console.log("6. onSubmit finished.");
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          ورود به حساب کاربری
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="نام کاربری یا ایمیل"
            autoComplete="username"
            autoFocus
            {...register("username", { required: "وارد کردن نام کاربری الزامی است" })}
            error={!!errors.username}
            helperText={errors.username?.message}
            disabled={isSubmitting}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="رمز عبور"
            type="password"
            id="password"
            autoComplete="current-password"
            {...register("password", { required: "وارد کردن رمز عبور الزامی است" })}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isSubmitting}
          />

          {serverError && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{serverError}</Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'ورود'}
          </Button>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                رمز عبور را فراموش کرده‌اید؟
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {"حساب کاربری ندارید؟ ثبت‌نام کنید"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;