import React from 'react';
import { Box, Typography } from '@mui/material';

interface StageBoxProps {
  stage: {
    name: string;
    count: number;
    color?: string;
  };
  isSelected: boolean;
  onClick: () => void;
  isLast: boolean;
}

const StageBox: React.FC<StageBoxProps> = ({
  stage,
  isSelected,
  onClick,
  isLast,
}) => {
  return (
    <>
      <Box
        onClick={onClick}
        data-testid="stage-box"
        className={isSelected ? 'selected' : ''}
        sx={{
          backgroundColor: stage.color || '#f5f5f5',
          padding: '16px 24px',
          cursor: 'pointer',
          textAlign: 'center',
          minWidth: '150px',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          border: isSelected ? '3px solid #1976d2' : '3px solid transparent',
          boxShadow: isSelected ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: isSelected ? 700 : 500,
            color: (theme) =>
              stage.name === 'View All' ? theme.palette.text.primary : '#fff',
          }}
        >
          {stage.name}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: (theme) =>
              stage.name === 'View All' ? theme.palette.text.primary : '#fff',
          }}
        >
          {stage.count}
        </Typography>
      </Box>
      {!isLast && (
        <Box
          sx={{
            width: '24px',
            height: '2px',
            backgroundColor: '#e0e0e0',
            alignSelf: 'center',
          }}
        />
      )}
    </>
  );
};

export default StageBox;
