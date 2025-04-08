import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Alert,
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import PageContainer from '../../components/container/PageContainer';
import axiosInstance from '../../utils/axios';

const MaterialCostReport = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [materialCosts, setMaterialCosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const fetchMaterialCosts = async (date) => {
    if (!date) {
      setMaterialCosts([]);
      return;
    }

    setLoading(true);
    try {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();

      const response = await axiosInstance.get('/reports/material-cost', {
        params: {
          month: month,
          year: year
        }
      });
      
      console.log('Material Cost API Response:', response.data);
      setMaterialCosts(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching material costs:', err);
      setError(err.response?.data?.message || 'Failed to fetch material cost data');
      setMaterialCosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchMaterialCosts(selectedDate);
    }
  }, [selectedDate]);

  const handleExport = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(materialCosts.map(row => ({
        'Material Name': row.materialName,
        'Unit': row.unit,
        'Cost': row.cost,
        'Date': row.date
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Material Cost Report');

      const date = selectedDate;
      const fileName = `Material_Cost_Report_${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}.xlsx`;

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
    <PageContainer title="Material Cost Report" description="Material Cost Report">
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
              Material Cost Report
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
                disabled={materialCosts.length === 0}
              >
                EXPORT
              </Button>
            </Stack>

            {materialCosts.length > 0 && (
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
                    Material Cost Report
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
                    Material Name
                  </Box>
                  <Box sx={{ 
                    flex: 1,
                    p: 1.5,
                    fontWeight: 'bold',
                    borderRight: '1px solid #0070C0'
                  }}>
                    Unit
                  </Box>
                  <Box sx={{ 
                    flex: 1,
                    p: 1.5,
                    textAlign: 'right',
                    fontWeight: 'bold',
                    borderRight: '1px solid #0070C0'
                  }}>
                    Cost
                  </Box>
                  <Box sx={{ 
                    flex: 1,
                    p: 1.5,
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    Date
                  </Box>
                </Box>

                <TableContainer>
                  <Table>
                    <TableBody>
                      {materialCosts.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell sx={{ 
                            borderRight: '1px solid #0070C0',
                            bgcolor: '#FFCCFF'
                          }}>
                            {row.materialName}
                          </TableCell>
                          <TableCell sx={{ 
                            borderRight: '1px solid #0070C0',
                            bgcolor: '#FFCCFF'
                          }}>
                            {row.unit}
                          </TableCell>
                          <TableCell sx={{ 
                            borderRight: '1px solid #0070C0',
                            textAlign: 'right',
                            bgcolor: '#FFCCFF'
                          }}>
                            {row.cost?.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell sx={{ 
                            textAlign: 'center',
                            bgcolor: '#FFCCFF'
                          }}>
                            {row.date}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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

export default MaterialCostReport; 