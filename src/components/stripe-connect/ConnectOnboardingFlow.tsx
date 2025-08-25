'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  createConnectAccount,
  createAccountLink,
} from '@/lib/actions/stripe-connect';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowRight,
  Building2,
  User,
  Mail,
  Globe,
  CheckCircle,
  Circle,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Stack,
  Paper,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  stepConnectorClasses,
  Tooltip,
  IconButton,
  Collapse,
  Alert,
  AlertTitle,
  LinearProgress,
  Fade,
  Zoom,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled stepper connector
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient(95deg, rgb(102,126,234) 0%, rgb(118,75,162) 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient(95deg, rgb(102,126,234) 0%, rgb(118,75,162) 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

// Custom step icon
function CustomStepIcon(props: {
  active?: boolean;
  completed?: boolean;
  icon: React.ReactNode;
}) {
  const { active, completed, icon } = props;

  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage:
          completed || active
            ? 'linear-gradient(136deg, rgb(102,126,234) 0%, rgb(118,75,162) 100%)'
            : 'none',
        backgroundColor: completed || active ? 'transparent' : 'grey.300',
        color: completed || active ? 'white' : 'grey.600',
        transition: 'all 0.3s ease',
        boxShadow: active ? '0 4px 20px rgba(102,126,234,0.4)' : 'none',
      }}
    >
      {completed ? <CheckCircle className="h-5 w-5" /> : icon}
    </Box>
  );
}

const steps = [
  { label: 'Account Type', icon: <User className="h-5 w-5" /> },
  { label: 'Contact Info', icon: <Mail className="h-5 w-5" /> },
  { label: 'Location', icon: <Globe className="h-5 w-5" /> },
];

const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
];

