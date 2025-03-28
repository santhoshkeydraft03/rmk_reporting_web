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

const Ledger = () => {
  // States
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    ledgerName: '',
    bucketId: '',
    expenseTypeId: '',
    expenseGroupId: '',
    status: 'Active'
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [buckets, setBuckets] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [expenseGroups, setExpenseGroups] = useState([]);

  const columns = [
    {
      field: 'serialNo',
      headerName: 'S.No',
      width: 70,
    },
    {
      field: 'ledgerName',
      headerName: 'Ledger Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'bucketName',
      headerName: 'Bucket Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'expenseTypeName',
      headerName: 'Expense Type',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'expenseGroupName',
      headerName: 'Expense Group',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      minWidth: 100,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton 
              onClick={() => handleEdit(params.row)}
              size="small"
              sx={{ color: '#4D4D4D', mr: 1 }}
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
    fetchBuckets();
    fetchExpenseTypes();
    fetchLedgers();
  }, []);

  // Fetch expense groups based on selected expense type
  useEffect(() => {
    if (formData.expenseTypeId) {
      fetchExpenseGroups(formData.expenseTypeId);
    }
  }, [formData.expenseTypeId]);

  const fetchBuckets = async () => {
    try {
      const response = await axiosInstance.get('/master/buckets');
      setBuckets(response.data);
    } catch (error) {
      console.error('Error fetching buckets:', error);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get('/master/expense-types');
      setExpenseTypes(response.data);
    } catch (error) {
      console.error('Error fetching expense types:', error);
    }
  };

  const fetchExpenseGroups = async (expenseTypeId) => {
    try {
      const response = await axiosInstance.get('/master/expense-groups');
      const filteredGroups = response.data.filter(
        group => group.expenseType.expenseTypeId === parseInt(expenseTypeId)
      );
      setExpenseGroups(filteredGroups);
    } catch (error) {
      console.error('Error fetching expense groups:', error);
    }
  };

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/master/ledger');
      const transformedData = response.data.map((item, index) => ({
        id: item.ledgerId,
        serialNo: index + 1,
        ledgerName: item.ledgerName,
        bucketName: item.bucket?.bucketName,
        expenseTypeName: item.expenseType?.expenseTypeName,
        expenseGroupName: item.expenseGroup?.name,
        status: item.status || 'Active'
      }));
      setRows(transformedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch ledgers');
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
        ledgerId: editingId || 0,
        ledgerName: formData.ledgerName,
        bucket: {
          bucketId: parseInt(formData.bucketId)
        },
        expenseType: {
          expenseTypeId: parseInt(formData.expenseTypeId)
        },
        expenseGroup: {
          expenseGroupId: parseInt(formData.expenseGroupId)
        },
        status: formData.status
      };

      await axiosInstance.post('/master/ledger', apiData);
      await fetchLedgers();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ledger?')) {
      setLoading(true);
      try {
        await axiosInstance.delete(`/master/ledger/${id}`);
        await fetchLedgers();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete ledger');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (record) => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/master/ledger/${record.id}`);
      setFormData({
        ledgerName: response.data.ledgerName,
        bucketId: response.data.bucket?.bucketId.toString(),
        expenseTypeId: response.data.expenseType?.expenseTypeId.toString(),
        expenseGroupId: response.data.expenseGroup?.expenseGroupId.toString(),
        status: response.data.status || 'Active'
      });
      setEditingId(response.data.ledgerId);
      setOpenDialog(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch ledger details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      ledgerName: '',
      bucketId: '',
      expenseTypeId: '',
      expenseGroupId: '',
      status: 'Active'
    });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      ledgerName: '',
      bucketId: '',
      expenseTypeId: '',
      expenseGroupId: '',
      status: 'Active'
    });
    setEditingId(null);
  };

  return (
    <PageContainer title="Ledger" description="Manage ledgers">
      <Card>
        <CardContent sx={{ overflowX: 'hidden' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ color: '#4D4D4D' }}>Ledger</Typography>
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
              Add Ledger
            </Button>
          </Stack>

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
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
              autoHeight
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
                '& .MuiDataGrid-main': {
                  overflow: 'hidden'
                },
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
                {editingId ? 'Edit Ledger' : 'Add New Ledger'}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Ledger Name"
                    value={formData.ledgerName}
                    onChange={(e) => setFormData({ ...formData, ledgerName: e.target.value })}
                    required
                    variant="outlined"
                  />
                  
                  <FormControl fullWidth required>
                    <InputLabel>Bucket</InputLabel>
                    <Select
                      value={formData.bucketId}
                      onChange={(e) => setFormData({ ...formData, bucketId: e.target.value })}
                      label="Bucket"
                    >
                      {buckets.map((bucket) => (
                        <MenuItem key={bucket.bucketId} value={bucket.bucketId}>
                          {bucket.bucketName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Expense Type</InputLabel>
                    <Select
                      value={formData.expenseTypeId}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          expenseTypeId: e.target.value,
                          expenseGroupId: '' // Reset expense group when expense type changes
                        });
                      }}
                      label="Expense Type"
                    >
                      {expenseTypes.map((type) => (
                        <MenuItem key={type.expenseTypeId} value={type.expenseTypeId}>
                          {type.expenseTypeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Expense Group</InputLabel>
                    <Select
                      value={formData.expenseGroupId}
                      onChange={(e) => setFormData({ ...formData, expenseGroupId: e.target.value })}
                      label="Expense Group"
                      disabled={!formData.expenseTypeId}
                    >
                      {expenseGroups.map((group) => (
                        <MenuItem key={group.expenseGroupId} value={group.expenseGroupId}>
                          {group.name}
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

export default Ledger; 