import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import PageContainer from '../../components/container/PageContainer';

const InwardConsumptionSlurry = () => {
  return (
    <PageContainer title="Inward Consumption Slurry" description="Manage inward consumption slurry">
      <Card>
        <CardContent>
          <Box>
            <Typography variant="h4">Inward Consumption Slurry</Typography>
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default InwardConsumptionSlurry; 