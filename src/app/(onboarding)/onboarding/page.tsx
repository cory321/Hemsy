'use client';

import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from '@/lib/actions/onboarding';
import { useUser } from '@clerk/nextjs';
import { TimezoneSelection } from '@/components/onboarding/TimezoneSelection';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    address: '',
    phone: '',
    email: '',
    locationType: 'shop_location' as
      | 'home_based'
      | 'shop_location'
      | 'mobile_service',
    workingHours: {},
    timezone: '',
    timezoneOffset: 0,
  });

  const steps = ['Business Info', 'Location & Hours', 'Get Started'];

  // Prefill flags so user edits are not overwritten after initial prefill
  const didPrefillEmailRef = useRef(false);
  const didPrefillBusinessRef = useRef(false);

  // Prefill email from Clerk once when available; allow user to edit/delete afterwards
  useEffect(() => {
    if (didPrefillEmailRef.current) return;
    if (!user) return;

    const clerkEmail =
      (user as any).primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      '';

    if (clerkEmail && !formData.email) {
      setFormData((prev) => ({ ...prev, email: clerkEmail }));
      didPrefillEmailRef.current = true;
    }
  }, [user]);

  // Prefill business name from Clerk name once; allow user to edit/delete afterwards
  useEffect(() => {
    if (didPrefillBusinessRef.current) return;
    if (!user) return;

    const firstName = (user as any).firstName as string | undefined;
    const lastName = (user as any).lastName as string | undefined;

    let suggestedName = '';
    if (firstName && lastName) {
      suggestedName = `${firstName} ${lastName}'s Shop`;
    } else if (firstName) {
      suggestedName = `${firstName}'s Shop`;
    } else if (lastName) {
      suggestedName = `${lastName}'s Shop`;
    }

    if (suggestedName && !formData.businessName) {
      setFormData((prev) => ({ ...prev, businessName: suggestedName }));
      didPrefillBusinessRef.current = true;
    }
  }, [user]);

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Save onboarding data
      setLoading(true);
      setError(null);

      try {
        const onboardingData = {
          businessName: formData.businessName,
          locationType: formData.locationType,
          workingHours: formData.workingHours,
          email: formData.email,
          timezone: formData.timezone,
          timezoneOffset: formData.timezoneOffset,
          ...(formData.businessType && { businessType: formData.businessType }),
          ...(formData.phone && { phoneNumber: formData.phone }),
          ...(formData.address && { mailingAddress: formData.address }),
        };

        const result = await completeOnboarding(onboardingData);

        if (result.error) {
          setError(result.error);
          setLoading(false);
        } else {
          // Redirect to dashboard on success
          router.push('/dashboard');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tell us about your business
            </Typography>
            <TextField
              fullWidth
              label="Business Name"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              sx={{ mb: 3 }}
              required
              error={!formData.businessName && activeStep > 0}
              helperText={
                !formData.businessName && activeStep > 0
                  ? 'Business name is required'
                  : ''
              }
            />
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              type="email"
              sx={{ mb: 3 }}
              required
              error={!formData.email && activeStep > 0}
              helperText={
                !formData.email && activeStep > 0 ? 'Email is required' : ''
              }
            />
            <PhoneInput
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(value, isValid) =>
                setFormData({ ...formData, phone: value })
              }
              sx={{ mb: 3 }}
              showValidation={false}
            />
            <FormControl fullWidth>
              <InputLabel>Location Type</InputLabel>
              <Select
                value={formData.locationType}
                label="Location Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    locationType: e.target.value as any,
                  })
                }
              >
                <MenuItem value="shop_location">
                  Physical Shop Location
                </MenuItem>
                <MenuItem value="home_based">Home-Based Business</MenuItem>
                <MenuItem value="mobile_service">Mobile Service</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Where is your business located?
            </Typography>
            <TextField
              fullWidth
              label="Business Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              multiline
              rows={2}
              sx={{ mb: 3 }}
              helperText="Leave blank if you work from home or are mobile-only"
            />
            <Typography variant="body1" gutterBottom sx={{ mt: 3 }}>
              What are your typical working hours?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              You can customize these later in settings
            </Typography>
            {/* Simplified working hours for onboarding */}
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Weekday Hours"
                defaultValue="9:00 AM - 6:00 PM"
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Weekend Hours"
                defaultValue="10:00 AM - 4:00 PM"
                fullWidth
              />
            </Box>

            {/* Timezone Selection */}
            <Box sx={{ mt: 3 }}>
              <TimezoneSelection
                value={formData.timezone}
                onChange={(timezone, offset) =>
                  setFormData({
                    ...formData,
                    timezone,
                    timezoneOffset: offset,
                  })
                }
              />
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              You&apos;re all set! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your 14-day free trial starts now. No credit card required.
            </Typography>
            <Typography variant="body1" paragraph>
              We&apos;ve set up your account with the information you provided.
              You can start adding clients and creating orders right away.
            </Typography>
            <Box
              sx={{ mt: 4, p: 3, bgcolor: 'primary.light', borderRadius: 2 }}
            >
              <Typography variant="h6" gutterBottom>
                Quick Start Tips:
              </Typography>
              <Typography variant="body2" align="left">
                • Add your alteration services and pricing
                <br />
                • Create your first client
                <br />
                • Schedule your first appointment
                <br />• Explore the dashboard for quick actions
              </Typography>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Welcome to Threadfolio
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          paragraph
        >
          Let&apos;s get your seamstress business set up in just a few minutes
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card>
          <CardContent sx={{ minHeight: 400, p: 4 }}>
            {renderStepContent()}
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button disabled={activeStep === 0 || loading} onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            size="large"
            disabled={
              loading ||
              (activeStep === 0 && (!formData.businessName || !formData.email))
            }
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : activeStep === steps.length - 1 ? (
              'Go to Dashboard'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
