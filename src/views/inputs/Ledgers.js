import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
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

const Ledgers = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isMonthLocked, setIsMonthLocked] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const columns = [
    { field: 'id', headerName: '#', width: 60 },
    { 
      field: 'listOfLedgers', 
      headerName: 'List Of Ledgers', 
      flex: 2,
      renderCell: (params) => (
        <div style={{ whiteSpace: 'pre-line' }}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      flex: 1,
      type: 'number',
      renderCell: (params) => (
        <div>
          {params.value?.toLocaleString('en-IN') || ''}
        </div>
      )
    }
  ];

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/input/ledger-entries');
      const transformedData = response.data.map((ledger, index) => ({
        id: index + 1,
        listOfLedgers: ledger.ledgerName,
        amount: Number(ledger.amount)
      }));
      setLedgerData(transformedData);
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      alert('Failed to fetch ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
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
          const worksheet = workbook.Sheets[workbook.SheetNames[1]];
          
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          const data = [];
          
          console.log('Excel range:', range);
          
          for(let row = 2; row <= range.e.r + 1; row++) {
            console.log('Row', row, {
              A: worksheet[`A${row}`],
              B: worksheet[`B${row}`]
            });
            
            const rowData = {
              id: row - 1,
              listOfLedgers: worksheet[`A${row}`]?.v || '',
              amount: worksheet[`B${row}`]?.v || 0
            };
            
            if (rowData.listOfLedgers) {
              console.log('Processed row:', rowData);
              data.push(rowData);
            }
          }
          
          console.log('Final data:', data);
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
      const response = await axiosInstance.get('/input/check-ledger-exists', {
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

      const ledgerEntriesData = dataToSubmit.map(({id, ...row}) => ({
        ledgerName: row.listOfLedgers,
        amount: row.amount,
        month: String(selectedDate.getMonth() + 1).padStart(2, '0'),
        year: String(selectedDate.getFullYear())
      }));

      const response = await axiosInstance.post('/input/import-ledger-entries', ledgerEntriesData);

      if (response.status === 200) {
        alert('Ledger entries imported successfully');
        handleDiscard();
        fetchLedgerData();
      }
    } catch (error) {
      console.error('Submit Error:', error);
      showNotification(
        error.response?.data?.message || 'Failed to import ledger entries',
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

  return (
    <PageContainer title="Ledgers" description="Manage ledgers">
      <Card>
        <CardContent>
          {!showUploadSection ? (
            <Box>
              <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
                Ledgers
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
                  rows={ledgerData}
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
                      padding: '0 !important',
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
                Ledger File Upload
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
                          padding: '0 !important',
                        },
                        border: '1px solid #E5E5E5',
                        borderRadius: '12px',
                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
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

export default Ledgers; 