import React, { useState, useEffect } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Card,
  Typography,
  TextField,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  DragIndicator,
  Close as CloseIcon,
  WarningAmberRounded,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import { updateStages } from '@/lib/actions/garment-stages';

const predefinedColors = [
  { name: 'Soft Peach', hex: '#FAD4C0' },
  { name: 'Pale Pink', hex: '#F9C8D0' },
  { name: 'Light Lavender', hex: '#D6C4F2' },
  { name: 'Soft Sky Blue', hex: '#A8DADC' },
  { name: 'Misty Mint', hex: '#C7EDE5' },
  { name: 'Pale Lemon', hex: '#FFF5BA' },
  { name: 'Pastel Green', hex: '#B8E1C6' },
  { name: 'Light Coral', hex: '#F7A9A8' },
  { name: 'Soft Lilac', hex: '#E4C1F9' },
  { name: 'Powder Blue', hex: '#B3D6F4' },
  { name: 'Blush Pink', hex: '#F5C2C2' },
  { name: 'Gentle Sand', hex: '#F1E1A6' },
  { name: 'Periwinkle Blue', hex: '#C3CFF0' },
  { name: 'Soft Seafoam', hex: '#D1F1E1' },
  { name: 'Pastel Orange', hex: '#FFE0B5' },
  { name: 'Pale Rose', hex: '#F5D0D0' },
  { name: 'Light Blue Grey', hex: '#D2D9E5' },
  { name: 'Creamy Yellow', hex: '#FDF4C9' },
  { name: 'Mint Cream', hex: '#E0F2E9' },
  { name: 'Warm Beige', hex: '#F6E0D5' },
];

interface Stage {
  id: string | null;
  name: string;
  position: number;
  color: string;
  touched?: boolean;
}

interface CustomizeStagesDialogProps {
  open: boolean;
  onClose: () => void;
  onStagesUpdated: (deletedStageId?: string) => void;
  stages: Stage[];
  shopId: string;
}

