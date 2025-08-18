'use client';

import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  Grid2 as Grid,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { colors } from '@/constants/colors';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

export default function ColorPaletteDemo() {
  const theme = useTheme();

  const ColorSwatch = ({
    color,
    label,
    textColor = '#000',
  }: {
    color: string;
    label: string;
    textColor?: string;
  }) => (
    <Box
      sx={{
        width: '100%',
        height: 80,
        backgroundColor: color,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: textColor,
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
        {color}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 4, color: 'primary.main', fontWeight: 700 }}
      >
        Threadfolio V2 Color Palette
      </Typography>

      {/* Primary Colors */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Primary Palette - Rose/Burgundy
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch
              color={colors.burgundy[900]}
              label="900"
              textColor="#fff"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch
              color={colors.burgundy[600]}
              label="Primary Dark"
              textColor="#fff"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch
              color={colors.burgundy[500]}
              label="Primary Main"
              textColor="#fff"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch color={colors.burgundy[300]} label="Primary Light" />
          </Grid>
        </Grid>
      </Paper>

      {/* Secondary Colors */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Secondary Palette - Terracotta/Sienna
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch
              color={colors.terracotta[900]}
              label="900"
              textColor="#fff"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch
              color={colors.terracotta[600]}
              label="Secondary Dark"
              textColor="#fff"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch
              color={colors.terracotta[500]}
              label="Secondary Main"
              textColor="#fff"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch
              color={colors.terracotta[300]}
              label="Secondary Light"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Background Colors */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Background & Neutral Colors
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch color={colors.neutral[50]} label="Background" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch color={colors.neutral[0]} label="Paper" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch color={colors.neutral[200]} label="Divider" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorSwatch color={colors.neutral[300]} label="Warm Beige" />
          </Grid>
        </Grid>
      </Paper>

      {/* Semantic Colors */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Semantic Colors
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
              <Typography variant="caption">Error</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <WarningIcon
                sx={{ fontSize: 48, color: 'warning.main', mb: 1 }}
              />
              <Typography variant="caption">Warning</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <InfoIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
              <Typography variant="caption">Info</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon
                sx={{ fontSize: 48, color: 'success.main', mb: 1 }}
              />
              <Typography variant="caption">Success</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Component Examples */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Component Examples
        </Typography>

        <Stack spacing={3}>
          {/* Buttons */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Buttons
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button variant="contained" color="primary">
                Primary
              </Button>
              <Button variant="contained" color="secondary">
                Secondary
              </Button>
              <Button variant="outlined" color="primary">
                Outlined
              </Button>
              <Button variant="text" color="primary">
                Text
              </Button>
              <IconButton color="primary">
                <ContentCutIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Chips */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Chips
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label="New Order" color="primary" />
              <Chip label="In Progress" color="secondary" />
              <Chip label="Completed" color="success" />
              <Chip label="Urgent" color="warning" />
              <Chip label="Cancelled" color="error" />
            </Stack>
          </Box>

          {/* Cards */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Cards
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary.main">
                      Sample Card
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This shows how text and backgrounds work together in the
                      new color scheme.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6">Inverted Card</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      This card uses the primary color as background.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Paper>

      {/* Typography Examples */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Typography
        </Typography>
        <Stack spacing={1}>
          <Typography variant="h4" color="primary.main">
            Heading 4 - Primary Color
          </Typography>
          <Typography variant="h5">Heading 5 - Default Text</Typography>
          <Typography variant="h6">Heading 6 - Default Text</Typography>
          <Typography variant="body1">
            Body 1 - Main content text using the new color scheme
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Body 2 - Secondary text with lighter color
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Caption text for small details
          </Typography>
          <Box>
            <Typography component="a" href="#" sx={{ cursor: 'pointer' }}>
              This is a link with hover effect
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
