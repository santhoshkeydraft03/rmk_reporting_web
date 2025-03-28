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

const Bucket = () => {
  // States
  const [rows, setRows] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    bucketName: '',
    plantId: '',
    category: '',
    status: 'Active'
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const categories = ['PRODUCTION', 'DEVELOPMENT', 'TRANSPORT'];

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
      field: 'bucketName',
      headerName: 'Bucket Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'plantName',
      headerName: 'Plant',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 200,
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

  useEffect(() => {
    fetchPlants();
    fetchBuckets();
  }, []);

  const fetchPlants = async () => {
    try {
      const response = await axiosInstance.get('/master/plants');
      setPlants(response.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const fetchBuckets = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/master/buckets');
      const transformedData = response.data.map((item, index) => ({
        id: item.bucketId,
        serialNo: index + 1,
        bucketName: item.bucketName,
        plantName: item.plant?.plantName,
        plantId: item.plant?.plantId,
        category: item.category,
        status: item.status || 'Active'
      }));
      setRows(transformedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch buckets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiData = {
        bucketId: editingId || 0,
        bucketName: formData.bucketName,
        plant: {
          plantId: parseInt(formData.plantId)
        },
        category: formData.category,
        status: formData.status
      };

      await axiosInstance.post('/master/buckets', apiData);
      await fetchBuckets();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save bucket');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bucket?')) {
      setLoading(true);
      try {
        await axiosInstance.delete(`/master/buckets/${id}`);
        await fetchBuckets();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete bucket');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (record) => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/master/buckets/${record.id}`);
      setFormData({
        bucketName: response.data.bucketName,
        plantId: response.data.plant?.plantId.toString(),
        category: response.data.category,
        status: response.data.status || 'Active'
      });
      setEditingId(response.data.bucketId);
      setOpenDialog(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch bucket details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      bucketName: '',
      plantId: '',
      category: '',
      status: 'Active'
    });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      bucketName: '',
      plantId: '',
      category: '',
      status: 'Active'
    });
    setEditingId(null);
  };

  return (
    <PageContainer title="Bucket" description="Manage buckets">
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ color: '#4D4D4D' }}>Bucket</Typography>
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
              Add Bucket
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
                {editingId ? 'Edit Bucket' : 'Add New Bucket'}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Bucket Name"
                    value={formData.bucketName}
                    onChange={(e) => setFormData({ ...formData, bucketName: e.target.value })}
                    required
                    variant="outlined"
                  />
                  
                  <FormControl fullWidth required>
                    <InputLabel>Plant</InputLabel>
                    <Select
                      value={formData.plantId}
                      onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                      label="Plant"
                      variant="outlined"
                    >
                      {plants.map((plant) => (
                        <MenuItem key={plant.plantId} value={plant.plantId}>
                          {plant.plantName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      label="Category"
                      variant="outlined"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      label="Status"
                      variant="outlined"
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

export default Bucket; 