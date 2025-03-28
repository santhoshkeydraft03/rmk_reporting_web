import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DataGrid } from '@mui/x-data-grid';
import PageContainer from '../../components/container/PageContainer';
import axios from '../../utils/axios';

const BucketWiseReport = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [buckets, setBuckets] = useState([]);
  const [rows, setRows] = useState([]);

  // Fetch buckets on component mount
  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const response = await axios.get('/master/buckets');
        console.log('Buckets API response:', response.data);
        setBuckets(response.data || []);
      } catch (error) {
        console.error('Error fetching buckets:', error);
        alert('Failed to fetch buckets. Please try again.');
        setBuckets([]);
      }
    };

    fetchBuckets();
  }, []);

  // Process report data into rows for DataGrid
  useEffect(() => {
    if (!reportData || !reportData.expenseTypes) {
      setRows([]);
      return;
    }

    try {
      const gridRows = [];
      let rowId = 1;

      // Process expense types and their groups
      reportData.expenseTypes.forEach((expenseType, typeIndex) => {
        // Add expense type header row
        gridRows.push({
          id: rowId++,
          isHeader: true,
          particular: expenseType.expenseTypeName || '',
          total: '',
          perMT: ''
        });

        // Add expense groups
        if (expenseType.expenseGroups && Array.isArray(expenseType.expenseGroups)) {
          expenseType.expenseGroups.forEach((group, groupIndex) => {
            gridRows.push({
              id: rowId++,
              isHeader: false,
              particular: group.expenseGroupName || '',
              total: group.total || 0,
              perMT: group.perMT || '-'
            });
          });
        }
      });

      // Add total row
      gridRows.push({
        id: rowId++,
        isTotal: true,
        particular: 'Total',
        total: reportData.grandTotal || 0,
        perMT: ''
      });

      setRows(gridRows);
    } catch (error) {
      console.error('Error processing report data:', error);
      setRows([]);
    }
  }, [reportData]);

  const handleGenerateReport = async () => {
    if (!selectedBucket || !selectedDate) {
      alert('Please select both bucket and month');
      return;
    }
    
    setLoading(true);
    
    try {
      // Extract month and year separately
      const month = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : '';
      const year = selectedDate ? String(selectedDate.getFullYear()) : '';
      
      // Make API call to fetch report data
      const response = await axios.get('/reports/bucket-wise-report', {
        params: {
          bucketId: selectedBucket,
          month: month,
          year: year
        }
      });
      
      // Log the response data
      console.log('Bucket-wise report API response:', response.data);
      
      // Update state with the response data
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      console.log('Error details:', error.response || error.message);
      alert('Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas for Indian locale (e.g., 1,234,567)
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('en-IN');
  };

  // Define columns for the DataGrid
  const columns = [
    { 
      field: 'particular', 
      headerName: 'Particulars', 
      flex: 3,
      renderCell: (params) => (
        <Box sx={{ 
          fontWeight: params.row.isHeader || params.row.isTotal ? 'bold' : 'normal',
          width: '100%',
          height: '100%',
          p: 1,
          bgcolor: params.row.isHeader ? '#FFFFFF' : '#FFCCFF'
        }}>
          {params.value}
        </Box>
      )
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      align: 'right',
      renderCell: (params) => (
        <Box sx={{ 
          fontWeight: params.row.isHeader || params.row.isTotal ? 'bold' : 'normal',
          color: params.row.isTotal ? '#0000FF' : 'inherit',
          width: '100%',
          height: '100%',
          p: 1,
          textAlign: 'right',
          bgcolor: params.row.isHeader ? '#FFFFFF' : '#FFCCFF'
        }}>
          {params.value !== null && params.value !== undefined && params.value !== '' 
            ? formatNumber(params.value) 
            : ''}
        </Box>
      )
    },
    {
      field: 'perMT',
      headerName: 'Per MT',
      flex: 1,
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          fontWeight: params.row.isHeader || params.row.isTotal ? 'bold' : 'normal',
          width: '100%',
          height: '100%',
          p: 1,
          textAlign: 'center',
          bgcolor: params.row.isHeader ? '#FFFFFF' : '#FFCCFF'
        }}>
          {params.value || ''}
        </Box>
      )
    }
  ];

  // Custom header component that matches your Table header exactly
  const CustomHeader = () => {
    if (!reportData) return null;
    
    return (
      <>
        <Box sx={{ 
          display: 'flex', 
          bgcolor: '#D9E1F2', 
          borderBottom: '1px solid #0070C0'
        }}>
          <Box sx={{ 
            width: '60%', 
            p: 1.5, 
            fontWeight: 'bold',
            borderRight: '1px solid #0070C0'
          }}>
            Particulars
          </Box>
          <Box sx={{ 
            width: '40%',
            p: 1.5,
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {reportData.date || 'N/A'}
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex',
          bgcolor: '#D9E1F2',
          borderBottom: '1px solid #0070C0'
        }}>
          <Box sx={{ 
            width: '60%',
            borderRight: '1px solid #0070C0',
            p: 1
          }}></Box>
          <Box sx={{ 
            width: '20%',
            p: 1,
            fontWeight: 'bold',
            textAlign: 'center',
            borderRight: '1px solid #0070C0'
          }}>
            Total
          </Box>
          <Box sx={{ 
            width: '20%',
            p: 1,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            Per MT
          </Box>
        </Box>
      </>
    );
  };

  return (
    <PageContainer title="Bucket Wise Report" description="Bucket Wise Report">
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
              Bucket Wise Report
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Select Bucket</InputLabel>
                <Select
                  value={selectedBucket}
                  label="Select Bucket"
                  onChange={(e) => setSelectedBucket(e.target.value)}
                >
                  {buckets.map((bucket) => (
                    <MenuItem key={bucket.bucketId} value={bucket.bucketId}>
                      {bucket.bucketName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Month"
                  views={['year', 'month']}
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>

              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                Generate Report
              </Button>
            </Stack>

            {loading && <Typography>Loading report data...</Typography>}

            {reportData && (
              <Paper sx={{ mt: 3, border: '1px solid #0070C0' }}>
                {/* Report Title */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#BDD7EE', 
                  textAlign: 'center',
                  borderBottom: '1px solid #0070C0'
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#002060' }}>
                    {reportData.bucketName || 'No Data'}
                  </Typography>
                </Box>

                {/* Custom Header */}
                <CustomHeader />

                {/* DataGrid */}
                <Box sx={{ height: 'auto' }}>
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
                        display: 'none' // Hide default headers
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #E5E5E5',
                        padding: 0,
                        borderRight: '1px solid #0070C0'
                      },
                      '& .MuiDataGrid-cell:last-child': {
                        borderRight: 'none' 
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        marginTop: '0 !important' // Remove header space
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
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default BucketWiseReport;
