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
          backgroundColor: stage.name === 'View All' ? '#f5f5f5' : '#fff',
          padding: '16px 24px',
          cursor: 'pointer',
          textAlign: 'center',
          minWidth: '150px',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          border: `3px solid ${stage.color || '#e0e0e0'}`,
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
            color: (theme) => theme.palette.text.primary,
          }}
        >
          {stage.name}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: stage.color || undefined,
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
