import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import axiosInstance from '../../utils/axios';
import PageContainer from '../../components/container/PageContainer';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';

const OtherIncomesInput = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [incomesData, setIncomesData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isMonthLocked, setIsMonthLocked] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const columns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'incomeName', headerName: 'Income Name', flex: 1 },
    { field: 'amount', headerName: 'Amount', flex: 1, type: 'number' }
  ];

  const fetchIncomesData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/input/income');
      const transformedData = response.data.map((income, index) => ({
        id: income.id || index + 1,
        incomeName: income.incomeName,
        amount: Number(income.amount)
      }));
      setIncomesData(transformedData);
    } catch (error) {
      console.error('Error fetching incomes data:', error);
      alert('Failed to fetch incomes data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomesData();
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
          const worksheet = workbook.Sheets[workbook.SheetNames[2]];
          
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          const data = [];
          
          // Start from row 2 (skip header)
          for(let row = 2; row <= range.e.r+1; row++) {
            const rowData = {
              id: row - 1,
              incomeName: worksheet[`A${row}`]?.v || '',
              amount: worksheet[`B${row}`]?.v || 0
            };
            
            // Only add rows that have an income name
            if (rowData.incomeName) {
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
      const response = await axiosInstance.get('/input/check-income-exists', {
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

      const incomesData = dataToSubmit.map(({id, ...row}) => ({
        incomeType: row.incomeName,
        amount: row.amount,
        month: month,
        year: year
      }));

      const response = await axiosInstance.post('/input/import-income', incomesData);

      if (response.status === 200) {
        showNotification('Income data saved successfully', 'success');
        handleDiscard();
        fetchIncomesData();
      }
    } catch (error) {
      console.error('Submit Error:', error);
      showNotification(
        error.response?.data?.message || 'Failed to save income data',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Other Incomes Input" description="Manage other incomes data">
      <Card>
        <CardContent>
          {!showUploadSection ? (
            <Box>
              <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
                Other Incomes Input
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
                  rows={incomesData}
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
                      borderBottom: '2px solid #E5E5E5'
                    },
                    border: '1px solid #E5E5E5',
                    borderRadius: '12px',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
                Other Incomes File Upload
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
                      sx={{ minWidth: '150px' }}
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

export default OtherIncomesInput; 