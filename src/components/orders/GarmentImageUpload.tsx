'use client';

import { useState } from 'react';
import { CldUploadWidget, CldImage } from 'next-cloudinary';
import {
  Box,
  Button,
  Card,
  CardMedia,
  IconButton,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface GarmentImageUploadProps {
  imageUrl?: string | undefined;
  publicId?: string | undefined;
  onUpload: (result: any) => void;
  onRemove: () => void;
  garmentName?: string | undefined;
  variant?: 'card' | 'link';
}

export default function GarmentImageUpload({
  imageUrl,
  publicId,
  onUpload,
  onRemove,
  garmentName,
  variant = 'card',
}: GarmentImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = (result: any) => {
    setIsUploading(false);
    if (result?.info) {
      onUpload({
        publicId: result.info.public_id,
        url: result.info.secure_url,
        thumbnailUrl: result.info.thumbnail_url,
        width: result.info.width,
        height: result.info.height,
      });
    }
  };

  return (
    <Box>
      {variant === 'card' ? (
        publicId ? (
          <Card variant="outlined" sx={{ position: 'relative' }}>
            <Box sx={{ position: 'relative', paddingTop: '75%' }}>
              <CldImage
                src={publicId}
                alt={garmentName || 'Garment image'}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <Stack
                direction="row"
                spacing={1}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Uploaded"
                  size="small"
                  color="success"
                  sx={{ bgcolor: 'background.paper' }}
                />
                <IconButton
                  size="small"
                  onClick={onRemove}
                  sx={{
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'error.main', color: 'white' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </Card>
        ) : (
          <CldUploadWidget
            uploadPreset={
              process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'threadfolio'
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
              styles: {
                palette: {
                  window: '#FFFFFF',
                  windowBorder: '#90A0B3',
                  tabIcon: '#1976D2',
                  menuIcons: '#5A616A',
                  textDark: '#605143',
                  textLight: '#FFFFFF',
                  link: '#1976D2',
                  action: '#339CE3',
                  inactiveTabIcon: '#0E2F5A',
                  error: '#F44235',
                  inProgress: '#1976D2',
                  complete: '#20B832',
                  sourceBg: '#E4EBF1',
                },
              },
            }}
          >
            {({ open }) => (
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => {
                  if (open && typeof open === 'function') {
                    open();
                  } else {
                    console.error(
                      'Cloudinary upload widget not properly initialized'
                    );
                  }
                }}
              >
                <Stack spacing={2} alignItems="center">
                  <Box
                    sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}
                  >
                    <CameraAltIcon
                      sx={{ fontSize: 48, color: 'text.secondary' }}
                    />
                    <AddPhotoAlternateIcon
                      sx={{ fontSize: 48, color: 'text.secondary' }}
                    />
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    {isUploading ? 'Uploading...' : 'Add Garment Photo'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tap to take a photo or upload an image
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Max size: 10MB • JPG, PNG, WEBP
                  </Typography>
                </Stack>
              </Card>
            )}
          </CldUploadWidget>
        )
      ) : (
        <CldUploadWidget
          uploadPreset={
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'threadfolio'
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
            <Button
              variant="text"
              onClick={() => {
                if (open && typeof open === 'function') {
                  open();
                } else {
                  console.error(
                    'Cloudinary upload widget not properly initialized'
                  );
                }
              }}
              disabled={!open}
              sx={{ p: 0, textDecoration: 'underline' }}
            >
              {isUploading ? 'Uploading…' : 'Upload photo'}
            </Button>
          )}
        </CldUploadWidget>
      )}
    </Box>
  );
}
