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
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../components/container/PageContainer';
import axiosInstance from '../../utils/axios';

const ExpenseType = () => {
  // States
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    expenseType: '',
    status: 'Active'
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

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
      field: 'expenseType',
      headerName: 'Expense Type',
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

  // Fetch all expense types
  const fetchExpenseTypes = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/master/expense-types');
      console.log(response.data);
      const transformedData = response.data.map((item, index) => ({
        id: item.expenseTypeId,
        serialNo: index + 1,
        expenseType: item.expenseTypeName,
        status: 'Active'
      }));
      setRows(transformedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch expense types');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseTypes();
  }, []);

  // Create/Update expense type
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiData = {
        expenseTypeId: editingId || 0,
        expenseTypeName: formData.expenseType
      };

      await axiosInstance.post('/master/expense-types', apiData);
      await fetchExpenseTypes(); // Refresh the list
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save expense type');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete expense type
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense type?')) {
      setLoading(true);
      setError('');

      try {
        await axiosInstance.delete(`/master/expense-types/${id}`);
        await fetchExpenseTypes(); // Refresh the list
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete expense type');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit expense type
  const handleEdit = async (record) => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/master/expense-types/${record.id}`);
      setFormData({
        expenseType: response.data.expenseTypeName,
        status: 'Active'
      });
      setEditingId(response.data.expenseTypeId);
      setOpenDialog(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch expense type details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenDialog = () => {
    setFormData({ expenseType: '', status: 'Active' });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ expenseType: '', status: 'Active' });
    setEditingId(null);
  };

  return (
    <PageContainer title="Expense Type" description="Manage expense types">
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ color: '#4D4D4D' }}>Expense Type</Typography>
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
              Add Expense Type
            </Button>
          </Stack>

          {/* DataGrid with updated props */}
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
                '& .MuiDataGrid-cell[data-field="status"]': {
                  '& .MuiChip-root': {
                    // Remove margin: '0 auto',
                  }
                },
                '& .MuiDataGrid-cell[data-field="actions"]': {
                  // Remove justifyContent: 'center',
                  gap: '4px',
                },
                border: '1px solid #E5E5E5',
                borderRadius: '12px',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
              }}
            />
          </Box>

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
                {editingId ? 'Edit Expense Type' : 'Add New Expense Type'}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Expense Type"
                    value={formData.expenseType}
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                    required
                    variant="outlined"
                  />
                  <FormControl fullWidth>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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

export default ExpenseType; 