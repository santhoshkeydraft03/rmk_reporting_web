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
import { DataGrid } from '@mui/x-data-grid';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../components/container/PageContainer';
import axiosInstance from '../../utils/axios';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ReportGrid from '../../components/ReportGrid';

const Ledger = () => {
  // States
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
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
  const [filterData, setFilterData] = useState({
    bucketId: '',
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
      field: 'ledgerName',
      headerName: 'Ledger Name',
      filter: 'agTextColumnFilter',
      flex: 1.2,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'bucketName',
      headerName: 'Bucket Name',
      filter: 'agTextColumnFilter',
      flex: 1,
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
      field: 'expenseGroupName',
      headerName: 'Expense Group',
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
    ledgerName: `${rows.length} Records`,
    bucketName: '',
    expenseTypeName: '',
    expenseGroupName: '',
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

  const generateDummyData = () => {
    const dummyData = [];
    const bucketNames = ['Operations', 'Marketing', 'Sales', 'IT', 'HR', 'Finance', 'Admin', 'Legal'];
    const expenseTypes = ['Travel', 'Office Supplies', 'Utilities', 'Rent', 'Salaries', 'Equipment', 'Training', 'Software'];
    const expenseGroups = ['Domestic', 'International', 'Regular', 'One-time', 'Monthly', 'Quarterly', 'Annual', 'Project-based'];
    
    for (let i = 0; i < 100; i++) {
      const bucketId = Math.floor(Math.random() * 8) + 1;
      const expenseTypeId = Math.floor(Math.random() * 8) + 1;
      const expenseGroupId = Math.floor(Math.random() * 8) + 1;
      
      dummyData.push({
        ledgerId: i + 1,
        ledgerName: `Ledger ${i + 1} - ${bucketNames[bucketId - 1]}`,
        bucket: {
          bucketId: bucketId,
          bucketName: bucketNames[bucketId - 1]
        },
        expenseType: {
          expenseTypeId: expenseTypeId,
          expenseTypeName: expenseTypes[expenseTypeId - 1]
        },
        expenseGroup: {
          expenseGroupId: expenseGroupId,
          name: expenseGroups[expenseGroupId - 1]
        },
        status: Math.random() > 0.2 ? 'Active' : 'Inactive' // 80% Active, 20% Inactive
      });
    }
    return dummyData;
  };

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterData.bucketId) params.append('bucketId', filterData.bucketId);
      if (filterData.expenseTypeId) params.append('expenseTypeId', filterData.expenseTypeId);
      if (filterData.status) params.append('status', filterData.status === 'Active' ? 1 : 0);
      
      const response = await axiosInstance.get(`/master/ledger${params.toString() ? `?${params.toString()}` : ''}`);
      const fetchedData = response.data.map((item, index) => ({
        id: item.ledgerId,
        serialNo: index + 1,
        ledgerName: item.ledgerName,
        bucketName: item.bucket?.bucketName,
        expenseTypeName: item.expenseType?.expenseTypeName,
        expenseGroupName: item.expenseGroup?.name,
        status: item.status === 1 ? 'Active' : 'Inactive'
      }));
      setOriginalRows(fetchedData);
      setRows(fetchedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch ledgers');
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
      if (newFilterData.bucketId) params.append('bucketId', newFilterData.bucketId);
      if (newFilterData.expenseTypeId) params.append('expenseTypeId', newFilterData.expenseTypeId);
      if (newFilterData.status) params.append('status', newFilterData.status === 'Active' ? 1 : 0);
      
      const response = await axiosInstance.get(`/master/ledger${params.toString() ? `?${params.toString()}` : ''}`);
      const filteredData = response.data.map((item, index) => ({
        id: item.ledgerId,
        serialNo: index + 1,
        ledgerName: item.ledgerName,
        bucketName: item.bucket?.bucketName,
        expenseTypeName: item.expenseType?.expenseTypeName,
        expenseGroupName: item.expenseGroup?.name,
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
      setError(error.response?.data?.message || 'Failed to fetch ledgers');
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
        status: formData.status === 'Active' ? 1 : 0
      };

      console.log('Submitting ledger data:', apiData); // Debug log
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
        status: response.data.status === 1 ? 'Active' : 'Inactive'
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
    <PageContainer title="Ledger Master" description="Manage ledger entries">
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
              Ledger Master
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
              Add Ledger
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
                <InputLabel>Bucket</InputLabel>
                <Select
                  value={filterData.bucketId}
                  onChange={(e) => handleFilterChange('bucketId', e.target.value)}
                  label="Bucket"
                >
                  <MenuItem value="">All Buckets</MenuItem>
                  {buckets.map((bucket) => (
                    <MenuItem key={bucket.bucketId} value={bucket.bucketId}>
                      {bucket.bucketName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
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
      </Box>
    </PageContainer>
  );
};

export default Ledger; 
