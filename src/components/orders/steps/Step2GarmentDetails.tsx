'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Grid,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import { v4 as uuidv4 } from 'uuid';
import { useOrderFlow, GarmentDraft } from '@/contexts/OrderFlowContext';
import ServiceSelector from '../ServiceSelector';
import GarmentImageUpload from '../GarmentImageUpload';
import { formatCurrency } from '@/lib/utils/currency';

export default function Step2GarmentDetails() {
  const {
    orderDraft,
    addGarment,
    updateGarment,
    removeGarment,
    updateGarmentImage,
    removeGarmentImage,
  } = useOrderFlow();
  const [expandedGarment, setExpandedGarment] = useState<string | false>(false);

  const handleAddGarment = () => {
    const newGarment: GarmentDraft = {
      id: uuidv4(),
      name: '',
      notes: '',
      dueDate: undefined,
      eventDate: undefined,
      specialEvent: false,
      services: [],
    };
    addGarment(newGarment);
    setExpandedGarment(newGarment.id);
  };

  const calculateGarmentTotal = (garment: GarmentDraft) => {
    return garment.services.reduce(
      (sum, service) => sum + service.quantity * service.unitPriceCents,
      0
    );
  };

  const handleAccordionChange =
    (garmentId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedGarment(isExpanded ? garmentId : false);
    };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Add Garments & Services
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add garments and specify the services needed for each one.
      </Typography>

      {orderDraft.garments.length === 0 ? (
        <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <CheckroomIcon
            sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No garments added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click the button below to add your first garment
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGarment}
          >
            Add First Garment
          </Button>
        </Card>
      ) : (
        <>
          {orderDraft.garments.map((garment, index) => (
            <Accordion
              key={garment.id}
              expanded={expandedGarment === garment.id}
              onChange={handleAccordionChange(garment.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Typography variant="h6">
                    {garment.name || `Garment ${index + 1}`}
                  </Typography>
                  {garment.services.length > 0 && (
                    <Chip
                      label={`${garment.services.length} service${garment.services.length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                    />
                  )}
                  {garment.services.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Total:{' '}
                      {formatCurrency(calculateGarmentTotal(garment) / 100)}
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Garment Details */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Garment Name"
                      value={garment.name}
                      onChange={(e) =>
                        updateGarment(garment.id, { name: e.target.value })
                      }
                      required
                      placeholder="e.g., Wedding Dress, Suit Jacket"
                    />
                  </Grid>

                  {/* Garment Image */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Garment Photo (Optional)
                    </Typography>
                    <GarmentImageUpload
                      imageUrl={garment.imageUrl}
                      publicId={garment.imageCloudId}
                      garmentName={garment.name}
                      onUpload={(result) =>
                        updateGarmentImage(garment.id, result)
                      }
                      onRemove={() => removeGarmentImage(garment.id)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Due Date"
                      value={garment.dueDate || ''}
                      onChange={(e) =>
                        updateGarment(garment.id, {
                          dueDate: e.target.value || undefined,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Event Date (Optional)"
                      value={garment.eventDate || ''}
                      onChange={(e) =>
                        updateGarment(garment.id, {
                          eventDate: e.target.value || undefined,
                          specialEvent: !!e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                      helperText="If this is for a special event"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes"
                      value={garment.notes || ''}
                      onChange={(e) =>
                        updateGarment(garment.id, { notes: e.target.value })
                      }
                      placeholder="Any special instructions or notes about this garment"
                    />
                  </Grid>

                  {/* Services Section */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Services
                    </Typography>
                    <ServiceSelector garmentId={garment.id} />
                  </Grid>

                  {/* Delete Garment */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mt: 2,
                      }}
                    >
                      <Button
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => removeGarment(garment.id)}
                      >
                        Remove Garment
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddGarment}
            fullWidth
            sx={{ mt: 2 }}
          >
            Add Another Garment
          </Button>
        </>
      )}
    </Box>
  );
}

// We need to install uuid for generating unique IDs
// npm install uuid @types/uuid