export default function CustomizeStagesDialog({
  open,
  onClose,
  onStagesUpdated,
  stages: initialStages,
  shopId,
}: CustomizeStagesDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [stages, setStages] = useState<Stage[]>([]);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [reassignStageId, setReassignStageId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for Color Picker Dialog
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerStageIndex, setColorPickerStageIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (open) {
      // Initialize stages from props when the dialog opens
      setStages(initialStages.map((stage) => ({ ...stage, touched: false })));
    }
  }, [open, initialStages]);

  useEffect(() => {
    if (!open) {
      setIsEditing(null);
      setError('');
      setStageToDelete(null);
      setReassignStageId(null);
      setConfirmDeleteOpen(false);
      setDeleteError('');
    }
  }, [open]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reorderedStages = Array.from(stages);
    const [removed] = reorderedStages.splice(result.source.index, 1);
    if (!removed) {
      return;
    }

    reorderedStages.splice(result.destination.index, 0, removed);
    const updatedStages = reorderedStages.map((stage, index) => ({
      ...stage,
      position: index + 1,
    }));

    setStages(updatedStages);
  };

  const handleAddStage = () => {
    if (stages.length >= 20) {
      setError('A maximum of 20 stages are allowed.');
      return;
    }

    const newStage: Stage = {
      id: null,
      name: '',
      position: stages.length + 1,
      touched: false,
      color: '#D6C4F2', // Default color for new stages
    };

    setStages((prevStages) => {
      const updatedStages = [...prevStages, newStage];
      setIsEditing(updatedStages.length - 1); // Set the new stage to editing mode
      return updatedStages;
    });

    setError('');
  };

  const handleDeleteStage = (index: number) => {
    const localStageToDelete = stages[index];

    if (!localStageToDelete) {
      setError('Invalid stage selected.');
      return;
    }

    if (localStageToDelete.id === null) {
      // If the stage is new (unsaved), remove it from local state
      setStages((prevStages) => prevStages.filter((_, i) => i !== index));
    } else {
      // Existing stage, proceed with confirmation dialog
      setStageToDelete(localStageToDelete);
      setConfirmDeleteOpen(true);
    }

    setError('');
  };

  const handleStageNameChange = (index: number, name: string) => {
    setStages((prevStages) =>
      prevStages.map((stage, i) =>
        i === index ? { ...stage, name, touched: true } : stage
      )
    );
  };

  const handleStageNameBlur = (index: number) => {
    setIsEditing(null);
  };

  const handleStageColorChange = (index: number, color: string) => {
    setStages((prevStages) =>
      prevStages.map((stage, i) => (i === index ? { ...stage, color } : stage))
    );
  };

  const handleOpenColorPicker = (index: number) => {
    setColorPickerStageIndex(index);
    setColorPickerOpen(true);
  };

  const handleCloseColorPicker = () => {
    setColorPickerStageIndex(null);
    setColorPickerOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Prepare stages for saving
      const stagesToSave = stages.map((stage) => ({
        id: stage.id,
        shop_id: shopId,
        name: stage.name.trim(),
        position: stage.position,
        color: stage.color,
      }));

      await updateStages(shopId, stagesToSave);

      onStagesUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save stages. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseConfirmDelete = () => {
    setStageToDelete(null);
    setReassignStageId(null);
    setConfirmDeleteOpen(false);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    // Prevent deletion if only one stage remains
    if (stages.length <= 1) {
      setDeleteError('Cannot delete the last remaining stage.');
      setIsDeleting(false);
      return;
    }

    if (stageToDelete && reassignStageId) {
      try {
        // Prepare stages for saving, excluding the stage to delete
        const stagesToSave = stages
          .filter((stage) => stage.id !== stageToDelete.id)
          .map((stage) => ({
            id: stage.id,
            shop_id: shopId,
            name: stage.name.trim(),
            position: stage.position,
            color: stage.color,
          }));

        await updateStages(
          shopId,
          stagesToSave,
          stageToDelete.id as string,
          reassignStageId || undefined
        );

        onStagesUpdated(stageToDelete.id ?? undefined); // Pass the deleted stage ID
        onClose();

        // Reset variables
        setStageToDelete(null);
        setReassignStageId(null);
      } catch (err) {
        console.error('Error during handleConfirmDelete:', err);
        setDeleteError('Failed to delete stage. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    } else {
      setDeleteError('Please select a valid stage to reassign garments to.');
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : '90%',
          height: isMobile ? '100%' : 'auto',
          maxWidth: 'none',
        },
      }}
    >
      <DialogTitle>
        Customize Stages
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', mb: 2, pb: 2 }}>
          {/* Add Stage Box */}
          <Card
            sx={{
              width: 180,
              height: 120,
              border: `2px dashed ${theme.palette.primary.main}`, // Updated border color
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={handleAddStage}
          >
            <Typography variant="button">Add Stage</Typography>
          </Card>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stages" direction="horizontal">
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                  }}
                >
                  {stages.map((stage, index) => (
                    <Draggable
                      key={stage.id ? stage.id.toString() : `temp-${index}`}
                      draggableId={
                        stage.id ? stage.id.toString() : `temp-${index}`
                      }
                      index={index}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            width: 180,
                            height: 120,
                            position: 'relative',
                            padding: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0,
                            border: '1px solid #ccc',
                            borderRadius: 2,
                            backgroundColor: 'white',
                          }}
                        >
                          {/* Delete Icon */}
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              color: (theme) => theme.palette.grey[500],
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStage(index);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>

                          {/* Color Box */}
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenColorPicker(index);
                            }}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 24,
                              height: 24,
                              backgroundColor: stage.color || '#605143',
                              border: '1px solid #fff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          />

                          {/* Stage Name */}
                          <Box
                            sx={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                            }}
                          >
                            {isEditing === index ? (
                              <TextField
                                value={stage.name}
                                onChange={(e) =>
                                  handleStageNameChange(index, e.target.value)
                                }
                                onBlur={() => handleStageNameBlur(index)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleStageNameBlur(index);
                                  }
                                }}
                                autoFocus
                                inputProps={{ maxLength: 25 }}
                                variant="outlined"
                                size="small"
                                sx={{ width: '100%' }}
                                error={
                                  Boolean(stage.touched) &&
                                  stage.name.trim() === ''
                                }
                                helperText={
                                  Boolean(stage.touched) &&
                                  stage.name.trim() === ''
                                    ? 'Stage name is required'
                                    : ''
                                }
                              />
                            ) : (
                              <Tooltip
                                title={
                                  stage.name.trim() === ''
                                    ? 'Click to edit'
                                    : stage.name
                                }
                              >
                                <Typography
                                  variant="h6"
                                  onClick={() => setIsEditing(index)}
                                  sx={{
                                    textAlign: 'center',
                                    width: '100%',
                                    userSelect: 'none',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    color:
                                      stage.touched && stage.name.trim() === ''
                                        ? 'red'
                                        : 'inherit',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {stage.name.trim() === ''
                                    ? 'Empty Stage Name'
                                    : stage.name}
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>

                          {/* Drag Handle */}
                          <IconButton
                            size="small"
                            {...provided.dragHandleProps}
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              right: 4,
                              cursor: 'grab',
                            }}
                          >
                            <DragIndicator fontSize="small" />
                          </IconButton>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            stages.some((stage) => stage.name.trim() === '') || isSaving
          }
        >
          Save
        </Button>
      </DialogActions>

      {/* Confirm Delete Dialog */}
      {confirmDeleteOpen && (
        <Dialog open={confirmDeleteOpen} onClose={handleCloseConfirmDelete}>
          <DialogTitle>
            Confirm Delete
            <IconButton
              aria-label="close"
              onClick={handleCloseConfirmDelete}
              disabled={isDeleting}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              position: 'relative',
              ...(isDeleting && { pointerEvents: 'none', opacity: 0.5 }),
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <WarningAmberRounded
                sx={{ fontSize: 64, color: 'warning.main', mb: 2 }}
              />
              <Typography variant="h6" align="center">
                Are you sure you want to delete the &ldquo;
                {stageToDelete && stageToDelete.name}&rdquo; stage?
              </Typography>
            </Box>
            <Typography sx={{ textAlign: 'center' }}>
              Please select a new stage to move all garments in the &ldquo;
              {stageToDelete && stageToDelete.name}&rdquo; stage to before
              deleting it:
            </Typography>

            {/* Display deleteError inside the Confirm Delete dialog */}
            {deleteError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {deleteError}
              </Typography>
            )}

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              {stages
                .filter(
                  (stage) => stage.id !== (stageToDelete && stageToDelete.id)
                )
                .map((stage) => (
                  <Button
                    key={stage.id}
                    variant={
                      reassignStageId === stage.id ? 'contained' : 'outlined'
                    }
                    onClick={() => setReassignStageId(stage.id)}
                    sx={{ mr: 1, mb: 1 }}
                    disabled={isDeleting}
                  >
                    {stage.name}
                  </Button>
                ))}
            </Box>

            {/* Loading indicator overlay */}
            {isDeleting && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <CircularProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Color Picker Dialog */}
      {colorPickerOpen && colorPickerStageIndex !== null && (
        <Dialog open={colorPickerOpen} onClose={handleCloseColorPicker}>
          <DialogTitle>
            Select a Color
            <IconButton
              aria-label="close"
              onClick={handleCloseColorPicker}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {/* HexColorPicker */}
            <Box
              sx={{
                mt: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <HexColorPicker
                color={stages[colorPickerStageIndex]?.color || '#ffffff'}
                onChange={(color) =>
                  handleStageColorChange(colorPickerStageIndex, color)
                }
              />
              {/* HexColorInput */}
              <HexColorInput
                color={stages[colorPickerStageIndex]?.color || '#ffffff'}
                onChange={(color) =>
                  handleStageColorChange(colorPickerStageIndex, color)
                }
                prefixed
                style={{
                  marginTop: '16px',
                  width: '100px',
                  padding: '8px',
                  fontSize: '16px',
                  textAlign: 'center',
                }}
              />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Choose a custom color or select from the list below
              </Typography>
            </Box>
            {/* Predefined Colors */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'center',
                mt: 2,
              }}
            >
              {predefinedColors.map((colorOption, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: colorOption.hex,
                    cursor: 'pointer',
                    border:
                      stages[colorPickerStageIndex]?.color === colorOption.hex
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                  }}
                  onClick={() => {
                    handleStageColorChange(
                      colorPickerStageIndex,
                      colorOption.hex
                    );
                    handleCloseColorPicker();
                  }}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseColorPicker}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}
