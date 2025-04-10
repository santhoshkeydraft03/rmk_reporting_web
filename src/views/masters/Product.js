import React, { useState, useEffect, useMemo } from 'react';
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
  InputLabel,
  Grid
} from '@mui/material';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../components/container/PageContainer';
import axiosInstance from '../../utils/axios';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import ReportGrid from '../../components/ReportGrid';

const Product = () => {
  // States
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
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
  const [filterData, setFilterData] = useState({
    quarryId: '',
    productGroup: '',
    production: '',
    status: '',
    searchText: ''
  });

  const columnDefs = useMemo(() => [
    {
      field: 'serialNo',
      headerName: 'S.No',
      width: 70,
      filter: true,
      flex: 0.5,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'productName',
      headerName: 'Product',
      filter: 'agTextColumnFilter',
      flex: 1.2,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'quarryName',
      headerName: 'Quarry',
      filter: 'agTextColumnFilter',
      flex: 1,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'productGroup',
      headerName: 'Product Group',
      filter: 'agTextColumnFilter',
      flex: 1,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'production',
      headerName: 'Production Type',
      filter: 'agTextColumnFilter',
      flex: 1,
      cellStyle: { padding: '0 4px' }
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 100,
      cellRenderer: params => {
        if (!params.value) return '';
        return (
          <Chip
            label={params.value}
            size="small"
            color={params.value === 'Active' ? 'success' : 'error'}
            sx={{ 
              borderRadius: '6px',
              height: '20px',
              '& .MuiChip-label': {
                padding: '0 6px',
                fontSize: '0.75rem'
              }
            }}
          />
        );
      },
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      filter: false,
      cellRenderer: params => {
        if (params.node.rowPinned) return '';
        return (
          <Box sx={{ display: 'flex', gap: '2px' }}>
            <IconButton 
              onClick={() => handleEdit(params.data)}
              size="small"
              sx={{ 
                padding: '2px',
                color: '#4D4D4D'
              }}
            >
              <IconEdit size={16} />
            </IconButton>
            <IconButton 
              onClick={() => handleDelete(params.data.id)}
              size="small"
              sx={{ 
                padding: '2px',
                color: '#4D4D4D'
              }}
            >
              <IconTrash size={16} />
            </IconButton>
          </Box>
        );
      }
    }
  ], []);

  const pinnedBottomRowData = useMemo(() => [{
    serialNo: 'Total',
    productName: `${rows.length} Records`,
    quarryName: '',
    productGroup: '',
    production: '',
    status: '',
    actions: ''
  }], [rows.length]);

  const gridOptions = {
    enableRangeSelection: true,
    enableCellTextSelection: true,
    groupDisplayType: 'multipleColumns',
    groupDefaultExpanded: 1,
    suppressScrollOnNewData: true,
    suppressAnimationFrame: false,
    rowHeight: 28,
    headerHeight: 28,
    suppressRowHoverHighlight: false,
    suppressColumnVirtualisation: true,
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true
    }
  };

  useEffect(() => {
    fetchQuarries();
    fetchProducts();
  }, []);

  const fetchQuarries = async () => {
    try {
      const response = await axiosInstance.get('/master/plants/quarries');
      setQuarries(response.data || []);
    } catch (error) {
      setError('Failed to fetch quarries');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterData.quarryId) params.append('quarryId', filterData.quarryId);
      if (filterData.productGroup) params.append('productGroup', filterData.productGroup);
      if (filterData.production) params.append('production', filterData.production);
      if (filterData.status) params.append('status', filterData.status === 'Active' ? 1 : 0);
      
      const response = await axiosInstance.get(`/master/products${params.toString() ? `?${params.toString()}` : ''}`);
      const transformedData = response.data.map((item, index) => ({
        id: item.productId,
        serialNo: index + 1,
        productName: item.productName,
        quarryName: item.quarry?.plantName || '',
        quarryId: item.quarry?.plantId || '',
        productGroup: item.productGroup,
        production: item.production,
        status: item.status === 1 ? 'Active' : 'Inactive'
      }));
      setOriginalRows(transformedData);
      setRows(transformedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (field, value) => {
    const newFilterData = { ...filterData, [field]: value };
    setFilterData(newFilterData);
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (newFilterData.quarryId) params.append('quarryId', newFilterData.quarryId);
      if (newFilterData.productGroup) params.append('productGroup', newFilterData.productGroup);
      if (newFilterData.production) params.append('production', newFilterData.production);
      if (newFilterData.status) params.append('status', newFilterData.status === 'Active' ? 1 : 0);
      
      const response = await axiosInstance.get(`/master/products${params.toString() ? `?${params.toString()}` : ''}`);
      const filteredData = response.data.map((item, index) => ({
        id: item.productId,
        serialNo: index + 1,
        productName: item.productName,
        quarryName: item.quarry?.plantName || '',
        quarryId: item.quarry?.plantId || '',
        productGroup: item.productGroup,
        production: item.production,
        status: item.status === 1 ? 'Active' : 'Inactive'
      }));
      setOriginalRows(filteredData);
      
      if (newFilterData.searchText) {
        const searchLower = newFilterData.searchText.toLowerCase();
        const searchFiltered = filteredData.filter(row => 
          Object.values(row).some(value => 
            value && value.toString().toLowerCase().includes(searchLower)
          )
        );
        setRows(searchFiltered);
      } else {
        setRows(filteredData);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (searchText) => {
    setFilterData(prev => ({ ...prev, searchText }));
    
    if (!searchText.trim()) {
      setRows(originalRows);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filteredData = originalRows.filter(row => 
      Object.values(row).some(value => 
        value && value.toString().toLowerCase().includes(searchLower)
      )
    );
    setRows(filteredData);
  };

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
        status: formData.status === 'Active' ? 1 : 0
      };

      console.log('Submitting product data:', apiData); // Debug log
      await axiosInstance.post('/master/products', apiData);
      await fetchProducts();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save product');
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
        status: response.data.status === 1 ? 'Active' : 'Inactive'
      });
      setEditingId(response.data.productId);
      setOpenDialog(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch product details');
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
      <Box sx={{ p: 0 }}>
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center" 
          sx={{ 
            mb: 3,
            '& .MuiButton-root': {
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 0.75,
              fontSize: '0.875rem',
              minWidth: '100px',
              '& .MuiSvgIcon-root': {
                fontSize: '1.25rem',
              }
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.25rem' }}>
              Product Master
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              size="medium"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              sx={{ 
                color: '#2a3547', 
                borderColor: '#edf2f6',
                '&:hover': {
                  borderColor: '#5d87ff',
                  bgcolor: 'rgba(93, 135, 255, 0.08)',
                }
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleOpenDialog}
              sx={{
                bgcolor: '#5d87ff',
                '&:hover': { bgcolor: '#4570ea' },
                boxShadow: 'none'
              }}
            >
              Add Product
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filter Section */}
        <Card 
          sx={{ 
            p: 2, 
            mb: 2, 
            borderRadius: '12px',
            border: '1px solid #edf2f6',
            boxShadow: 'none',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={filterData.searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Quarry</InputLabel>
                <Select
                  value={filterData.quarryId}
                  onChange={(e) => handleFilterChange('quarryId', e.target.value)}
                  label="Quarry"
                >
                  <MenuItem value="">All Quarries</MenuItem>
                  {quarries.map((quarry) => (
                    <MenuItem key={quarry.plantId} value={quarry.plantId}>
                      {quarry.plantName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Product Group</InputLabel>
                <Select
                  value={filterData.productGroup}
                  onChange={(e) => handleFilterChange('productGroup', e.target.value)}
                  label="Product Group"
                >
                  <MenuItem value="">All Groups</MenuItem>
                  <MenuItem value="CHAKKAI">Chakkai</MenuItem>
                  <MenuItem value="FILTER_CHAKKAI">Filter Chakkai</MenuItem>
                  <MenuItem value="PRODUCT">Product</MenuItem>
                  <MenuItem value="SLURRY">Slurry</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterData.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>

        <Card 
          sx={{ 
            height: 'calc(100vh - 280px)',
            minHeight: 500,
            borderRadius: '12px',
            border: '1px solid #edf2f6',
            boxShadow: 'none',
            overflow: 'hidden',
            '& .ag-theme-alpine': {
              border: 'none',
              '& .ag-header': {
                height: '28px',
                minHeight: '28px',
                borderBottom: '1px solid #e2e2e2',
              },
              '& .ag-header-cell': {
                padding: '0 4px',
                lineHeight: '28px',
                backgroundColor: '#f8f9fa'
              },
              '& .ag-cell': {
                lineHeight: '28px',
                borderRight: '1px solid #e2e2e2',
              },
              '& .ag-row': {
                borderBottom: '1px solid #e2e2e2',
                height: '28px',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              },
              '& .ag-row-pinned': {
                backgroundColor: '#f8f9fa',
                fontWeight: 500
              }
            }
          }}
        >
          <ReportGrid
            columnDefs={columnDefs}
            rowData={rows}
            gridOptions={gridOptions}
            height="100%"
            pinnedBottomRowData={pinnedBottomRowData}
          />
        </Card>

        {/* Form Dialog */}
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
                    value={formData.quarryId}
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
      </Box>
    </PageContainer>
  );
};

export default Product; 