import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import axiosInstance from '../../utils/axios';
import PageContainer from '../../components/container/PageContainer';
import ReportGrid from '../../components/ReportGrid';

const InwardConsumptionSlurry = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const [quarries, setQuarries] = useState([]);
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    values: {
      inward: {},
      scalp: {},
      consumption: {},
      materialSwap: {}
    }
  });

  const columnDefs = useMemo(() => [
    {
      field: 'serialNo',
      headerName: '#',
      width: 70,
      filter: true,
      flex: 0.5,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'particulars',
      headerName: 'Particulars',
      filter: 'agTextColumnFilter',
      flex: 2,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'quarryName',
      headerName: 'Quarry',
      filter: 'agTextColumnFilter',
      flex: 1.5,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'tonnage',
      headerName: 'Tonnage (MT)',
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'numericColumn',
      valueFormatter: params => params.value?.toLocaleString('en-IN') || '',
      cellStyle: { padding: '0 4px', textAlign: 'right' }
    }
  ], []);

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
    rowSelection: 'multiple',
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(row => 
      row.particulars?.toLowerCase().includes(query) ||
      row.quarryName?.toLowerCase().includes(query) ||
      String(row.tonnage).includes(query)
    );
  }, [data, searchQuery]);

  const pinnedBottomRowData = useMemo(() => [{
    serialNo: 'Total',
    particulars: `${filteredData.length} Records`,
    quarryName: '',
    tonnage: filteredData.reduce((sum, row) => sum + (row.tonnage || 0), 0)
  }], [filteredData]);

  const fetchQuarries = async () => {
    try {
      const response = await axiosInstance.get('/master/plants/quarries');
      // Map the response to get only required fields
      const quarryData = response.data.map(quarry => ({
        id: quarry.plantId,
        name: quarry.plantName,
        shortName: quarry.shortName
      }));
      setQuarries(quarryData);
    } catch (error) {
      showNotification('Failed to fetch quarries', 'error');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.get('/input/inward-consumption-slurry');
      const transformedData = response.data.map((item, index) => ({
        id: item.id || index + 1,
        serialNo: index + 1,
        particulars: item.particulars,
        quarryName: item.quarryName,
        tonnage: Number(item.tonnage)
      }));
      setData(transformedData);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (openDialog) {
      fetchQuarries();
    }
  }, [openDialog]);

  const calculateRowTotal = (values) => {
    return Object.values(values).reduce((sum, value) => sum + (Number(value) || 0), 0);
  };

  const handleValueChange = (rowId, quarryId, value) => {
    setFormData(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [rowId]: {
          ...prev.values[rowId],
          [quarryId]: value
        }
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.month || !formData.year) {
      showNotification('Please select month and year', 'error');
      return;
    }

    const materialSwapTotal = calculateRowTotal(formData.values.materialSwap);
    if (materialSwapTotal !== 0) {
      showNotification('Material Swap total must be zero', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Transform data to match backend structure
      const transformedData = [];
      
      // Process each row type (inward, scalp, consumption, materialSwap)
      quarries.forEach(quarry => {
        transformedData.push({
          materialName: 'Inward',
          quarryName: quarry.shortName || quarry.name,
          tonnage: Number(formData.values.inward[quarry.id] || 0),
          month: formData.month,
          year: formData.year
        });
        transformedData.push({
          materialName: 'Scalp',
          quarryName: quarry.shortName || quarry.name,
          tonnage: Number(formData.values.scalp[quarry.id] || 0),
          month: formData.month,
          year: formData.year
        });
        transformedData.push({
          materialName: 'Consumption',
          quarryName: quarry.shortName || quarry.name,
          tonnage: Number(formData.values.consumption[quarry.id] || 0),
          month: formData.month,
          year: formData.year
        });
        transformedData.push({
          materialName: 'Material Swap',
          quarryName: quarry.shortName || quarry.name,
          tonnage: Number(formData.values.materialSwap[quarry.id] || 0),
          month: formData.month,
          year: formData.year
        });
      });

      await axiosInstance.post('/input/import-inward-consumption-slurry', transformedData);
      showNotification('Data saved successfully', 'success');
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to save data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      month: '',
      year: new Date().getFullYear(),
      values: {
        inward: {},
        scalp: {},
        consumption: {},
        materialSwap: {}
      }
    });
  };

  const showNotification = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleExport = () => {
    try {
      // Create worksheet data
      const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
        'Particulars': item.particulars,
        'Quarry': item.quarryName,
        'Tonnage (MT)': item.tonnage
      })));

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inward Consumption Slurry');

      // Generate file name with current date
      const date = new Date();
      const fileName = `Inward_Consumption_Slurry_${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, fileName);
      showNotification('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export data', 'error');
    }
  };

  return (
    <PageContainer title="Inward & Consumption Slurry" description="Manage inward & consumption slurry">
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
              Inward & Consumption Slurry
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              size="medium"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={data.length === 0}
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
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                bgcolor: '#5d87ff',
                '&:hover': { bgcolor: '#4570ea' },
                boxShadow: 'none'
              }}
            >
              Add New
            </Button>
          </Stack>
        </Stack>

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
            <Grid item xs={12} sm={12} md={8}>
              <Stack direction="row" spacing={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={(newValue) => setFromDate(newValue)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label="To Date"
                    value={toDate}
                    onChange={(newValue) => setToDate(newValue)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </LocalizationProvider>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#edf2f6',
                    },
                    '&:hover fieldset': {
                      borderColor: '#5d87ff',
                    },
                  },
                }}
              />
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
            position: 'relative',
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
              },
              '& .ag-overlay-no-rows-wrapper': {
                display: loading ? 'none' : 'flex'
              }
            }
          }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 999
              }}
            >
              <CircularProgress size={40} sx={{ mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                Loading data...
              </Typography>
            </Box>
          )}
          <ReportGrid
            columnDefs={columnDefs}
            rowData={loading ? [] : filteredData}
            gridOptions={gridOptions}
            height="100%"
            pinnedBottomRowData={loading ? [] : pinnedBottomRowData}
          />
        </Card>

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              maxWidth: '800px'
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              borderBottom: '1px solid #e5e5e5',
              p: 2,
              color: '#2B3674',
              fontSize: '1.1rem',
              fontWeight: 600
            }}
          >
            Inward & Consumption Entry
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <FormControl 
                  fullWidth 
                  size="small"
                >
                  <Select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) return "Month";
                      return new Date(0, value - 1).toLocaleString('default', { month: 'long' });
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <MenuItem key={month} value={month}>
                          {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl 
                  fullWidth 
                  size="small"
                >
                  <Select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    displayEmpty
                    renderValue={(value) => value || "Year"}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TableContainer 
              component={Paper} 
              sx={{ 
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#2B3674' }}>
                    <TableCell 
                      colSpan={quarries.length + 2} 
                      align="center" 
                      sx={{ 
                        color: 'white',
                        py: 1.5,
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      Inward & Consumption [MT]
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#F8FAFF' }}>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      color: '#2B3674',
                      py: 1,
                      fontSize: '0.875rem'
                    }}>
                      Particulars
                    </TableCell>
                    {quarries.map(quarry => (
                      <TableCell 
                        key={quarry.id} 
                        align="center"
                        sx={{ 
                          fontWeight: 600, 
                          color: '#2B3674',
                          py: 1,
                          fontSize: '0.875rem'
                        }}
                      >
                        {quarry.shortName || quarry.name}
                      </TableCell>
                    ))}
                    <TableCell 
                      align="center"
                      sx={{ 
                        fontWeight: 600, 
                        color: '#2B3674',
                        py: 1,
                        fontSize: '0.875rem'
                      }}
                    >
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {['inward', 'scalp', 'consumption', 'materialSwap'].map(row => (
                    <TableRow key={row}>
                      <TableCell sx={{ 
                        color: '#2B3674',
                        py: 0.75,
                        fontSize: '0.875rem'
                      }}>
                        {row.charAt(0).toUpperCase() + row.slice(1)}
                      </TableCell>
                      {quarries.map(quarry => (
                        <TableCell key={quarry.id} align="center" sx={{ py: 0.75 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={formData.values[row][quarry.id] || ''}
                            onChange={(e) => handleValueChange(row, quarry.id, e.target.value)}
                            sx={{ 
                              width: '85px',
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: '#FFF9C4',
                                height: '32px',
                                '& fieldset': {
                                  borderColor: '#E5E5E5'
                                },
                                '&:hover fieldset': {
                                  borderColor: '#5D87FF'
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#5D87FF'
                                }
                              },
                              '& .MuiOutlinedInput-input': { 
                                textAlign: 'center',
                                py: 0,
                                fontSize: '0.875rem',
                                '&::-webkit-inner-spin-button': {
                                  display: 'none'
                                }
                              }
                            }}
                            inputProps={{ 
                              min: 0,
                              style: { 
                                color: '#2B3674',
                                padding: '4px 8px'
                              }
                            }}
                          />
                        </TableCell>
                      ))}
                      <TableCell 
                        align="center"
                        sx={{ 
                          color: '#2B3674',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          py: 0.75
                        }}
                      >
                        {calculateRowTotal(formData.values[row])}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions 
            sx={{ 
              p: 2,
              borderTop: '1px solid #E5E5E5',
              gap: 1
            }}
          >
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                color: '#5D87FF',
                borderColor: '#5D87FF',
                px: 2,
                '&:hover': {
                  borderColor: '#4570EA',
                  backgroundColor: 'rgba(93, 135, 255, 0.1)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained"
              size="small"
              sx={{
                backgroundColor: '#5D87FF',
                borderRadius: '8px',
                textTransform: 'none',
                px: 2,
                '&:hover': {
                  backgroundColor: '#4570EA'
                }
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
};

export default InwardConsumptionSlurry; 