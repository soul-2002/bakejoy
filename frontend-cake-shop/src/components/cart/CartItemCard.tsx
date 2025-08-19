import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { OrderItem } from '../../types';
import { Paper, TextField, Box, Button, IconButton, Typography, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';

const DEFAULT_PRODUCT_IMAGE = '/images/default-cake.png';

interface CartItemCardProps {
  item: OrderItem;
  onQuantityChange: (itemId: number, newQuantity: number) => void;
  onRemove: (itemId: number) => void;
  onSaveNote: (itemId: number, note: string) => void;
  isUpdating: boolean;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onQuantityChange, onRemove, onSaveNote, isUpdating }) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(item.notes || '');
  const product = item.product;

  if (!product) return null;

  const handleNoteSaveClick = () => {
    onSaveNote(item.id, noteText);
    setIsEditingNote(false);
  };
  
  return (
    <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4">
      <img src={product.image || DEFAULT_PRODUCT_IMAGE} alt={product.name} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-grow flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <Typography component="h3" className="font-bold text-lg text-gray-800 hover:text-amber-600">
              <RouterLink to={`/products/${product.slug}`}>{product.name}</RouterLink>
            </Typography>
            <p className="text-gray-500 text-sm mt-1">{[product.size?.name, product.flavor?.name].filter(Boolean).join(' - ')}</p>
          </div>
          <IconButton onClick={() => onRemove(item.id)} disabled={isUpdating} size="small" className="text-gray-400 hover:text-red-500">
            {isUpdating ? <CircularProgress size={20} /> : <DeleteIcon />}
          </IconButton>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center">
            <IconButton size="small" onClick={() => onQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || isUpdating} className="border border-gray-300 rounded-md">
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography className="w-12 text-center">{isUpdating ? <CircularProgress size={16} /> : item.quantity}</Typography>
            <IconButton size="small" onClick={() => onQuantityChange(item.id, item.quantity + 1)} disabled={isUpdating} className="border border-gray-300 rounded-md">
              <AddIcon fontSize="small" />
            </IconButton>
          </div>
          <div className="font-bold text-amber-600 text-lg">
            {(item.total_price ? parseFloat(item.total_price) : 0).toLocaleString('fa-IR')} تومان
          </div>
        </div>

        <div className="w-full">
          {isEditingNote ? (
            <Paper elevation={0} sx={{ p: 1.5, mt: 1, border: '1px solid #e0e0e0' }}>
              <TextField fullWidth multiline rows={2} variant="standard" label="یادداشت شما" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button size="small" onClick={() => setIsEditingNote(false)}>انصراف</Button>
                <Button size="small" variant="contained" onClick={handleNoteSaveClick} disabled={isUpdating}>
                  {isUpdating ? <CircularProgress size={18} /> : "ذخیره"}
                </Button>
              </Box>
            </Paper>
          ) : (
            <>
              {item.notes ? (
                <div className="bg-amber-50 p-2.5 rounded-md text-sm text-gray-700 flex justify-between items-start">
                  <div className="flex items-start">
                    <StickyNote2OutlinedIcon fontSize="small" className="text-amber-500 mr-1.5 mt-0.5" />
                    <span>یادداشت: {item.notes}</span>
                  </div>
                  <IconButton size="small" onClick={() => setIsEditingNote(true)} className="text-gray-400 hover:text-amber-600 -mt-1 -mr-1">
                    <EditIcon fontSize="inherit" />
                  </IconButton>
                </div>
              ) : (
                <Button variant="text" size="small" startIcon={<EditIcon />} onClick={() => setIsEditingNote(true)}>افزودن یادداشت</Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default CartItemCard;