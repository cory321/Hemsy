'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { ClientSearchField } from '@/components/appointments/ClientSearchField';
import type { Tables } from '@/types/supabase';
import ClientCreateDialog from '@/components/clients/ClientCreateDialog';
import { assignDefaultGarmentNames } from '@/lib/utils/order-normalization';
import { format as formatDate } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

type ClientLite = { id: string; name: string };
type ServiceLite = {
  id: string;
  name: string;
  default_unit: 'item' | 'hour' | 'day' | 'week';
  default_qty: number;
  default_unit_price_cents: number;
};

type ServiceLineDraft = {
  quantity: number;
  unit: 'item' | 'hour' | 'day' | 'week';
  unitPriceCents: number;
  serviceId?: string;
  inline?: {
    name: string;
    description?: string;
    unit: 'item' | 'hour' | 'day' | 'week';
    unitPriceCents: number;
  };
};

type GarmentDraft = {
  name: string;
  notes?: string;
  dueDate?: string | null;
  specialEvent?: boolean;
  eventDate?: string | null;
  services: ServiceLineDraft[];
};

export default function OrdersComposerClient({
  frequentlyUsed,
  onSubmit,
}: {
  frequentlyUsed: ServiceLite[];
  onSubmit: (formData: FormData) => Promise<any>;
}) {
  const router = useRouter();
  const payloadRef = useRef<HTMLInputElement>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClient, setSelectedClient] =
    useState<Tables<'clients'> | null>(null);
  const [discountCents, setDiscountCents] = useState<number>(0);
  const [garments, setGarments] = useState<GarmentDraft[]>([]);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!selectedClientId) return false;
    if (garments.length === 0) return false;
    return garments.every((g) => g.services.length > 0);
  }, [selectedClientId, garments]);

  function addGarment() {
    setGarments((prev) => [
      ...prev,
      {
        name: '',
        notes: '',
        dueDate: formatDate(new Date(), 'yyyy-MM-dd'),
        specialEvent: false,
        eventDate: null,
        services: [],
      },
    ]);
  }

  function removeGarment(index: number) {
    setGarments((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGarment(index: number, patch: Partial<GarmentDraft>) {
    setGarments((prev) =>
      prev.map((g, i) => (i === index ? { ...g, ...patch } : g))
    );
  }

  function addServiceFromPreset(garmentIdx: number, svc: ServiceLite) {
    const newLine: ServiceLineDraft = {
      quantity: svc.default_qty || 1,
      unit: svc.default_unit,
      unitPriceCents: svc.default_unit_price_cents || 0,
      serviceId: svc.id,
    };
    setGarments((prev) =>
      prev.map((g, i) =>
        i === garmentIdx ? { ...g, services: [...g.services, newLine] } : g
      )
    );
  }

  function removeServiceLine(garmentIdx: number, lineIdx: number) {
    setGarments((prev) =>
      prev.map((g, i) =>
        i === garmentIdx
          ? { ...g, services: g.services.filter((_, li) => li !== lineIdx) }
          : g
      )
    );
  }

  async function handleServiceSearch(
    garmentIdx: number,
    query: string,
    setSearchResults: (items: ServiceLite[]) => void
  ) {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(
      `/api/services/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return;
    const data = (await res.json()) as ServiceLite[];
    setSearchResults(data);
  }

  async function handleQuickAdd(
    garmentIdx: number,
    name: string,
    priceCents: number,
    unit: 'item' | 'hour' | 'day' | 'week',
    persistToCatalog: boolean
  ) {
    if (persistToCatalog) {
      const res = await fetch('/api/services/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          defaultUnit: unit,
          defaultQty: 1,
          defaultUnitPriceCents: priceCents,
        }),
      });
      if (res.ok) {
        const svc = (await res.json()) as ServiceLite;
        addServiceFromPreset(garmentIdx, svc);
        return;
      }
    }
    // Inline line if not persisted
    const newLine: ServiceLineDraft = {
      quantity: 1,
      unit,
      unitPriceCents: priceCents,
      inline: { name, unit, unitPriceCents: priceCents },
    };
    setGarments((prev) =>
      prev.map((g, i) =>
        i === garmentIdx ? { ...g, services: [...g.services, newLine] } : g
      )
    );
  }

  function buildPayload() {
    const garmentsNormalized = assignDefaultGarmentNames(garments);
    return {
      clientId: selectedClientId,
      discountCents,
      garments: garmentsNormalized.map((g) => ({
        name: g.name,
        notes: g.notes || undefined,
        dueDate: g.dueDate || undefined,
        specialEvent: !!g.specialEvent,
        eventDate: g.specialEvent ? g.eventDate || undefined : undefined,
        services: g.services.map((s) => ({
          quantity: s.quantity,
          unit: s.unit,
          unitPriceCents: s.unitPriceCents,
          ...(s.serviceId ? { serviceId: s.serviceId } : { inline: s.inline }),
        })),
      })),
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      console.log('Built payload:', payload);
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));

      const result = await onSubmit(formData);
      console.log('Order submission result:', result);

      if (result?.success && result?.orderId) {
        router.push(`/orders/${result.orderId}`);
      } else if (result?.errors) {
        // TODO: Handle errors - show them in the UI
        console.error('Order creation failed:', result.errors);
      } else {
        console.error('Unexpected result format:', result);
      }
    } catch (error) {
      console.error('Order submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="payload" type="hidden" ref={payloadRef} />
      <Stack spacing={3} sx={{ mt: 2 }}>
        {/* Client Picker */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Client
            </Typography>
            <ClientSearchField
              value={selectedClient}
              onChange={(client) => {
                setSelectedClient(client);
                setSelectedClientId(client?.id || '');
              }}
            />
            <Box sx={{ mt: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setCreateClientOpen(true)}
              >
                Dont see the client? Create a new client
              </Button>
            </Box>
          </CardContent>
        </Card>

        <ClientCreateDialog
          open={createClientOpen}
          onClose={() => setCreateClientOpen(false)}
          onCreated={(client) => {
            setSelectedClient(client);
            setSelectedClientId(client.id);
          }}
        />

        {/* Garments */}
        <Stack spacing={2}>
          {garments.map((g, gi) => (
            <Card key={gi} variant="outlined">
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6">Garment {gi + 1}</Typography>
                  <IconButton
                    aria-label="remove"
                    onClick={() => removeGarment(gi)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Garment name"
                      value={g.name}
                      onChange={(e) =>
                        updateGarment(gi, { name: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Due date"
                        value={g.dueDate ? dayjs(g.dueDate) : null}
                        format="dddd, MMMM D, YYYY"
                        onChange={(newValue) => {
                          if (!newValue) {
                            updateGarment(gi, { dueDate: null });
                            return;
                          }
                          const asDate = dayjs.isDayjs(newValue)
                            ? newValue.toDate()
                            : new Date(newValue as any);
                          updateGarment(gi, {
                            dueDate: formatDate(asDate, 'yyyy-MM-dd'),
                          });
                        }}
                        minDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            onClick: (e: any) => {
                              // Find and click the calendar button to open picker
                              const button =
                                e.currentTarget.querySelector('button');
                              if (button) button.click();
                            },
                            InputProps: {
                              readOnly: true,
                            },
                            inputProps: {
                              style: {
                                cursor: 'pointer',
                                caretColor: 'transparent',
                              },
                              onKeyDown: (e: any) => {
                                e.preventDefault();
                                e.stopPropagation();
                              },
                              onPaste: (e: any) => e.preventDefault(),
                              onCut: (e: any) => e.preventDefault(),
                              onDrop: (e: any) => e.preventDefault(),
                              onMouseDown: (e: any) => e.preventDefault(),
                              onSelect: (e: any) => {
                                if (
                                  e.target.selectionStart !==
                                  e.target.selectionEnd
                                ) {
                                  e.target.setSelectionRange(0, 0);
                                }
                              },
                            },
                            sx: {
                              '& input': {
                                cursor: 'pointer',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                MozUserSelect: 'none',
                                msUserSelect: 'none',
                                pointerEvents: 'none',
                              },
                              '& .MuiInputBase-root': {
                                cursor: 'pointer',
                              },
                              '& fieldset': { cursor: 'pointer' },
                              '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                pointerEvents: 'auto',
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Special event date (optional)"
                        value={g.eventDate ? dayjs(g.eventDate) : null}
                        format="dddd, MMMM D, YYYY"
                        onChange={(newValue) => {
                          if (!newValue) {
                            updateGarment(gi, {
                              eventDate: null,
                              specialEvent: false,
                            });
                            return;
                          }
                          const asDate = dayjs.isDayjs(newValue)
                            ? newValue.toDate()
                            : new Date(newValue as any);
                          updateGarment(gi, {
                            eventDate: formatDate(asDate, 'yyyy-MM-dd'),
                            specialEvent: true,
                          });
                        }}
                        minDate={g.dueDate ? dayjs(g.dueDate) : dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            onClick: (e: any) => {
                              // Find and click the calendar button to open picker
                              const button =
                                e.currentTarget.querySelector('button');
                              if (button) button.click();
                            },
                            InputProps: {
                              readOnly: true,
                            },
                            inputProps: {
                              style: {
                                cursor: 'pointer',
                                caretColor: 'transparent',
                              },
                              onKeyDown: (e: any) => {
                                e.preventDefault();
                                e.stopPropagation();
                              },
                              onPaste: (e: any) => e.preventDefault(),
                              onCut: (e: any) => e.preventDefault(),
                              onDrop: (e: any) => e.preventDefault(),
                              onMouseDown: (e: any) => e.preventDefault(),
                              onSelect: (e: any) => {
                                if (
                                  e.target.selectionStart !==
                                  e.target.selectionEnd
                                ) {
                                  e.target.setSelectionRange(0, 0);
                                }
                              },
                            },
                            sx: {
                              '& input': {
                                cursor: 'pointer',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                MozUserSelect: 'none',
                                msUserSelect: 'none',
                                pointerEvents: 'none',
                              },
                              '& .MuiInputBase-root': {
                                cursor: 'pointer',
                              },
                              '& fieldset': { cursor: 'pointer' },
                              '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                pointerEvents: 'auto',
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      multiline
                      minRows={2}
                      value={g.notes || ''}
                      onChange={(e) =>
                        updateGarment(gi, { notes: e.target.value })
                      }
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Services
                </Typography>

                {/* Speed dial (as chips) */}
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {frequentlyUsed.map((svc) => (
                    <Chip
                      key={svc.id}
                      label={svc.name}
                      onClick={() => addServiceFromPreset(gi, svc)}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>

                {/* Search */}
                <ServiceSearchRow
                  onSearch={(q, set) => handleServiceSearch(gi, q, set)}
                  onPick={(svc) => addServiceFromPreset(gi, svc)}
                />

                {/* Quick add */}
                <QuickAddRow
                  onQuickAdd={(name, price, unit, persist) =>
                    handleQuickAdd(gi, name, price, unit, persist)
                  }
                />

                {/* Lines */}
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {g.services.map((s, si) => (
                    <Grid key={si} container spacing={1} alignItems="center">
                      <Grid item xs={5}>
                        <Typography>
                          {s.inline?.name ||
                            frequentlyUsed.find((fu) => fu.id === s.serviceId)
                              ?.name ||
                            'Service'}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <TextField
                          type="number"
                          size="small"
                          label="Qty"
                          value={s.quantity}
                          onChange={(e) => {
                            const qty = Math.max(
                              1,
                              Number(e.target.value || 1)
                            );
                            setGarments((prev) =>
                              prev.map((gg, gidx) =>
                                gidx === gi
                                  ? {
                                      ...gg,
                                      services: gg.services.map((ll, lidx) =>
                                        lidx === si
                                          ? { ...ll, quantity: qty }
                                          : ll
                                      ),
                                    }
                                  : gg
                              )
                            );
                          }}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          type="number"
                          size="small"
                          label="Unit Price (¢)"
                          value={s.unitPriceCents}
                          onChange={(e) => {
                            const cents = Math.max(
                              0,
                              Number(e.target.value || 0)
                            );
                            setGarments((prev) =>
                              prev.map((gg, gidx) =>
                                gidx === gi
                                  ? {
                                      ...gg,
                                      services: gg.services.map((ll, lidx) =>
                                        lidx === si
                                          ? { ...ll, unitPriceCents: cents }
                                          : ll
                                      ),
                                    }
                                  : gg
                              )
                            );
                          }}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <IconButton
                          aria-label="remove"
                          onClick={() => removeServiceLine(gi, si)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addGarment}
          >
            Add Garment
          </Button>
        </Stack>

        {/* Discount and Submit */}
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Discount (¢)"
                  value={discountCents}
                  onChange={(e) =>
                    setDiscountCents(Math.max(0, Number(e.target.value || 0)))
                  }
                />
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'stretch', md: 'flex-end' },
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Order'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </form>
  );
}

function ServiceSearchRow({
  onSearch,
  onPick,
}: {
  onSearch: (query: string, set: (items: ServiceLite[]) => void) => void;
  onPick: (svc: ServiceLite) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ServiceLite[]>([]);

  return (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Search services"
        value={query}
        onChange={async (e) => {
          const q = e.target.value;
          setQuery(q);
          await onSearch(q, setResults);
        }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
        {results.map((svc) => (
          <Chip key={svc.id} label={svc.name} onClick={() => onPick(svc)} />
        ))}
      </Stack>
    </Box>
  );
}

function QuickAddRow({
  onQuickAdd,
}: {
  onQuickAdd: (
    name: string,
    priceCents: number,
    unit: 'item' | 'hour' | 'day' | 'week',
    persistToCatalog: boolean
  ) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [unit, setUnit] = useState<'item' | 'hour' | 'day' | 'week'>('item');
  const [persist, setPersist] = useState<boolean>(true);

  return (
    <Grid container spacing={1} alignItems="center" sx={{ mt: 2 }}>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Quick add service name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Grid>
      <Grid item xs={6} md={2}>
        <TextField
          fullWidth
          type="number"
          label="Price (¢)"
          value={price}
          onChange={(e) => setPrice(Math.max(0, Number(e.target.value || 0)))}
        />
      </Grid>
      <Grid item xs={6} md={2}>
        <Select
          fullWidth
          value={unit}
          onChange={(e) => setUnit(e.target.value as any)}
        >
          <MenuItem value="item">item</MenuItem>
          <MenuItem value="hour">hour</MenuItem>
          <MenuItem value="day">day</MenuItem>
          <MenuItem value="week">week</MenuItem>
        </Select>
      </Grid>
      <Grid item xs={12} md={2}>
        <Button
          variant="outlined"
          onClick={async () => {
            if (!name.trim()) return;
            await onQuickAdd(name.trim(), price, unit, persist);
            setName('');
            setPrice(0);
          }}
          startIcon={<AddIcon />}
        >
          Quick Add
        </Button>
      </Grid>
      <Grid item xs={12} md={2}>
        <Chip
          label={persist ? 'Persist to catalog' : "Don't add to catalog"}
          color={persist ? 'primary' : 'default'}
          onClick={() => setPersist((p) => !p)}
        />
      </Grid>
    </Grid>
  );
}