export function ConnectOnboardingFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<'form' | 'creating' | 'redirecting'>(
    'form'
  );
  const [email, setEmail] = useState('');
  const [emailAutoPopulated, setEmailAutoPopulated] = useState(false);
  const [businessType, setBusinessType] = useState<'individual' | 'company'>(
    'individual'
  );
  const [country, setCountry] = useState('US');
  const [showHelp, setShowHelp] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoaded } = useUser();

  // Auto-populate email from Clerk user data (only once)
  useEffect(() => {
    if (isLoaded && user && !emailAutoPopulated) {
      const clerkEmail =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        '';

      if (clerkEmail) {
        setEmail(clerkEmail);
        setEmailAutoPopulated(true);
        console.log('Auto-populated email from Clerk:', clerkEmail);
      }
    }
  }, [isLoaded, user, emailAutoPopulated]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!re.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (!validateEmail(email)) {
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCreateAccount = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setStatus('creating');

    try {
      // Create Connect account
      const createResult = await createConnectAccount({
        email,
        country,
        business_type: businessType,
      });

      if (!createResult.success || !createResult.accountId) {
        throw new Error(createResult.error || 'Failed to create account');
      }

      setStatus('redirecting');

      // Create onboarding link
      const linkResult = await createAccountLink({
        accountId: createResult.accountId,
        type: 'account_onboarding',
      });

      if (!linkResult.success || !linkResult.url) {
        throw new Error(linkResult.error || 'Failed to create onboarding link');
      }

      // Redirect to Stripe onboarding
      window.location.href = linkResult.url;
    } catch (error) {
      console.error('Error creating Connect account:', error);
      setStatus('form');
      toast({
        title: 'Setup Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to set up Connect account',
        variant: 'destructive',
      });
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                How is your business structured?
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                sx={{ mb: 3 }}
              >
                This helps us determine the right setup for your payments
              </Typography>

              <ToggleButtonGroup
                value={businessType}
                exclusive
                onChange={(_, value) => value && setBusinessType(value)}
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton
                  value="individual"
                  sx={{
                    py: 3,
                    px: 2,
                    textTransform: 'none',
                    borderRadius: 2,
                    mr: 1,
                    border: '2px solid',
                    borderColor:
                      businessType === 'individual'
                        ? 'primary.main'
                        : 'divider',
                    '&.Mui-selected': {
                      backgroundColor: alpha('#667eea', 0.08),
                      borderColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: alpha('#667eea', 0.12),
                      },
                    },
                  }}
                >
                  <Stack spacing={1} alignItems="center" sx={{ width: '100%' }}>
                    <User className="h-8 w-8" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Individual / Sole Proprietor
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      textAlign="center"
                    >
                      I operate as an individual or sole proprietorship
                    </Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton
                  value="company"
                  sx={{
                    py: 3,
                    px: 2,
                    textTransform: 'none',
                    borderRadius: 2,
                    ml: 1,
                    border: '2px solid',
                    borderColor:
                      businessType === 'company' ? 'primary.main' : 'divider',
                    '&.Mui-selected': {
                      backgroundColor: alpha('#667eea', 0.08),
                      borderColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: alpha('#667eea', 0.12),
                      },
                    },
                  }}
                >
                  <Stack spacing={1} alignItems="center" sx={{ width: '100%' }}>
                    <Building2 className="h-8 w-8" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Company / Business
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      textAlign="center"
                    >
                      I have a registered business entity (LLC, Corp, etc.)
                    </Typography>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>

              <Collapse in={showHelp}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <AlertTitle>Not sure which to choose?</AlertTitle>
                  <Typography variant="body2">
                    <strong>Individual:</strong> Choose this if you file taxes
                    using your SSN and don&apos;t have a business EIN.
                    <br />
                    <br />
                    <strong>Company:</strong> Choose this if you have an EIN,
                    LLC, Corporation, or other registered business structure.
                  </Typography>
                </Alert>
              </Collapse>
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                What&apos;s your email address?
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                sx={{ mb: 3 }}
              >
                {emailAutoPopulated
                  ? "We've pre-filled your email from your account. You can edit it if needed."
                  : 'This will be used to create your Stripe login'}
              </Typography>

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                error={!!emailError}
                helperText={
                  emailError ||
                  "You'll use this email to sign in to your Stripe dashboard"
                }
                InputProps={{
                  startAdornment: (
                    <Mail className="h-5 w-5 mr-2 text-gray-400" />
                  ),
                  endAdornment: emailAutoPopulated ? (
                    <Tooltip title="Auto-populated from your account">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </Tooltip>
                  ) : null,
                }}
                sx={{ mb: 3 }}
              />

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'info.lighter',
                  border: '1px solid',
                  borderColor: 'info.light',
                }}
              >
                <Stack direction="row" spacing={1.5}>
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="info.dark"
                      fontWeight="bold"
                    >
                      Important
                    </Typography>
                    <Typography variant="body2" color="info.dark">
                      Make sure you have access to this email. Stripe will send
                      important account notifications here.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Fade>
        );

      case 2:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Where is your business located?
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                sx={{ mb: 3 }}
              >
                Select your country to ensure proper payment processing
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Country</InputLabel>
                <Select
                  value={country}
                  label="Country"
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {countries.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h6">{c.flag}</Typography>
                        <Typography>{c.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Stripe is available in select countries. More locations coming
                  soon.
                </FormHelperText>
              </FormControl>

              <Alert severity="success" sx={{ mt: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Ready to continue!
                  </Typography>
                  <Typography variant="body2">
                    After clicking &quot;Create Account&quot;, you&apos;ll be
                    redirected to Stripe to complete your setup:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <Typography component="li" variant="body2">
                      Verify your identity
                    </Typography>
                    <Typography component="li" variant="body2">
                      Add your bank account details
                    </Typography>
                    <Typography component="li" variant="body2">
                      Configure your business information
                    </Typography>
                  </Box>
                </Stack>
              </Alert>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  if (status === 'creating' || status === 'redirecting') {
    return (
      <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <LinearProgress sx={{ height: 4 }} />
        <CardContent sx={{ py: 8, textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Sparkles className="h-6 w-6 absolute -top-2 -right-2 text-warning" />
          </Box>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            {status === 'creating'
              ? 'Creating your account...'
              : 'Redirecting to Stripe...'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {status === 'creating'
              ? 'Setting up your payment account with Stripe'
              : "You'll complete the setup process on Stripe's secure platform"}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardHeader
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: 4,
          pb: 6,
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Sparkles className="h-10 w-10" />
          <Typography variant="h5" fontWeight="bold">
            Set Up Your Payment Account
          </Typography>
          <Typography
            variant="body2"
            sx={{ opacity: 0.9, textAlign: 'center', maxWidth: 400 }}
          >
            Complete this quick setup to start accepting payments directly to
            your bank account
          </Typography>
        </Stack>
      </CardHeader>

      <CardContent sx={{ p: 4 }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          connector={<CustomConnector />}
          sx={{ mb: 5 }}
        >
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconComponent={() => (
                  <CustomStepIcon
                    active={activeStep === index}
                    completed={activeStep > index}
                    icon={step.icon}
                  />
                )}
              >
                <Typography
                  variant="caption"
                  fontWeight={activeStep === index ? 'bold' : 'normal'}
                >
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 320, mb: 4 }}>{renderStepContent()}</Box>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            {activeStep === 0 && (
              <Button
                variant="text"
                onClick={() => setShowHelp(!showHelp)}
                startIcon={<Info className="h-4 w-4" />}
                sx={{ textTransform: 'none' }}
              >
                Need help deciding?
              </Button>
            )}
            {activeStep > 0 && (
              <Button onClick={handleBack} sx={{ textTransform: 'none' }}>
                Back
              </Button>
            )}
          </Box>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowRight className="h-4 w-4" />}
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 4,
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCreateAccount}
              endIcon={<CheckCircle className="h-4 w-4" />}
              size="large"
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 4,
              }}
            >
              Create Stripe Account
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
