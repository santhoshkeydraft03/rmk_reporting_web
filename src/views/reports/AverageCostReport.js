import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Button,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import PageContainer from '../../components/container/PageContainer';
import axiosInstance from '../../utils/axios';

const AverageCostReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const columns = [
    { 
      field: 'quarry', 
      headerName: 'Quarry', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          height: '100%',
          p: 1,
          bgcolor: '#FFCCFF'
        }}>
          {params.value}
        </Box>
      )
    },
    {
      field: 'avgCost',
      headerName: 'Average Cost',
      flex: 1,
      align: 'right',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          height: '100%',
          p: 1,
          textAlign: 'right',
          bgcolor: '#FFCCFF'
        }}>
          {params.value?.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Box>
      )
    }
  ];

  const fetchAverageCostData = async (date) => {
    if (!date) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();

      const response = await axiosInstance.get('/reports/average-cost', {
        params: {
          month: month,
          year: year
        }
      });
      
      const transformedData = response.data.map((item, index) => ({
        id: index + 1,
        quarry: item.quarry,
        avgCost: item.avgCost
      }));
      
      setRows(transformedData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch average cost data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAverageCostData(selectedDate);
    }
  }, [selectedDate]);

  const handleExport = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(rows.map(row => ({
        'Quarry': row.quarry,
        'Average Cost': row.avgCost
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Average Cost Report');

      const date = selectedDate;
      const fileName = `Average_Cost_Report_${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      showNotification('Report exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export report', 'error');
    }
  };

  const showNotification = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  return (
    <PageContainer title="Average Cost Report" description="Average Cost Report">
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
              Average Cost Report
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Month"
                  views={['year', 'month']}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>

              <Button
                variant="contained"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                disabled={rows.length === 0}
              >
                EXPORT
              </Button>
            </Stack>

            {rows.length > 0 && (
              <Paper sx={{ 
                mt: 3, 
                border: '1px solid #0070C0',
                maxWidth: '1200px',
                margin: '16px auto'
              }}>
                {/* Report Title */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#BDD7EE', 
                  textAlign: 'center',
                  borderBottom: '1px solid #0070C0'
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#002060' }}>
                    Average Cost Report
                  </Typography>
                </Box>

                {/* Custom Header */}
                <Box sx={{ 
                  display: 'flex', 
                  bgcolor: '#D9E1F2', 
                  borderBottom: '1px solid #0070C0'
                }}>
                  <Box sx={{ 
                    flex: 1,
                    p: 1.5, 
                    fontWeight: 'bold',
                    borderRight: '1px solid #0070C0'
                  }}>
                    Quarry
                  </Box>
                  <Box sx={{ 
                    flex: 1,
                    p: 1.5,
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    Average Cost
                  </Box>
                </Box>

                {/* DataGrid */}
                <Box sx={{ 
                  height: 'auto',
                  width: '100%'
                }}>
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    hideFooter
                    autoHeight
                    getRowHeight={() => 'auto'}
                    disableColumnMenu
                    disableColumnSelector
                    disableColumnFilter
                    disableRowSelectionOnClick
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        display: 'none'
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #0070C0',
                        borderRight: '1px solid #0070C0',
                        padding: 0,
                      },
                      '& .MuiDataGrid-cell:last-child': {
                        borderRight: '1px solid #0070C0'
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        marginTop: '0 !important'
                      },
                      '& .MuiDataGrid-row': {
                        borderLeft: '1px solid #0070C0',
                        '&:last-child': {
                          borderBottom: '1px solid #0070C0',
                        }
                      }
                    }}
                    components={{
                      NoRowsOverlay: () => (
                        <Stack height="100%" alignItems="center" justifyContent="center">
                          <Typography>No data available</Typography>
                        </Stack>
                      ),
                    }}
                  />
                </Box>
              </Paper>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AverageCostReport; 