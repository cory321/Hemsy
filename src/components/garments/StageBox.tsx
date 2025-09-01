import React from 'react';
import { Box, Typography, Paper, alpha } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Refined color palette (matching dashboard)
const refinedColors = {
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
};

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
  const stageColor = stage.color || '#e0e0e0';
  // Create a test-friendly ID from the stage name
  const testId = `stage-box-${stage.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <>
      <Paper
        onClick={onClick}
        data-testid={testId}
        data-selected={isSelected}
        className={isSelected ? 'selected' : ''}
        sx={{
          p: 2,
          textAlign: 'center',
          bgcolor: alpha(stageColor, 0.08),
          border: `2px solid ${alpha(stageColor, isSelected ? 1 : 0.3)}`,
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.2s',
          minWidth: '120px',
          boxShadow: isSelected
            ? `0 4px 12px ${alpha(stageColor, 0.2)}`
            : 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 12px ${alpha(stageColor, 0.2)}`,
            borderColor: stageColor,
          },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: stageColor,
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          {stage.count}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: refinedColors.text.primary,
          }}
        >
          {stage.name}
        </Typography>
      </Paper>
      {!isLast && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 1,
          }}
        >
          <ArrowForwardIcon
            sx={{
              color: refinedColors.text.tertiary,
              fontSize: 20,
            }}
          />
        </Box>
      )}
    </>
  );
};

export default StageBox;
