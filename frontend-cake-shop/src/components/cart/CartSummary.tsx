import React from 'react';
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button, CircularProgress, Alert, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Order, Address } from '../../types';

interface CartSummaryProps {
  cart: Order;
  addresses: Address[];
  selectedAddressId: number | '';
  onAddressChange: (id: number | '') => void;
  deliveryDateTime: string;
  onDeliveryDateChange: (datetime: string) => void;
  onProceedToPayment: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  cart, addresses, selectedAddressId, onAddressChange,
  deliveryDateTime, onDeliveryDateChange, onProceedToPayment,
  isSubmitting, error
}) => {
  // حداقل زمان مجاز برای انتخاب (مثلاً ۳ ساعت بعد)
  const minDateTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
  
  return (
    <Paper elevation={1} className="p-6 sticky top-8 rounded-lg shadow-sm bg-white">
      <Typography component="h2" className="font-bold text-xl text-gray-800 !mb-4">جزئیات تحویل و پرداخت</Typography>
      
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="address-select-label">آدرس تحویل</InputLabel>
        <Select
          labelId="address-select-label"
          value={selectedAddressId}
          label="آدرس تحویل"
          onChange={(e) => onAddressChange(Number(e.target.value) || '')}
        >
          <MenuItem value="" disabled>یک آدرس انتخاب کنید</MenuItem>
          {addresses.map((address) => (
            <MenuItem key={address.id} value={address.id}>
              {address.title} - {address.city_name}
            </MenuItem>
          ))}
        </Select>
        <Button component={RouterLink} to="/profile/addresses" size="small" sx={{ mt: 1, justifyContent: 'flex-start' }}>
          مدیریت آدرس‌ها
        </Button>
      </FormControl>
      
      <TextField
        label="تاریخ و زمان تحویل"
        type="datetime-local"
        fullWidth
        margin="normal"
        size="small"
        value={deliveryDateTime}
        onChange={(e) => onDeliveryDateChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: minDateTime }}
      />
      
      <Divider className="!my-4" />
      
      <Typography component="h3" className="font-bold text-lg text-gray-800 !mb-3">خلاصه سفارش</Typography>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Typography className="text-gray-600">جمع کل:</Typography>
          <Typography className="font-medium">{parseFloat(cart.total_price).toLocaleString('fa-IR')} تومان</Typography>
        </div>
        {/* می‌توانید منطق تخفیف و هزینه ارسال را اینجا اضافه کنید */}
      </div>
      
      {error && <Alert severity="error" className="!my-4">{error}</Alert>}
      
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={onProceedToPayment}
        disabled={isSubmitting || !selectedAddressId || !deliveryDateTime}
        className="!mt-8 !bg-amber-500 hover:!bg-amber-600 !text-white !font-bold !py-3"
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "تایید و ادامه خرید"}
      </Button>
    </Paper>
  );
};

export default CartSummary;