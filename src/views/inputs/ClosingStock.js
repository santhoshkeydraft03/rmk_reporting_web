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
  Grid,
  InputAdornment,
  TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import axiosInstance from '../../utils/axios';
import PageContainer from '../../components/container/PageContainer';
import ReportGrid from '../../components/ReportGrid';
import * as XLSX from 'xlsx';

const ClosingStock = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isMonthLocked, setIsMonthLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
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
      field: 'materialName',
      headerName: 'Material Name',
      filter: 'agTextColumnFilter',
      flex: 2,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'quarry',
      headerName: 'Quarry',
      filter: 'agTextColumnFilter',
      flex: 1.5,
      cellStyle: { padding: '0 4px' }
    },
    {
      field: 'closingStock',
      headerName: 'Closing Stock (In TONs)',
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

  const filteredStockData = useMemo(() => {
    if (!searchQuery) return stockData;
    
    const query = searchQuery.toLowerCase();
    return stockData.filter(row => 
      row.materialName?.toLowerCase().includes(query) ||
      row.quarry?.toLowerCase().includes(query) ||
      String(row.closingStock).includes(query)
    );
  }, [stockData, searchQuery]);

  const pinnedBottomRowData = useMemo(() => [{
    serialNo: 'Total',
    materialName: `${filteredStockData.length} Records`,
    quarry: '',
    closingStock: filteredStockData.reduce((sum, row) => sum + (row.closingStock || 0), 0)
  }], [filteredStockData]);

  const previewPinnedBottomRowData = useMemo(() => previewData ? [{
    serialNo: 'Total',
    materialName: `${previewData.length} Records`,
    quarry: '',
    closingStock: previewData.reduce((sum, row) => sum + (row.closingStock || 0), 0)
  }] : [], [previewData]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/input/closing-stock');
      const transformedData = response.data.map((stock, index) => ({
        id: stock.id || index + 1,
        serialNo: index + 1,
        materialName: stock.materialName,
        quarry: stock.quarryName,
        closingStock: Number(stock.closingStockInTons)
      }));
      setStockData(transformedData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      showNotification('Failed to fetch stock data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload only Excel files (.xlsx or .xls)');
      return;
    }
    setSelectedFile(file);
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[4]];
          
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          const data = [];
          
          // Start from row 2 (skip header)
          for(let row = 2; row <= range.e.r+1; row++) {
            const rowData = {
              id: row - 1,
              serialNo: row - 1,
              materialName: worksheet[`A${row}`]?.v || '',
              quarry: worksheet[`B${row}`]?.v || '',
              closingStock: worksheet[`C${row}`]?.v || 0
            };
            
            // Only add rows that have a material name
            if (rowData.materialName) {
              data.push(rowData);
            }
          }
          
          // Reindex serial numbers after filtering empty rows
          const reindexedData = data.map((row, index) => ({
            ...row,
            id: index + 1,
            serialNo: index + 1
          }));
          
          resolve(reindexedData);
        } catch (err) {
          console.error('Excel parsing error:', err);
          reject(err);
        }
      };
      
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    
    try {
      setLoading(true);
      const data = await readExcelFile(selectedFile);
      setPreviewData(data);
    } catch (err) {
      console.error('Preview Error:', err);
      alert('Failed to preview file. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setSelectedRows([]);
    setSelectedDate(null);
    setLoading(false);
    setShowUploadSection(false);
  };

  const showNotification = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const checkMonthDataExists = async (month, year) => {
    try {
      const response = await axiosInstance.get('/input/check-closing-stock-exists', {
        params: {
          month: month,
          year: year
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking month data:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!previewData) {
      showNotification('Please preview data before submitting', 'warning');
      return;
    }
    
    if (!selectedDate) {
      showNotification('Please select both month and year before submitting', 'warning');
      return;
    }

    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = String(selectedDate.getFullYear());
    
    const exists = await checkMonthDataExists(month, year);
    if (exists) {
      showNotification(`Data already exists for ${month}/${year}. Cannot submit.`, 'error');
      setIsMonthLocked(true);
      return;
    }

    try {
      setLoading(true);
      
      const dataToSubmit = selectedRows.length > 0 
        ? previewData.filter(row => selectedRows.includes(row.id))
        : previewData;

      const stockData = dataToSubmit.map(({id, ...row}) => ({
        productName: row.materialName,
        quarryName: row.quarry,
        closingStockInTons: row.closingStock,
        month: month,
        year: year
      }));

      const response = await axiosInstance.post('/input/import-closing-stock', stockData);

      if (response.status === 200) {
        showNotification('Stock data saved successfully', 'success');
        handleDiscard();
        fetchStockData();
      }
    } catch (error) {
      console.error('Submit Error:', error);
      showNotification(
        error.response?.data?.message || 'Failed to save stock data',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return;
    
    const updatedData = previewData.filter(row => !selectedRows.includes(row.id));
    const reindexedData = updatedData.map((row, index) => ({
      ...row,
      id: index + 1
    }));
    
    setPreviewData(reindexedData);
    setSelectedRows([]);
  };

  const handleDateChange = async (newValue) => {
    setSelectedDate(newValue);
    
    if (newValue) {
      const month = String(newValue.getMonth() + 1).padStart(2, '0');
      const year = String(newValue.getFullYear());
      
      const exists = await checkMonthDataExists(month, year);
      setIsMonthLocked(exists);
      
      if (exists) {
        showNotification(
          `Data already exists for ${month}/${year}. Please select a different month.`,
          'warning'
        );
      }
    } else {
      setIsMonthLocked(false);
    }
  };

  return (
    <PageContainer title="Closing Stock" description="Manage closing stock">
      <Box sx={{ p: 0 }}>
          {!showUploadSection ? (
          <>
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
                Closing Stock
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
                  startIcon={<FileUploadIcon />}
                  onClick={() => setShowUploadSection(true)}
                  sx={{
                    bgcolor: '#5d87ff',
                    '&:hover': { bgcolor: '#4570ea' },
                    boxShadow: 'none'
                  }}
                >
                  Import
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
                rowData={filteredStockData}
                gridOptions={gridOptions}
                height="100%"
                pinnedBottomRowData={pinnedBottomRowData}
              />
            </Card>
          </>
          ) : (
            <Box>
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
                  fontSize: '0.875rem'
                }
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.25rem' }}>
                Closing Stock File Upload
              </Typography>
            </Stack>

              {!selectedFile ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minHeight: '400px',
                  justifyContent: 'center'
                }}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      component="span"
                      variant="contained"
                    sx={{
                      minWidth: '150px',
                      bgcolor: '#5d87ff',
                      '&:hover': { bgcolor: '#4570ea' },
                      boxShadow: 'none'
                    }}
                    >
                      CHOOSE FILE
                    </Button>
                  </label>
                </Box>
              ) : !previewData ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ mb: 3 }}>
                    File Name: {selectedFile.name}
                  </Typography>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      onClick={handlePreview}
                    sx={{
                      bgcolor: '#5d87ff',
                      '&:hover': { bgcolor: '#4570ea' },
                      boxShadow: 'none'
                    }}
                    >
                      PREVIEW
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleDiscard}
                    sx={{
                      color: '#5D87FF',
                      borderColor: '#5D87FF',
                      '&:hover': {
                        borderColor: '#4570EA',
                      }
                    }}
                    >
                      DISCARD
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <>
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Month and Year"
                          value={selectedDate}
                          onChange={handleDateChange}
                          slotProps={{ textField: { size: 'small' } }}
                          views={['month', 'year']}
                          openTo="month"
                        />
                      </LocalizationProvider>
                      
                      {!selectedDate && (
                        <Typography 
                          variant="caption" 
                          color="error.main"
                          sx={{ 
                            display: 'flex', 
                          alignItems: 'center'
                          }}
                        >
                          * Please select month and year
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                <Card 
                  sx={{ 
                    height: 400,
                    borderRadius: '12px',
                    border: '1px solid #edf2f6',
                    boxShadow: 'none',
                    overflow: 'hidden',
                    mb: 3,
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
                    rowData={previewData}
                    gridOptions={gridOptions}
                    height="100%"
                    pinnedBottomRowData={previewPinnedBottomRowData}
                    onSelectionChanged={(event) => {
                      const selectedNodes = event.api.getSelectedNodes();
                      const selectedIds = selectedNodes.map(node => node.data.id);
                      setSelectedRows(selectedIds);
                    }}
                  />
                </Card>
                  
                  <Stack 
                    direction="row" 
                    spacing={2} 
                    justifyContent="center"
                  >
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading || !selectedDate}
                    sx={{
                      bgcolor: '#5d87ff',
                      '&:hover': { bgcolor: '#4570ea' },
                      boxShadow: 'none'
                    }}
                    >
                      SUBMIT
                    </Button>

                    <Button
                      variant="contained"
                      onClick={handleDeleteSelected}
                      disabled={selectedRows.length === 0 || loading}
                      color="warning"
                    sx={{
                      boxShadow: 'none'
                    }}
                    >
                      DELETE SELECTED ({selectedRows.length})
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleDiscard}
                      disabled={loading}
                    sx={{
                      color: '#5D87FF',
                      borderColor: '#5D87FF',
                      '&:hover': {
                        borderColor: '#4570EA',
                      }
                    }}
                    >
                      DISCARD
                    </Button>
                  </Stack>
                </>
              )}
            </Box>
          )}
      </Box>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default ClosingStock; 