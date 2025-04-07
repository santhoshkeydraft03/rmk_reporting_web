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

const ExpenseGroup = () => {
  // States
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
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
  const [filterData, setFilterData] = useState({
    expenseTypeId: '',
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
      field: 'expenseGroup',
      headerName: 'Expense Group',
      filter: 'agTextColumnFilter',
      flex: 1.2,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'expenseTypeName',
      headerName: 'Expense Type',
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
    expenseGroup: `${rows.length} Records`,
    expenseTypeName: '',
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

  // Fetch all expense groups
  const fetchExpenseGroups = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterData.expenseTypeId) params.append('expenseTypeId', filterData.expenseTypeId);
      if (filterData.status) params.append('status', filterData.status);
      
      const response = await axiosInstance.get(`/master/expense-groups${params.toString() ? `?${params.toString()}` : ''}`);
      const transformedData = response.data.map((item, index) => ({
        id: item.expenseGroupId,
        serialNo: index + 1,
        expenseGroup: item.name,
        expenseTypeName: item.expenseType?.expenseTypeName,
        status: item.status || 'Active'
      }));
      setOriginalRows(transformedData);
      setRows(transformedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch expense groups');
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
      setError('Failed to fetch expense types');
    }
  };

  useEffect(() => {
    fetchExpenseTypes();
    fetchExpenseGroups();
  }, []);

  const handleFilterChange = async (field, value) => {
    const newFilterData = { ...filterData, [field]: value };
    setFilterData(newFilterData);
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (newFilterData.expenseTypeId) params.append('expenseTypeId', newFilterData.expenseTypeId);
      if (newFilterData.status) params.append('status', newFilterData.status);
      
      const response = await axiosInstance.get(`/master/expense-groups${params.toString() ? `?${params.toString()}` : ''}`);
      const filteredData = response.data.map((item, index) => ({
        id: item.expenseGroupId,
        serialNo: index + 1,
        expenseGroup: item.name,
        expenseTypeName: item.expenseType?.expenseTypeName,
        status: item.status || 'Active'
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
      setError(error.response?.data?.message || 'Failed to fetch expense groups');
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
        expenseGroupId: editingId || 0,
        name: formData.expenseGroup,
        expenseType: {
          expenseTypeId: parseInt(formData.expenseTypeId)
        },
        status: formData.status
      };

      await axiosInstance.post('/master/expense-groups', apiData);
      await fetchExpenseGroups();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save expense group');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense group?')) {
      setLoading(true);
      try {
        await axiosInstance.delete(`/master/expense-groups/${id}`);
        await fetchExpenseGroups();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete expense group');
      } finally {
        setLoading(false);
      }
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

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
              Expense Group
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
              Add Expense Group
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
            <Grid item xs={12} sm={12} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={filterData.expenseTypeId}
                  onChange={(e) => handleFilterChange('expenseTypeId', e.target.value)}
                  label="Expense Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {expenseTypes.map((type) => (
                    <MenuItem key={type.expenseTypeId} value={type.expenseTypeId}>
                      {type.expenseTypeName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
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
      </Box>
    </PageContainer>
  );
};

export default ExpenseGroup; 
