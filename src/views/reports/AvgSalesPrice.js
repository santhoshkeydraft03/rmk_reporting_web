import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import PageContainer from '../../components/container/PageContainer';
import axiosInstance from '../../utils/axios';

const AvgSalesPrice = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(0);

  // Fetch plants for dropdown
  const fetchPlants = async () => {
    try {
      const response = await axiosInstance.get('/master/plants');
      setPlants(response.data);
    } catch (err) {
      setError('Failed to fetch plants');
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const columns = [
    ...(selectedPlant === 0 ? [{
      field: 'plantName',
      headerName: 'Plant',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          height: '100%',
          p: 1,
          bgcolor: '#FFCCFF'
        }}>
          {params.row.plantName}
        </Box>
      )
    }] : []),
    { 
      field: 'particular', 
      headerName: 'Particulars', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          height: '100%',
          p: 1,
          bgcolor: '#FFCCFF'
        }}>
          {params.row.productName}
        </Box>
      )
    },
    {
      field: 'averagePrice',
      headerName: 'Average Price',
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
          {params.value ? `₹${params.value.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}` : '-'}
        </Box>
      )
    }
  ];

  const fetchAvgSalesPrice = async (plantId, date) => {
    if (!date) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();

      const response = await axiosInstance.get('/reports/average-sales-price', {
        params: {
          plantId: plantId,
          month: month,
          year: year
        }
      });
      
      const transformedData = response.data.map((item, index) => ({
        id: index + 1,
        serialNo: index + 1,
        plantName: item.plantName,
        productName: item.productName,
        averagePrice: Number(item.averagePrice)
      }));
      
      setRows(transformedData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch average sales price data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate && selectedPlant !== undefined && selectedPlant !== null) {
      fetchAvgSalesPrice(selectedPlant, selectedDate);
    }
  }, [selectedPlant, selectedDate]);

  return (
    <PageContainer title="Average Sales Price" description="Average Sales Price">
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
              Average Sales Price
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Select Plant</InputLabel>
                <Select
                  value={selectedPlant}
                  label="Select Plant"
                  onChange={(e) => setSelectedPlant(e.target.value)}
                >
                  <MenuItem value={0}>All</MenuItem>
                  {plants.map((plant) => (
                    <MenuItem key={plant.plantId} value={plant.plantId}>
                      {plant.plantName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Month"
                  views={['year', 'month']}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>
            </Stack>

            {loading && <Typography>Loading report data...</Typography>}

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
                    {selectedPlant === 0 
                      ? 'All Plants' 
                      : plants.find(p => p.plantId === selectedPlant)?.plantName || 'No Data'}
                  </Typography>
                </Box>

                {/* Custom Header */}
                <Box sx={{ 
                  display: 'flex', 
                  bgcolor: '#D9E1F2', 
                  borderBottom: '1px solid #0070C0'
                }}>
                  {selectedPlant === 0 && (
                    <Box sx={{ 
                      flex: 1,
                      p: 1.5, 
                      fontWeight: 'bold',
                      borderRight: '1px solid #0070C0'
                    }}>
                      Plant
                    </Box>
                  )}
                  <Box sx={{ 
                    flex: 1,
                    p: 1.5, 
                    fontWeight: 'bold',
                    borderRight: '1px solid #0070C0'
                  }}>
                    Product
                  </Box>
                  <Box sx={{ 
                    flex: 1,
                    p: 1.5,
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
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
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AvgSalesPrice; 