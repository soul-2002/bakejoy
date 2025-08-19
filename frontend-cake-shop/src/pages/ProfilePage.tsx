// src/pages/ProfilePage.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // برای دسترسی به اطلاعات کاربر
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom'; // برای نمایش زیرصفحات

const ProfilePage: React.FC = () => {
  const { user } = useAuth(); // گرفتن اطلاعات کاربر از Context

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          پروفایل کاربری
        </Typography>
        {user ? (
          <Box>
            <Typography variant="h6">نام کاربری: {user.username}</Typography>
            {/* در آینده می‌تونیم ایمیل، تلفن و ... رو هم نشون بدیم */}
            {/* <Typography>ایمیل: {user.email}</Typography> */}
            {/* <Typography>تلفن: {user.phone}</Typography> */}
            {/* TODO: دکمه ویرایش پروفایل */}
            {/* TODO: نمایش تاریخچه سفارشات */}
          </Box>
        ) : (
          <Typography>اطلاعات کاربر در دسترس نیست.</Typography>
        )}
      </Paper>
      <Outlet />
    </Container>
  );
};

export default ProfilePage;