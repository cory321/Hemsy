'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
  Chip,
  Divider,
  Stack,
  useTheme,
  alpha,
  useMediaQuery,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  LocalAtm as CashIcon,
  Store as POSIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import StripePaymentForm from './StripePaymentForm';
import { formatCurrency } from '@/lib/utils/currency';

interface PaymentCollectionCardProps {
  totalAmount: number;
  clientEmail: string;
  onPaymentMethodSelect: (
    method: 'stripe' | 'cash' | 'external_pos' | 'send_invoice'
  ) => void;
  onPaymentIntentChange: (paymentIntent: any) => void;
  onStripePaymentSuccess: (paymentMethodId: string) => void;
}

// Amount Selection Component
interface AmountSelectionSectionProps {
  totalAmount: number;
  paymentAmount: 'full' | 'deposit' | 'custom';
  customAmount: string;
  onAmountChange: (amount: 'full' | 'deposit' | 'custom') => void;
  onCustomAmountChange: (value: string) => void;
}

function AmountSelectionSection({
  totalAmount,
  paymentAmount,
  customAmount,
  onAmountChange,
  onCustomAmountChange,
}: AmountSelectionSectionProps) {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        How much to collect now?
      </Typography>
      <Stack spacing={2}>
        <Card
          sx={{
            p: 2,
            cursor: 'pointer',
            border: 2,
            borderColor: paymentAmount === 'full' ? 'primary.main' : 'grey.300',
            bgcolor:
              paymentAmount === 'full'
                ? alpha(theme.palette.primary.main, 0.05)
                : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
            },
          }}
          onClick={() => onAmountChange('full')}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {paymentAmount === 'full' && (
                <CheckIcon color="primary" fontSize="small" />
              )}
              <Typography
                variant="body1"
                sx={{
                  fontWeight: paymentAmount === 'full' ? 600 : 400,
                }}
              >
                Full Amount
              </Typography>
            </Box>
            <Typography variant="h6" color="primary">
              {formatCurrency(totalAmount / 100)}
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2,
            cursor: 'pointer',
            border: 2,
            borderColor:
              paymentAmount === 'deposit' ? 'primary.main' : 'grey.300',
            bgcolor:
              paymentAmount === 'deposit'
                ? alpha(theme.palette.primary.main, 0.05)
                : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
            },
          }}
          onClick={() => onAmountChange('deposit')}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {paymentAmount === 'deposit' && (
                <CheckIcon color="primary" fontSize="small" />
              )}
              <Typography
                variant="body1"
                sx={{
                  fontWeight: paymentAmount === 'deposit' ? 600 : 400,
                }}
              >
                50% Deposit
              </Typography>
            </Box>
            <Typography variant="h6" color="primary">
              {formatCurrency(totalAmount / 2 / 100)}
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2,
            cursor: 'pointer',
            border: 2,
            borderColor:
              paymentAmount === 'custom' ? 'primary.main' : 'grey.300',
            bgcolor:
              paymentAmount === 'custom'
                ? alpha(theme.palette.primary.main, 0.05)
                : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
            },
          }}
          onClick={() => onAmountChange('custom')}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: paymentAmount === 'custom' ? 1 : 0,
              }}
            >
              {paymentAmount === 'custom' && (
                <CheckIcon color="primary" fontSize="small" />
              )}
              <Typography
                variant="body1"
                sx={{
                  fontWeight: paymentAmount === 'custom' ? 600 : 400,
                }}
              >
                Custom Amount
              </Typography>
            </Box>
            {paymentAmount === 'custom' && (
              <TextField
                size="small"
                value={customAmount}
                onChange={(e) => onCustomAmountChange(e.target.value)}
                type="number"
                fullWidth
                placeholder="Enter amount"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
            )}
          </Box>
        </Card>
      </Stack>
    </Box>
  );
}

