'use client';

import { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Stack,
  Fade,
  useTheme,
} from '@mui/material';
import { CldUploadWidget } from 'next-cloudinary';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PaletteIcon from '@mui/icons-material/Palette';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGarment } from '@/contexts/GarmentContext';
import PresetGarmentIconModal, {
  PresetGarmentIconModalResult,
} from '@/components/orders/PresetGarmentIconModal';
import DeletePhotoConfirmationModal from './DeletePhotoConfirmationModal';

interface GarmentImageHoverOverlayProps {
  children: React.ReactNode;
  imageType: 'cloudinary' | 'photo' | 'icon';
}

export default function GarmentImageHoverOverlay({
  children,
  imageType,
}: GarmentImageHoverOverlayProps) {
  const theme = useTheme();
  const { garment, updateGarmentIcon, updateGarmentPhoto, deleteGarmentPhoto } =
    useGarment();
  const [isHovered, setIsHovered] = useState(false);
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleIconChange = async (result: PresetGarmentIconModalResult) => {
    setLoading(true);
    setIconModalOpen(false);

    // Optimistic update happens inside updateGarmentIcon
    await updateGarmentIcon(
      result.presetIconKey || null,
      result.presetFillColor || null
    );

    setLoading(false);
  };

  const handleUploadSuccess = async (result: any) => {
    setIsUploading(false);
    if (result?.info) {
      await updateGarmentPhoto(result.info.secure_url, result.info.public_id);
    }
  };

  const handleDeletePhoto = async () => {
    setIsDeleting(true);
    setDeleteModalOpen(false);

    try {
      await deleteGarmentPhoto();
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          cursor: 'pointer',
          '&:hover .hover-overlay': {
            opacity: 1,
          },
          // On mobile, show overlay on touch/tap
          '&:active .hover-overlay': {
            opacity: 1,
          },
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setTimeout(() => setIsHovered(false), 3000)} // Auto-hide after 3s on mobile
      >
        {children}

        {/* Hover Overlay */}
        <Fade in={isHovered} timeout={200}>
          <Box
            className="hover-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
              borderRadius: 'inherit',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 2, sm: 3 }}
              alignItems="center"
              justifyContent="center"
            >
              {imageType === 'cloudinary' ? (
                // For Cloudinary images: Update Photo + Delete Photo
                <>
                  {/* Update Photo Button */}
                  <CldUploadWidget
                    uploadPreset={
                      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
                      'hemsy'
                    }
                    signatureEndpoint="/api/sign-cloudinary-params"
                    onSuccess={handleUploadSuccess}
                    onQueuesStart={() => setIsUploading(true)}
                    onQueuesEnd={() => setIsUploading(false)}
                    options={{
                      sources: ['local', 'camera'],
                      multiple: false,
                      maxFiles: 1,
                      clientAllowedFormats: ['image'],
                      maxImageFileSize: 10000000,
                      showAdvancedOptions: false,
                      cropping: true,
                      croppingAspectRatio: 4 / 3,
                      croppingShowDimensions: true,
                      resourceType: 'image',
                      showSkipCropButton: false,
                    }}
                  >
                    {({ open }) => (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            if (open && typeof open === 'function') {
                              open();
                            } else {
                              console.error(
                                'Cloudinary upload widget not properly initialized'
                              );
                            }
                          }}
                          disabled={isUploading || isDeleting || !open}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: theme.palette.primary.main,
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 },
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                              transform: 'scale(1.1)',
                            },
                            '&:disabled': {
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              color: theme.palette.grey[500],
                            },
                            transition: 'all 0.2s ease-in-out',
                            boxShadow: theme.shadows[4],
                          }}
                          aria-label="Update Photo"
                        >
                          <CameraAltIcon fontSize="large" />
                        </IconButton>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'white',
                            fontWeight: 500,
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            textAlign: 'center',
                          }}
                        >
                          {isUploading ? 'Uploading...' : 'Update Photo'}
                        </Typography>
                      </Box>
                    )}
                  </CldUploadWidget>

                  {/* Delete Photo Button */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalOpen(true);
                      }}
                      disabled={isUploading || isDeleting}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: theme.palette.error.main,
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                          transform: 'scale(1.1)',
                        },
                        '&:disabled': {
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          color: theme.palette.grey[500],
                        },
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: theme.shadows[4],
                      }}
                      aria-label="Delete Photo"
                    >
                      <DeleteIcon fontSize="large" />
                    </IconButton>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontWeight: 500,
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        textAlign: 'center',
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Photo'}
                    </Typography>
                  </Box>
                </>
              ) : (
                // For icons/preset: Change Icon + Upload Photo
                <>
                  {/* Change Icon Button */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setIconModalOpen(true);
                      }}
                      disabled={loading || isUploading}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: theme.palette.primary.main,
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                          transform: 'scale(1.1)',
                        },
                        '&:disabled': {
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          color: theme.palette.grey[500],
                        },
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: theme.shadows[4],
                      }}
                      aria-label="Change Icon"
                    >
                      <PaletteIcon fontSize="large" />
                    </IconButton>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontWeight: 500,
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        textAlign: 'center',
                      }}
                    >
                      Change Icon
                    </Typography>
                  </Box>

                  {/* Upload Photo Button */}
                  <CldUploadWidget
                    uploadPreset={
                      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
                      'hemsy'
                    }
                    signatureEndpoint="/api/sign-cloudinary-params"
                    onSuccess={handleUploadSuccess}
                    onQueuesStart={() => setIsUploading(true)}
                    onQueuesEnd={() => setIsUploading(false)}
                    onError={(error) => {
                      console.error('Cloudinary upload error:', error);
                      setIsUploading(false);
                    }}
                    options={{
                      sources: ['local', 'camera'],
                      multiple: false,
                      maxFiles: 1,
                      clientAllowedFormats: ['image'],
                      maxImageFileSize: 10000000,
                      showAdvancedOptions: false,
                      cropping: true,
                      croppingAspectRatio: 4 / 3,
                      croppingShowDimensions: true,
                      resourceType: 'image',
                      showSkipCropButton: false,
                    }}
                  >
                    {({ open }) => (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            if (open && typeof open === 'function') {
                              open();
                            } else {
                              console.error(
                                'Cloudinary upload widget not properly initialized'
                              );
                            }
                          }}
                          disabled={isUploading || loading || !open}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: theme.palette.primary.main,
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 },
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                              transform: 'scale(1.1)',
                            },
                            '&:disabled': {
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              color: theme.palette.grey[500],
                            },
                            transition: 'all 0.2s ease-in-out',
                            boxShadow: theme.shadows[4],
                          }}
                          aria-label="Upload Photo"
                        >
                          <CameraAltIcon fontSize="large" />
                        </IconButton>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'white',
                            fontWeight: 500,
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            textAlign: 'center',
                          }}
                        >
                          {isUploading ? 'Uploading...' : 'Upload Photo'}
                        </Typography>
                      </Box>
                    )}
                  </CldUploadWidget>
                </>
              )}
            </Stack>
          </Box>
        </Fade>
      </Box>

      {/* Change Icon Modal */}
      <PresetGarmentIconModal
        open={iconModalOpen}
        onClose={() => setIconModalOpen(false)}
        onSave={handleIconChange}
        initialKey={garment.preset_icon_key || undefined}
        initialFill={garment.preset_fill_color || undefined}
      />

      {/* Delete Photo Confirmation Modal */}
      <DeletePhotoConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeletePhoto}
        isDeleting={isDeleting}
        garmentName={garment.name}
      />
    </>
  );
}
