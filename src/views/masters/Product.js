import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  InputLabel
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../components/container/PageContainer';
import axiosInstance from '../../utils/axios';

const Product = () => {
  // States
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    quarryId: '',
    productGroup: 'PRODUCT',
    production: 'QUARRY',
    status: 'Active'
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [quarries, setQuarries] = useState([]);

  // Column definitions for DataGrid
  const columns = [
    {
      field: 'serialNo',
      headerName: 'S.No',
      width: 100,
      renderCell: (params) => (
        <div>{params.row.serialNo}</div>
      ),
    },
    {
      field: 'productName',
      headerName: 'Product',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'quarryName',
      headerName: 'Quarry',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'productGroup',
      headerName: 'Product Group',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'production',
      headerName: 'Production Type',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.5,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Active' ? 'success' : 'error'}
          size="small"
          sx={{
            borderRadius: '16px',
            backgroundColor: params.value === 'Active' ? '#E8FFF3' : '#FFF0F0',
            color: params.value === 'Active' ? '#1EA97C' : '#FF4444',
            border: 'none',
            width: '80px',
            justifyContent: 'center'
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton 
              onClick={() => handleEdit(params.row)}
              size="small"
              sx={{ color: '#4D4D4D' }}
            >
              <IconEdit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              onClick={() => handleDelete(params.row.id)}
              size="small"
              sx={{ color: '#4D4D4D' }}
            >
              <IconTrash size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Fetch quarries (only QUARRY type plants)
  const fetchQuarries = async () => {
    try {
      const response = await axiosInstance.get('/master/plants/quarries');
      setQuarries(response.data || []); // Ensure it's always an array
    } catch (error) {
      console.error('Error fetching quarries:', error);
      setQuarries([]); // Set empty array on error
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/master/products');
      const transformedData = response.data.map((item, index) => ({
        id: item.productId,
        serialNo: index + 1,
        productName: item.productName,
        quarryName: item.quarry?.plantName || '',
        quarryId: item.quarry?.plantId || '',
        productGroup: item.productGroup,
        production: item.production,
        status: item.status || 'Active'
      }));
      setRows(transformedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch products');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuarries();
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiData = {
        productId: editingId || 0,
        productName: formData.productName,
        quarry: {
          plantId: parseInt(formData.quarryId)
        },
        productGroup: formData.productGroup,
        production: formData.production,
        status: formData.status
      };

      await axiosInstance.post('/master/products', apiData);
      await fetchProducts();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save product');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      try {
        await axiosInstance.delete(`/master/products/${id}`);
        await fetchProducts();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete product');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (record) => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/master/products/${record.id}`);
      setFormData({
        productName: response.data.productName,
        quarryId: response.data.quarry?.plantId.toString() || '',
        productGroup: response.data.productGroup,
        production: response.data.production,
        status: response.data.status || 'Active'
      });
      setEditingId(response.data.productId);
      setOpenDialog(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch product details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      productName: '',
      quarryId: '',
      productGroup: 'PRODUCT',
      production: 'QUARRY',
      status: 'Active'
    });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      productName: '',
      quarryId: '',
      productGroup: 'PRODUCT',
      production: 'QUARRY',
      status: 'Active'
    });
    setEditingId(null);
  };

  return (
    <PageContainer title="Product" description="Manage products">
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ color: '#4D4D4D' }}>Product</Typography>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleOpenDialog}
              sx={{
                backgroundColor: '#5D87FF',
                '&:hover': {
                  backgroundColor: '#4570EA',
                },
                borderRadius: '8px',
                textTransform: 'none',
                px: 3
              }}
            >
              Add Product
            </Button>
          </Stack>

          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              pageSizeOptions={[5, 10, 20]}
              disableColumnMenu
              loading={loading}
              sx={{
                '& .MuiDataGrid-root': {
                  borderRadius: '8px',
                  border: '1px solid #E5E5E5',
                },
                '& .MuiDataGrid-cell': {
                  borderRight: '1px solid #E5E5E5',
                  borderBottom: '1px solid #E5E5E5',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  '&:focus, &:focus-within': {
                    outline: 'none',
                    border: '2px solid #5D87FF !important',
                    borderRadius: '4px',
                  },
                  '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: '#F8FAFF',
                    border: '2px solid #5D87FF !important',
                    borderRadius: '4px',
                  },
                  '&:last-child': {
                    borderRight: 'none',
                  }
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#F8FAFF',
                  borderBottom: '2px solid #E5E5E5',
                  minHeight: '48px !important',
                  '& .MuiDataGrid-columnHeader': {
                    borderRight: '1px solid #E5E5E5',
                    padding: '8px 12px',
                    '&:last-child': {
                      borderRight: 'none',
                    },
                    '&:focus': {
                      outline: 'none',
                    }
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#2B3674',
                  }
                },
                '& .MuiDataGrid-row': {
                  minHeight: '40px !important',
                  '&:hover': {
                    backgroundColor: '#F8FAFF',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'transparent',
                  }
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: '#fff',
                  marginTop: '0 !important',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid #E5E5E5',
                  backgroundColor: '#F8FAFF',
                  minHeight: '42px',
                },
                '& .MuiTablePagination-root': {
                  color: '#2B3674',
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    margin: 0,
                  }
                },
                '& .MuiDataGrid-cell[data-field="serialNo"]': {
                  paddingLeft: '16px',
                },
                border: '1px solid #E5E5E5',
                borderRadius: '12px',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
              }}
            />
          </Box>

          <Dialog 
            open={openDialog} 
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '8px'
              }
            }}
          >
            <form onSubmit={handleSubmit}>
              <DialogTitle sx={{ borderBottom: '1px solid #E5E5E5' }}>
                {editingId ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    required
                    variant="outlined"
                  />
                  <FormControl fullWidth required>
                    <InputLabel>Quarry</InputLabel>
                    <Select
                      value={formData.quarryId || ''}
                      onChange={(e) => setFormData({ ...formData, quarryId: e.target.value })}
                      label="Quarry"
                    >
                      {quarries.map((quarry) => (
                        <MenuItem key={quarry.plantId} value={quarry.plantId.toString()}>
                          {quarry.plantName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required>
                    <InputLabel>Product Group</InputLabel>
                    <Select
                      value={formData.productGroup}
                      onChange={(e) => setFormData({ ...formData, productGroup: e.target.value })}
                      label="Product Group"
                    >
                      <MenuItem value="CHAKKAI">Chakkai</MenuItem>
                      <MenuItem value="FILTER_CHAKKAI">Filter Chakkai</MenuItem>
                      <MenuItem value="PRODUCT">Product</MenuItem>
                      <MenuItem value="SLURRY">Slurry</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required>
                    <InputLabel>Production Type</InputLabel>
                    <Select
                      value={formData.production}
                      onChange={(e) => setFormData({ ...formData, production: e.target.value })}
                      label="Production Type"
                    >
                      <MenuItem value="QUARRY">Quarry</MenuItem>
                      <MenuItem value="CRUSHER">Crusher</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      label="Status"
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 3, borderTop: '1px solid #E5E5E5' }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    color: '#5D87FF',
                    borderColor: '#5D87FF',
                    '&:hover': {
                      borderColor: '#4570EA',
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  sx={{
                    backgroundColor: '#5D87FF',
                    '&:hover': {
                      backgroundColor: '#4570EA',
                    },
                    borderRadius: '8px',
                    textTransform: 'none'
                  }}
                >
                  {editingId ? 'Update' : 'Save'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Product; 