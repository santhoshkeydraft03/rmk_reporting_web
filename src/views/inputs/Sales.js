import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Checkbox,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axiosInstance from '../../utils/axios';
import PageContainer from '../../components/container/PageContainer';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';

const Sales = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isMonthLocked, setIsMonthLocked] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' // 'error', 'warning', 'info', 'success'
  });

  const columns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'productName', headerName: 'Product', flex: 1 },
    { field: 'quarryName', headerName: 'Quarry', flex: 1 },
    { field: 'salesInTons', headerName: 'Sales In Tons', flex: 1, type: 'number' },
    { field: 'salesInValue', headerName: 'Sales In Value', flex: 1, type: 'number' },
    { field: 'productionStatus', headerName: 'Production/Stock', flex: 1 },
    { field: 'billingStatus', headerName: 'Billed Or Unbilled', flex: 1 },
    { field: 'paymentType', headerName: 'GST/CASH', flex: 1 },
    { field: 'gstValue', headerName: 'GST Value', flex: 1, type: 'number' }
  ];

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/input/sales');
      const transformedData = response.data.map((sale, index) => ({
        id: sale.salesId,
        productName: sale.productName,
        quarryName: sale.quarryName,
        salesInTons: sale.salesInTons,
        salesInValue: Number(sale.salesInValue),
        productionStatus: sale.productionStatus,
        billingStatus: sale.billingStatus,
        paymentType: sale.paymentType,
        gstValue: Number(sale.gstValue)
      }));
      setSalesData(transformedData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      showNotification('Failed to fetch sales data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showNotification('Please upload only Excel files (.xlsx or .xls)', 'error');
      return;
    }
    setSelectedFile(file);
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    
    try {
      setLoading(true);
      const data = await readExcelFile(selectedFile);
      setPreviewData(data);
    } catch (err) {
      console.error('Preview Error:', err);
      showNotification('Failed to preview file. Please check the file format.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          const data = [];
          
          // Start from row 2 (skip header)
          for(let row = 2; row <= range.e.r; row++) {
            const rowData = {
              id: row - 1,
              productName: worksheet[`A${row}`]?.v || '',
              quarryName: worksheet[`B${row}`]?.v || '',
              salesInTons: worksheet[`C${row}`]?.v || 0,
              salesInValue: worksheet[`D${row}`]?.v || 0,
              productionStatus: worksheet[`E${row}`]?.v || '',
              billingStatus: worksheet[`F${row}`]?.v || '',
              paymentType: worksheet[`G${row}`]?.v || '',
              gstValue: worksheet[`H${row}`]?.v || 0
            };
            
            // Only add rows that have a product
            if (rowData.productName) {
              data.push(rowData);
            }
          }
          
          resolve(data);
        } catch (err) {
          console.error('Excel parsing error:', err);
          reject(err);
        }
      };
      
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDiscard = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setSelectedRows([]);
    setSelectedDate(null);
    setLoading(false);
    setShowUploadSection(false);
  };

  const checkMonthDataExists = async (month, year) => {
    try {
      const response = await axiosInstance.get('/input/check-sales-exists', {
        params: {
          month: month,
          year: year
        }
      });
      return response.data; // The response is directly a boolean value
    } catch (error) {
      console.error('Error checking month data:', error);
      return false;
    }
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
    
    // Double-check before submission
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

      const salesData = dataToSubmit.map(({id, ...row}) => ({
        ...row,
        month,
        year
      }));

      const validationResult = validateSalesData(salesData);

      if (!validationResult.isValid) {
        showNotification(validationResult.errors.join('\n'), 'error');
        setIsMonthLocked(true);
        return;
      }

      const response = await axiosInstance.post('/input/import-sales', salesData);

      if (response.status === 200) {
        showNotification('Sales data saved successfully', 'success');
        handleDiscard();
        fetchSalesData();
      }
    } catch (error) {
      console.error('Submit Error:', error);
      showNotification(
        error.response?.data?.message || 'Failed to save sales data', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return;
    
    const updatedData = previewData.filter(row => !selectedRows.includes(row.id));
    // Update the IDs to maintain sequence
    const reindexedData = updatedData.map((row, index) => ({
      ...row,
      id: index + 1
    }));
    
    setPreviewData(reindexedData);
    setSelectedRows([]);
  };

  const validateSalesData = (dataToValidate) => {
    const errors = [];

    // Rule 1: Check for "Unbilled CASH" combinations
    const unbilledCashEntries = dataToValidate.filter(
      row => row.billingStatus === "Unbilled" && row.paymentType === "CASH"
    );
    if (unbilledCashEntries.length > 0) {
      errors.push("Unbilled CASH entries are not allowed");
    }

    // Rule 2: Check for duplicate "Unbilled GST" entries with same product and quarry
    const unbilledGSTEntries = dataToValidate.filter(
      row => row.billingStatus === "Unbilled" && row.paymentType === "GST"
    );
    
    const unbilledGSTCombinations = new Set();
    unbilledGSTEntries.forEach(row => {
      const key = `${row.productName}-${row.quarryName}-${row.billingStatus}-${row.paymentType}`;
      if (unbilledGSTCombinations.has(key)) {
        errors.push(`Duplicate Unbilled GST entry found for Product: ${row.productName}, Quarry: ${row.quarryName}`);
      }
      unbilledGSTCombinations.add(key);
    });

    // Rule 3: Check for duplicate "Billed" combinations
    const billedEntries = dataToValidate.filter(row => row.billingStatus === "Billed");
    const billedCombinations = new Set();
    billedEntries.forEach(row => {
      const key = `${row.productName}-${row.quarryName}-${row.billingStatus}-${row.paymentType}`;
      if (billedCombinations.has(key)) {
        errors.push(`Duplicate Billed entry found for Product: ${row.productName}, Quarry: ${row.quarryName}, Payment Type: ${row.paymentType}`);
      }
      billedCombinations.add(key);
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return (
    <PageContainer title="Sales Input" description="Manage sales data">
      <Card>
        <CardContent>
          {!showUploadSection ? (
            <Box>
              <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
                Sales Input
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
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

                <Button
                  variant="contained"
                  color="primary"
                >
                  EXPORT
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<FileUploadIcon />}
                  onClick={() => setShowUploadSection(true)}
                >
                  IMPORT
                </Button>
              </Stack>

              <Box>
                <DataGrid
                  rows={salesData}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  checkboxSelection
                  disableSelectionOnClick
                  autoHeight
                  loading={loading}
                  sx={{
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
                    '& .MuiDataGrid-columnHeaderCheckbox': {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 !important', // Remove extra padding
                    },
                    border: '1px solid #E5E5E5',
                    borderRadius: '12px',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  }}
                />
              </Box>
            </Box>
          ) : (
            // File upload section - simplified without tabs
            <Box>
              <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
                Sales File Upload
              </Typography>

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
                      color="primary"
                      sx={{
                        minWidth: '150px'
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
                      color="primary"
                    >
                      PREVIEW
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleDiscard}
                    >
                      DISCARD
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
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
                            alignItems: 'center', 
                            ml: 1 
                          }}
                        >
                          * Please select month and year
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  <Box sx={{ height: 400, width: '100%', mb: 3 }}>
                    <DataGrid
                      rows={previewData}
                      columns={columns}
                      pageSize={5}
                      rowsPerPageOptions={[5, 10, 20]}
                      checkboxSelection
                      disableSelectionOnClick
                      onSelectionModelChange={(newSelection) => {
                        setSelectedRows(newSelection);
                      }}
                      selectionModel={selectedRows}
                    />
                  </Box>
                  
                  <Stack 
                    direction="row" 
                    spacing={2} 
                    justifyContent="center"
                    sx={{ mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading || !selectedDate}
                      color="primary"
                    >
                      SUBMIT
                    </Button>

                    <Button
                      variant="contained"
                      onClick={handleDeleteSelected}
                      disabled={selectedRows.length === 0 || loading}
                      color="warning"
                    >
                      DELETE SELECTED ({selectedRows.length})
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleDiscard}
                      disabled={loading}
                      color="primary"
                    >
                      DISCARD
                    </Button>
                  </Stack>
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
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

export default Sales;