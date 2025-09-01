'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Skeleton,
  Box,
  Paper,
  alpha,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

export function GarmentPipelineLoading() {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 4, fontWeight: 600 }}>
          Garment Pipeline
        </Typography>

        {/* Pipeline Overview Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            {[1, 2, 3, 4].map((index, i, array) => (
              <React.Fragment key={index}>
                <Paper
                  sx={{
                    p: 1.5,
                    px: 2,
                    textAlign: 'center',
                    bgcolor: alpha('#e0e0e0', 0.08),
                    border: `2px solid ${alpha('#e0e0e0', 0.3)}`,
                    borderRadius: 2,
                    flex: 1,
                    maxWidth: '120px',
                  }}
                >
                  <Skeleton
                    variant="text"
                    width={40}
                    height={40}
                    sx={{ mx: 'auto', mb: 0.25 }}
                  />
                  <Skeleton
                    variant="text"
                    width={80}
                    height={20}
                    sx={{ mx: 'auto' }}
                  />
                </Paper>
                {i < array.length - 1 && (
                  <ArrowForwardIcon
                    sx={{
                      color: '#999999',
                      fontSize: 20,
                      mx: 0.5,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Highest Priority Garments Skeleton */}
        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 600 }}>
          Highest Priority Garments
        </Typography>

        <Stack spacing={2}>
          {/* Priority Item Skeleton */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `2px solid ${alpha('#e0e0e0', 0.3)}`,
              bgcolor: alpha('#e0e0e0', 0.02),
              borderRadius: 2,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="start"
            >
              <Box sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 1 }}
                >
                  <Skeleton variant="text" width={200} height={28} />
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={24}
                    sx={{ borderRadius: 12 }}
                  />
                </Stack>
                <Skeleton
                  variant="text"
                  width={150}
                  height={20}
                  sx={{ mb: 2 }}
                />

                {/* Progress Bar Skeleton */}
                <Box sx={{ mb: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Skeleton variant="text" width={60} height={16} />
                    <Skeleton variant="text" width={40} height={16} />
                  </Stack>
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={6}
                    sx={{ borderRadius: 3 }}
                  />
                </Box>

                {/* Service Chips Skeleton */}
                <Stack direction="row" spacing={1}>
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={32}
                    sx={{ borderRadius: 16 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={120}
                    height={32}
                    sx={{ borderRadius: 16 }}
                  />
                </Stack>
              </Box>

              <Stack spacing={1}>
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={32}
                  sx={{ borderRadius: 1 }}
                />
              </Stack>
            </Stack>
          </Paper>

          {/* Regular Items Skeleton */}
          {[1, 2].map((index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Skeleton
                    variant="text"
                    width={150}
                    height={24}
                    sx={{ mb: 0.5 }}
                  />
                  <Skeleton variant="text" width={120} height={20} />
                </Box>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={4}
                    sx={{ borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={24}
                    sx={{ borderRadius: 12 }}
                  />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Skeleton
          variant="rectangular"
          width="100%"
          height={36}
          sx={{ mt: 3, borderRadius: 1 }}
        />
      </CardContent>
    </Card>
  );
}
