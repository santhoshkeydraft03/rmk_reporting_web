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

const Plant = () => {
  // States
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    plantName: '',
    shortName: '',
    plantType: 'QUARRY',
    yardStatus: 'YES',
    status: 'Active'
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [filterData, setFilterData] = useState({
    plantType: '',
    yardStatus: '',
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
      field: 'plantName',
      headerName: 'Plant Name',
      filter: 'agTextColumnFilter',
      flex: 1.2,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'shortName',
      headerName: 'Short Name',
      filter: 'agTextColumnFilter',
      flex: 1,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'plantType',
      headerName: 'Plant Type',
      filter: 'agTextColumnFilter',
      flex: 1,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'yardStatus',
      headerName: 'Yard Status',
      width: 120,
      cellRenderer: params => {
        if (!params.value) return '';
        return (
          <Chip
            label={params.value}
            size="small"
            color={params.value === 'YES' ? 'success' : 'error'}
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
    plantName: `${rows.length} Records`,
    shortName: '',
    plantType: '',
    yardStatus: '',
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

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterData.plantType) params.append('plantType', filterData.plantType);
      if (filterData.yardStatus) params.append('yardStatus', filterData.yardStatus);
      if (filterData.status) params.append('status', filterData.status);
      
      const response = await axiosInstance.get(`/master/plants${params.toString() ? `?${params.toString()}` : ''}`);
      const transformedData = response.data.map((item, index) => ({
        id: item.plantId,
        serialNo: index + 1,
        plantName: item.plantName,
        shortName: item.shortName,
        plantType: item.plantType,
        yardStatus: item.yardStatus,
        status: item.status || 'Active'
      }));
      setOriginalRows(transformedData);
      setRows(transformedData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch plants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleFilterChange = async (field, value) => {
    const newFilterData = { ...filterData, [field]: value };
    setFilterData(newFilterData);
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (newFilterData.plantType) params.append('plantType', newFilterData.plantType);
      if (newFilterData.yardStatus) params.append('yardStatus', newFilterData.yardStatus);
      if (newFilterData.status) params.append('status', newFilterData.status);
      
      const response = await axiosInstance.get(`/master/plants${params.toString() ? `?${params.toString()}` : ''}`);
      const filteredData = response.data.map((item, index) => ({
        id: item.plantId,
        serialNo: index + 1,
        plantName: item.plantName,
        shortName: item.shortName,
        plantType: item.plantType,
        yardStatus: item.yardStatus,
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
      setError(error.response?.data?.message || 'Failed to fetch plants');
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
        plantId: editingId || 0,
        plantName: formData.plantName,
        shortName: formData.shortName,
        plantType: formData.plantType,
        yardStatus: formData.yardStatus,
        status: formData.status
      };

      await axiosInstance.post('/master/plants', apiData);
      await fetchPlants();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save plant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plant?')) {
      setLoading(true);
      try {
        await axiosInstance.delete(`/master/plants/${id}`);
        await fetchPlants();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete plant');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (record) => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/master/plants/${record.id}`);
      setFormData({
        plantName: response.data.plantName,
        shortName: response.data.shortName,
        plantType: response.data.plantType,
        yardStatus: response.data.yardStatus,
        status: response.data.status || 'Active'
      });
      setEditingId(response.data.plantId);
      setOpenDialog(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch plant details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      plantName: '',
      shortName: '',
      plantType: 'QUARRY',
      yardStatus: 'YES',
      status: 'Active'
    });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      plantName: '',
      shortName: '',
      plantType: 'QUARRY',
      yardStatus: 'YES',
      status: 'Active'
    });
    setEditingId(null);
  };

  return (
    <PageContainer title="Plant" description="Manage plants">
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
              Plant Master
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
              Add Plant
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
                <InputLabel>Plant Type</InputLabel>
                <Select
                  value={filterData.plantType}
                  onChange={(e) => handleFilterChange('plantType', e.target.value)}
                  label="Plant Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="QUARRY">Quarry</MenuItem>
                  <MenuItem value="CRUSHER">Crusher</MenuItem>
                  <MenuItem value="OFFICE">Office</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Yard Status</InputLabel>
                <Select
                  value={filterData.yardStatus}
                  onChange={(e) => handleFilterChange('yardStatus', e.target.value)}
                  label="Yard Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="YES">Yes</MenuItem>
                  <MenuItem value="NO">No</MenuItem>
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
              {editingId ? 'Edit Plant' : 'Add New Plant'}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Plant Name"
                  value={formData.plantName}
                  onChange={(e) => setFormData({ ...formData, plantName: e.target.value })}
                  required
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Short Name"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  required
                  variant="outlined"
                />
                <FormControl fullWidth required>
                  <InputLabel>Plant Type</InputLabel>
                  <Select
                    value={formData.plantType}
                    onChange={(e) => setFormData({ ...formData, plantType: e.target.value })}
                    label="Plant Type"
                  >
                    <MenuItem value="QUARRY">Quarry</MenuItem>
                    <MenuItem value="CRUSHER">Crusher</MenuItem>
                    <MenuItem value="OFFICE">Office</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Yard Status</InputLabel>
                  <Select
                    value={formData.yardStatus}
                    onChange={(e) => setFormData({ ...formData, yardStatus: e.target.value })}
                    label="Yard Status"
                  >
                    <MenuItem value="YES">Yes</MenuItem>
                    <MenuItem value="NO">No</MenuItem>
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

export default Plant; 