export default function PaymentCollectionCard({
  totalAmount,
  clientEmail,
  onPaymentMethodSelect,
  onPaymentIntentChange,
  onStripePaymentSuccess,
}: PaymentCollectionCardProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [collectNow, setCollectNow] = useState<boolean | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<
    'full' | 'deposit' | 'custom'
  >('full');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [dueDate, setDueDate] = useState<Dayjs | null>(dayjs().add(7, 'days'));
  const [externalReference, setExternalReference] = useState('');

  // Calculate actual payment amount
  const getPaymentAmount = () => {
    if (paymentAmount === 'full') return totalAmount;
    if (paymentAmount === 'deposit') return Math.round(totalAmount / 2);
    return parseFloat(customAmount || '0') * 100;
  };

  // No more step management needed for mobile - unified view

  const handleCollectNowChange = (value: boolean) => {
    // Avoid resetting selection if the state isn't changing
    if (value === collectNow) {
      return;
    }

    setCollectNow(value);
    if (!value) {
      setPaymentMethod('send_invoice');
      onPaymentMethodSelect('send_invoice');
      onPaymentIntentChange({
        collectNow: false,
        dueDate: dueDate?.toDate(),
        notes: invoiceNotes,
      });
    } else {
      // Switching to collect now: clear method so user picks one, but don't clear if already set in same state
      setPaymentMethod('');
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    // Don't change step - keep both payment method and amount selection visible
    onPaymentMethodSelect(method as any);

    // Update payment intent
    onPaymentIntentChange({
      collectNow: true,
      method: method as any,
      depositAmount:
        getPaymentAmount() !== totalAmount ? getPaymentAmount() : undefined,
      externalReference:
        method === 'external_pos' ? externalReference : undefined,
    });
  };

  const handleAmountChange = (amount: 'full' | 'deposit' | 'custom') => {
    setPaymentAmount(amount);
    if (amount !== 'custom') {
      const paymentValue =
        amount === 'full' ? totalAmount : Math.round(totalAmount / 2);
      onPaymentIntentChange({
        collectNow: true,
        method: paymentMethod as any,
        depositAmount: paymentValue !== totalAmount ? paymentValue : undefined,
        externalReference:
          paymentMethod === 'external_pos' ? externalReference : undefined,
      });
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    onPaymentIntentChange({
      collectNow: true,
      method: paymentMethod as any,
      depositAmount: value ? parseFloat(value) * 100 : undefined,
      externalReference:
        paymentMethod === 'external_pos' ? externalReference : undefined,
    });
  };

  const handleExternalReferenceChange = (value: string) => {
    setExternalReference(value);
    onPaymentIntentChange({
      collectNow: true,
      method: paymentMethod as any,
      depositAmount:
        getPaymentAmount() !== totalAmount ? getPaymentAmount() : undefined,
      externalReference: value,
    });
  };

  // Desktop Layout - Compact and efficient
  if (isDesktop) {
    return (
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: theme.palette.mode === 'light' ? 'white' : 'grey.900',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            💳 Payment Collection
          </Typography>

          {/* Payment Timing Selection */}
          <RadioGroup
            value={collectNow === null ? '' : collectNow ? 'now' : 'later'}
            onChange={(e) => {
              const value = e.target.value === 'now';
              handleCollectNowChange(value);
            }}
          >
            <Paper
              sx={{
                p: 2,
                mb: 2,
                border: collectNow === true ? 2 : 1,
                borderColor: collectNow === true ? 'primary.main' : 'divider',
                cursor: 'pointer',
              }}
              onClick={() => handleCollectNowChange(true)}
            >
              <FormControlLabel
                value="now"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      Collect Payment Now
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Card, Cash, or External POS
                    </Typography>
                  </Box>
                }
              />

              {collectNow === true && (
                <>
                  {/* Payment Methods - Beautiful Radio Button Style */}
                  <Box sx={{ mt: 2, pl: 4, mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                      Select Payment Method:
                    </Typography>
                    <RadioGroup
                      value={paymentMethod}
                      onChange={(e) =>
                        handlePaymentMethodChange(e.target.value as any)
                      }
                      sx={{ gap: 1.5 }}
                    >
                      {/* Card Payment Option */}
                      <Paper
                        elevation={0}
                        sx={{
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: 2,
                          borderColor:
                            paymentMethod === 'stripe'
                              ? 'primary.main'
                              : 'divider',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          backgroundColor:
                            paymentMethod === 'stripe'
                              ? alpha(theme.palette.primary.main, 0.08)
                              : 'background.paper',
                          '&:hover': {
                            borderColor:
                              paymentMethod === 'stripe'
                                ? 'primary.main'
                                : alpha(theme.palette.primary.main, 0.5),
                            backgroundColor:
                              paymentMethod === 'stripe'
                                ? alpha(theme.palette.primary.main, 0.08)
                                : alpha(theme.palette.primary.main, 0.04),
                            transform: 'translateY(-2px)',
                            boxShadow: 4,
                          },
                        }}
                        onClick={() => handlePaymentMethodChange('stripe')}
                      >
                        <FormControlLabel
                          value="stripe"
                          control={
                            <Radio
                              sx={{
                                position: 'absolute',
                                opacity: 0,
                                width: 0,
                                height: 0,
                              }}
                            />
                          }
                          label={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                py: 2,
                                px: 2.5,
                                width: '100%',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor:
                                    paymentMethod === 'stripe'
                                      ? 'primary.main'
                                      : alpha(theme.palette.primary.main, 0.1),
                                  transition: 'all 0.3s ease',
                                  mr: 2,
                                }}
                              >
                                <CreditCardIcon
                                  sx={{
                                    fontSize: 24,
                                    color:
                                      paymentMethod === 'stripe'
                                        ? 'primary.contrastText'
                                        : 'primary.main',
                                    transition: 'color 0.3s ease',
                                  }}
                                />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight:
                                      paymentMethod === 'stripe' ? 600 : 500,
                                    color:
                                      paymentMethod === 'stripe'
                                        ? 'primary.main'
                                        : 'text.primary',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  Card Payment
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                  }}
                                >
                                  Credit or debit card
                                </Typography>
                              </Box>
                              {paymentMethod === 'stripe' && (
                                <CheckCircleIcon
                                  sx={{
                                    color: 'primary.main',
                                    fontSize: 24,
                                    animation: 'scaleIn 0.3s ease',
                                    '@keyframes scaleIn': {
                                      '0%': { transform: 'scale(0)' },
                                      '100%': { transform: 'scale(1)' },
                                    },
                                  }}
                                />
                              )}
                            </Box>
                          }
                          sx={{ m: 0, p: 0, width: '100%' }}
                        />
                      </Paper>

                      {/* Cash Payment Option */}
                      <Paper
                        elevation={0}
                        sx={{
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: 2,
                          borderColor:
                            paymentMethod === 'cash'
                              ? 'success.main'
                              : 'divider',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          backgroundColor:
                            paymentMethod === 'cash'
                              ? alpha(theme.palette.success.main, 0.08)
                              : 'background.paper',
                          '&:hover': {
                            borderColor:
                              paymentMethod === 'cash'
                                ? 'success.main'
                                : alpha(theme.palette.success.main, 0.5),
                            backgroundColor:
                              paymentMethod === 'cash'
                                ? alpha(theme.palette.success.main, 0.08)
                                : alpha(theme.palette.success.main, 0.04),
                            transform: 'translateY(-2px)',
                            boxShadow: 4,
                          },
                        }}
                        onClick={() => handlePaymentMethodChange('cash')}
                      >
                        <FormControlLabel
                          value="cash"
                          control={
                            <Radio
                              sx={{
                                position: 'absolute',
                                opacity: 0,
                                width: 0,
                                height: 0,
                              }}
                            />
                          }
                          label={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                py: 2,
                                px: 2.5,
                                width: '100%',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor:
                                    paymentMethod === 'cash'
                                      ? 'success.main'
                                      : alpha(theme.palette.success.main, 0.1),
                                  transition: 'all 0.3s ease',
                                  mr: 2,
                                }}
                              >
                                <CashIcon
                                  sx={{
                                    fontSize: 24,
                                    color:
                                      paymentMethod === 'cash'
                                        ? 'success.contrastText'
                                        : 'success.main',
                                    transition: 'color 0.3s ease',
                                  }}
                                />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight:
                                      paymentMethod === 'cash' ? 600 : 500,
                                    color:
                                      paymentMethod === 'cash'
                                        ? 'success.main'
                                        : 'text.primary',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  Cash Payment
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                  }}
                                >
                                  Pay with cash on delivery
                                </Typography>
                              </Box>
                              {paymentMethod === 'cash' && (
                                <CheckCircleIcon
                                  sx={{
                                    color: 'success.main',
                                    fontSize: 24,
                                    animation: 'scaleIn 0.3s ease',
                                    '@keyframes scaleIn': {
                                      '0%': { transform: 'scale(0)' },
                                      '100%': { transform: 'scale(1)' },
                                    },
                                  }}
                                />
                              )}
                            </Box>
                          }
                          sx={{ m: 0, p: 0, width: '100%' }}
                        />
                      </Paper>

                      {/* External POS Option */}
                      <Paper
                        elevation={0}
                        sx={{
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: 2,
                          borderColor:
                            paymentMethod === 'external_pos'
                              ? 'info.main'
                              : 'divider',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          backgroundColor:
                            paymentMethod === 'external_pos'
                              ? alpha(theme.palette.info.main, 0.08)
                              : 'background.paper',
                          '&:hover': {
                            borderColor:
                              paymentMethod === 'external_pos'
                                ? 'info.main'
                                : alpha(theme.palette.info.main, 0.5),
                            backgroundColor:
                              paymentMethod === 'external_pos'
                                ? alpha(theme.palette.info.main, 0.08)
                                : alpha(theme.palette.info.main, 0.04),
                            transform: 'translateY(-2px)',
                            boxShadow: 4,
                          },
                        }}
                        onClick={() =>
                          handlePaymentMethodChange('external_pos')
                        }
                      >
                        <FormControlLabel
                          value="external_pos"
                          control={
                            <Radio
                              sx={{
                                position: 'absolute',
                                opacity: 0,
                                width: 0,
                                height: 0,
                              }}
                            />
                          }
                          label={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                py: 2,
                                px: 2.5,
                                width: '100%',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor:
                                    paymentMethod === 'external_pos'
                                      ? 'info.main'
                                      : alpha(theme.palette.info.main, 0.1),
                                  transition: 'all 0.3s ease',
                                  mr: 2,
                                }}
                              >
                                <POSIcon
                                  sx={{
                                    fontSize: 24,
                                    color:
                                      paymentMethod === 'external_pos'
                                        ? 'info.contrastText'
                                        : 'info.main',
                                    transition: 'color 0.3s ease',
                                  }}
                                />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight:
                                      paymentMethod === 'external_pos'
                                        ? 600
                                        : 500,
                                    color:
                                      paymentMethod === 'external_pos'
                                        ? 'info.main'
                                        : 'text.primary',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  External POS
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                  }}
                                >
                                  Process via external terminal
                                </Typography>
                              </Box>
                              {paymentMethod === 'external_pos' && (
                                <CheckCircleIcon
                                  sx={{
                                    color: 'info.main',
                                    fontSize: 24,
                                    animation: 'scaleIn 0.3s ease',
                                    '@keyframes scaleIn': {
                                      '0%': { transform: 'scale(0)' },
                                      '100%': { transform: 'scale(1)' },
                                    },
                                  }}
                                />
                              )}
                            </Box>
                          }
                          sx={{ m: 0, p: 0, width: '100%' }}
                        />
                      </Paper>
                    </RadioGroup>
                  </Box>

                  {/* Amount Selection - Enhanced - Now separate from payment method selection */}
                  {paymentMethod && (
                    <Box sx={{ pl: 4 }}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1.5, fontWeight: 500 }}
                      >
                        Select Amount to Collect:
                      </Typography>
                      <Stack spacing={1}>
                        <Paper
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            border: 1,
                            borderColor:
                              paymentAmount === 'full'
                                ? 'primary.main'
                                : 'divider',
                            bgcolor:
                              paymentAmount === 'full'
                                ? alpha(theme.palette.primary.main, 0.05)
                                : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                            },
                          }}
                          onClick={() => handleAmountChange('full')}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {paymentAmount === 'full' && (
                                <CheckIcon color="primary" fontSize="small" />
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight:
                                    paymentAmount === 'full' ? 600 : 400,
                                }}
                              >
                                Full Amount
                              </Typography>
                            </Box>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600, color: 'primary.main' }}
                            >
                              {formatCurrency(totalAmount / 100)}
                            </Typography>
                          </Box>
                        </Paper>
                        <Paper
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            border: 1,
                            borderColor:
                              paymentAmount === 'deposit'
                                ? 'primary.main'
                                : 'divider',
                            bgcolor:
                              paymentAmount === 'deposit'
                                ? alpha(theme.palette.primary.main, 0.05)
                                : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                            },
                          }}
                          onClick={() => handleAmountChange('deposit')}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {paymentAmount === 'deposit' && (
                                <CheckIcon color="primary" fontSize="small" />
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight:
                                    paymentAmount === 'deposit' ? 600 : 400,
                                }}
                              >
                                50% Deposit
                              </Typography>
                            </Box>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600, color: 'primary.main' }}
                            >
                              {formatCurrency(totalAmount / 2 / 100)}
                            </Typography>
                          </Box>
                        </Paper>
                        <Paper
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            border: 1,
                            borderColor:
                              paymentAmount === 'custom'
                                ? 'primary.main'
                                : 'divider',
                            bgcolor:
                              paymentAmount === 'custom'
                                ? alpha(theme.palette.primary.main, 0.05)
                                : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                            },
                          }}
                          onClick={() => handleAmountChange('custom')}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {paymentAmount === 'custom' && (
                                <CheckIcon color="primary" fontSize="small" />
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight:
                                    paymentAmount === 'custom' ? 600 : 400,
                                }}
                              >
                                Custom Amount
                              </Typography>
                            </Box>
                            {paymentAmount === 'custom' && (
                              <TextField
                                size="small"
                                value={customAmount}
                                onChange={(e) =>
                                  handleCustomAmountChange(e.target.value)
                                }
                                type="number"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      $
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{ width: '120px' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </Box>
                        </Paper>
                      </Stack>
                      {/* Method-specific fields */}
                      {paymentMethod === 'external_pos' && (
                        <TextField
                          label="POS Reference Number"
                          value={externalReference}
                          onChange={(e) =>
                            handleExternalReferenceChange(e.target.value)
                          }
                          fullWidth
                          size="small"
                          required
                          sx={{ mt: 2 }}
                        />
                      )}

                      {/* Method-specific alerts */}
                      {paymentMethod === 'cash' && (
                        <Alert
                          severity="warning"
                          sx={{ mt: 2 }}
                          icon={<CashIcon />}
                        >
                          Collect cash payment before proceeding
                        </Alert>
                      )}

                      {paymentMethod === 'stripe' && (
                        <Alert
                          severity="info"
                          sx={{ mt: 2 }}
                          icon={<CreditCardIcon />}
                        >
                          Card details will be collected securely
                        </Alert>
                      )}

                      {/* Payment Summary Box */}
                      {paymentMethod &&
                        paymentAmount &&
                        (paymentAmount !== 'custom' || customAmount) && (
                          <Paper
                            sx={{
                              mt: 2,
                              p: 2,
                              bgcolor: alpha(theme.palette.success.main, 0.05),
                              border: 1,
                              borderColor: 'success.main',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, mb: 1 }}
                            >
                              Payment Configuration:
                            </Typography>
                            <Stack spacing={0.5}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <CheckIcon fontSize="small" color="success" />
                                <Typography variant="body2">
                                  Method:{' '}
                                  {paymentMethod === 'stripe'
                                    ? 'Card'
                                    : paymentMethod === 'cash'
                                      ? 'Cash'
                                      : 'External POS'}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <CheckIcon fontSize="small" color="success" />
                                <Typography variant="body2">
                                  Amount:{' '}
                                  {formatCurrency(getPaymentAmount() / 100)}
                                  {paymentAmount === 'deposit' &&
                                    ' (50% deposit)'}
                                  {paymentAmount === 'custom' &&
                                    ' (custom amount)'}
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        )}
                    </Box>
                  )}
                </>
              )}
            </Paper>

            <Paper
              sx={{
                p: 2,
                border: collectNow === false ? 2 : 1,
                borderColor: collectNow === false ? 'primary.main' : 'divider',
                cursor: 'pointer',
              }}
              onClick={() => handleCollectNowChange(false)}
            >
              <FormControlLabel
                value="later"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      Send Invoice Later
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email payment link to customer
                    </Typography>
                  </Box>
                }
              />

              {collectNow === false && (
                <Box sx={{ mt: 2, pl: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <DatePicker
                      label="Due Date"
                      value={dueDate}
                      onChange={(newValue) => {
                        setDueDate(newValue);
                        onPaymentIntentChange({
                          collectNow: false,
                          dueDate: newValue?.toDate() || undefined,
                          notes: invoiceNotes,
                        });
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: { flex: 1 },
                        },
                      }}
                    />
                    <TextField
                      label="Invoice Notes"
                      value={invoiceNotes}
                      onChange={(e) => {
                        setInvoiceNotes(e.target.value);
                        onPaymentIntentChange({
                          collectNow: false,
                          dueDate: dueDate?.toDate() || undefined,
                          notes: e.target.value,
                        });
                      }}
                      multiline
                      rows={1}
                      size="small"
                      sx={{ flex: 2 }}
                      placeholder="Payment terms or instructions"
                    />
                  </Stack>
                  <Alert severity="info" sx={{ mt: 2 }} icon={<SendIcon />}>
                    Invoice will be sent to {clientEmail || 'the customer'}
                  </Alert>
                </Box>
              )}
            </Paper>
          </RadioGroup>
        </CardContent>
      </Card>
    );
  }

  // Mobile Layout (existing stepped approach)
  return (
    <Card
      sx={{
        mt: 3,
        borderRadius: 2,
        boxShadow: 3,
        bgcolor: theme.palette.mode === 'light' ? 'white' : 'grey.900',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            💳 Payment Collection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Order: {formatCurrency(totalAmount / 100)}
          </Typography>
        </Box>

        {/* No more step indicator needed */}

        {/* Step 1: Payment Timing */}
        {collectNow === null && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              When would you like to collect payment?
            </Typography>
            <Stack spacing={2}>
              <Card
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: 2,
                  borderColor: 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
                onClick={() => handleCollectNowChange(true)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MoneyIcon sx={{ color: 'primary.main' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      Collect Payment Now
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Card, Cash, or External POS
                    </Typography>
                  </Box>
                </Box>
              </Card>

              <Card
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: 2,
                  borderColor: 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
                onClick={() => handleCollectNowChange(false)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SendIcon sx={{ color: 'text.secondary' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      Send Invoice Later
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email payment link to customer
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Stack>
          </Box>
        )}

        {/* Payment Method & Amount Selection (for collect now) */}
        {collectNow === true && (
          <Box sx={{ mt: 3 }}>
            {/* Payment Method Selection */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              How will the customer pay?
            </Typography>
            <Stack
              spacing={2}
              direction={{ xs: 'column', sm: 'row' }}
              sx={{ mb: 4 }}
            >
              <Card
                sx={{
                  p: 2,
                  flex: 1,
                  cursor: 'pointer',
                  border: 2,
                  borderColor:
                    paymentMethod === 'stripe' ? 'primary.main' : 'transparent',
                  bgcolor:
                    paymentMethod === 'stripe'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => handlePaymentMethodChange('stripe')}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CreditCardIcon
                    sx={{
                      fontSize: 40,
                      color:
                        paymentMethod === 'stripe'
                          ? 'primary.main'
                          : 'text.secondary',
                    }}
                  />
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    Card
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Secure payment
                  </Typography>
                </Box>
              </Card>

              <Card
                sx={{
                  p: 2,
                  flex: 1,
                  cursor: 'pointer',
                  border: 2,
                  borderColor:
                    paymentMethod === 'cash' ? 'primary.main' : 'transparent',
                  bgcolor:
                    paymentMethod === 'cash'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => handlePaymentMethodChange('cash')}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CashIcon
                    sx={{
                      fontSize: 40,
                      color:
                        paymentMethod === 'cash'
                          ? 'primary.main'
                          : 'text.secondary',
                    }}
                  />
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    Cash
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In person
                  </Typography>
                </Box>
              </Card>

              <Card
                sx={{
                  p: 2,
                  flex: 1,
                  cursor: 'pointer',
                  border: 2,
                  borderColor:
                    paymentMethod === 'external_pos'
                      ? 'primary.main'
                      : 'transparent',
                  bgcolor:
                    paymentMethod === 'external_pos'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => handlePaymentMethodChange('external_pos')}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <POSIcon
                    sx={{
                      fontSize: 40,
                      color:
                        paymentMethod === 'external_pos'
                          ? 'primary.main'
                          : 'text.secondary',
                    }}
                  />
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    POS
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    External system
                  </Typography>
                </Box>
              </Card>
            </Stack>

            {/* Amount Selection - Always visible when payment method is selected */}
            {paymentMethod && (
              <>
                <AmountSelectionSection
                  totalAmount={totalAmount}
                  paymentAmount={paymentAmount}
                  customAmount={customAmount}
                  onAmountChange={handleAmountChange}
                  onCustomAmountChange={handleCustomAmountChange}
                />

                {/* Method-specific fields */}
                {paymentMethod === 'external_pos' && (
                  <TextField
                    label="POS Reference Number"
                    value={externalReference}
                    onChange={(e) =>
                      handleExternalReferenceChange(e.target.value)
                    }
                    fullWidth
                    required
                    helperText="Enter the transaction reference from your POS system"
                    sx={{
                      mt: 2,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  />
                )}

                {/* Payment method alerts */}
                {paymentMethod === 'cash' && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Please collect cash payment from the customer before
                    proceeding.
                  </Alert>
                )}

                {paymentMethod === 'stripe' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    A secure payment form will be shown to collect card details.
                  </Alert>
                )}
              </>
            )}
          </Box>
        )}

        {/* Invoice Details (for send later) */}
        {collectNow === false && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Invoice Details
            </Typography>

            <Stack spacing={2}>
              <DatePicker
                label="Payment Due Date"
                value={dueDate}
                onChange={(newValue) => {
                  setDueDate(newValue);
                  onPaymentIntentChange({
                    collectNow: false,
                    dueDate: newValue?.toDate() || undefined,
                    notes: invoiceNotes,
                  });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <TextField
                label="Invoice Notes (Optional)"
                value={invoiceNotes}
                onChange={(e) => {
                  setInvoiceNotes(e.target.value);
                  onPaymentIntentChange({
                    collectNow: false,
                    dueDate: dueDate?.toDate() || undefined,
                    notes: e.target.value,
                  });
                }}
                multiline
                rows={3}
                fullWidth
                placeholder="Any special instructions or payment terms"
              />

              <Alert severity="info" icon={<SendIcon />}>
                An invoice will be sent to {clientEmail || 'the customer'} with
                a secure payment link.
              </Alert>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
