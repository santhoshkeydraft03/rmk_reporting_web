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

const ExpenseGroup = () => {
  // States
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    expenseGroup: '',
    expenseTypeId: '',
    status: 'Active'
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [expenseTypes, setExpenseTypes] = useState([]);

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
      field: 'expenseGroup',
      headerName: 'Expense Group',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'expenseTypeName',
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

  // Fetch all expense groups
  const fetchExpenseGroups = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/master/expense-groups');
      const transformedData = response.data.map((item, index) => ({
        id: item.expenseGroupId,
        serialNo: index + 1,
        expenseGroup: item.name,
        expenseTypeName: item.expenseType?.expenseTypeName,
        status: item.status || 'Active'
      }));
      setRows(transformedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch expense groups');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all expense types
  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get('/master/expense-types');
      setExpenseTypes(response.data);
    } catch (error) {
      console.error('Error fetching expense types:', error);
    }
  };

  useEffect(() => {
    fetchExpenseTypes();
    fetchExpenseGroups();
  }, []);

  // Create/Update expense group
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiData = {
        expenseGroupId: editingId || 0,
        name: formData.expenseGroup,
        expenseType: {
          expenseTypeId: parseInt(formData.expenseTypeId)
        },
        status: formData.status
      };

      console.log('Sending data:', apiData);
      await axiosInstance.post('/master/expense-groups', apiData);
      await fetchExpenseGroups();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save expense group');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete expense group
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense group?')) {
      setLoading(true);
      setError('');

      try {
        await axiosInstance.delete(`/master/expense-groups/${id}`);
        await fetchExpenseGroups();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete expense group');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit expense group
  const handleEdit = async (record) => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/master/expense-groups/${record.id}`);
      setFormData({
        expenseGroup: response.data.name,
        expenseTypeId: response.data.expenseType?.expenseTypeId.toString(),
        status: response.data.status || 'Active'
      });
      setEditingId(response.data.expenseGroupId);
      setOpenDialog(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch expense group details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenDialog = () => {
    setFormData({ expenseGroup: '', expenseTypeId: '', status: 'Active' });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ expenseGroup: '', expenseTypeId: '', status: 'Active' });
    setEditingId(null);
  };

  return (
    <PageContainer title="Expense Group" description="Manage expense groups">
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ color: '#4D4D4D' }}>Expense Group</Typography>
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
              Add Expense Group
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
                {editingId ? 'Edit Expense Group' : 'Add New Expense Group'}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Expense Type</InputLabel>
                    <Select
                      value={formData.expenseTypeId}
                      onChange={(e) => setFormData({ ...formData, expenseTypeId: e.target.value })}
                      label="Expense Type"
                    >
                      {expenseTypes.map((type) => (
                        <MenuItem key={type.expenseTypeId} value={type.expenseTypeId}>
                          {type.expenseTypeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Expense Group"
                    value={formData.expenseGroup}
                    onChange={(e) => setFormData({ ...formData, expenseGroup: e.target.value })}
                    required
                    variant="outlined"
                  />
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

export default ExpenseGroup; 