'use client';

import {
  Box,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import type { Tables } from '@/types/supabase';
import { searchClients } from '@/lib/actions/clients';
import { useDebounce } from '@/hooks/useDebounce';

type Client = Tables<'clients'>;

interface ClientSelectionSplitViewProps {
  onClientSelect: (client: Client) => void;
  onCreateNew: () => void;
}

export const ClientSelectionSplitView = ({
  onClientSelect,
  onCreateNew,
}: ClientSelectionSplitViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Search when query changes
  useEffect(() => {
    if (debouncedSearch) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchClients(debouncedSearch);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClientClick = (client: Client) => {
    // Immediately select the client and advance
    onClientSelect(client);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center">
        Select Client
      </Typography>

      <Paper sx={{ mb: 3 }}>
        {/* Search Field */}
        <Box p={2}>
          <TextField
            fullWidth
            placeholder="Search clients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: isSearching && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
            autoFocus
          />
        </Box>

        <Divider />

        {/* Client List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          <List>
            {searchQuery ? (
              // Search Results
              <>
                {searchResults.length > 0
                  ? searchResults.map((client) => (
                      <ListItemButton
                        key={client.id}
                        onClick={() => handleClientClick(client)}
                        sx={{
                          py: 2,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={`${client.first_name} ${client.last_name}`}
                          secondary={
                            <>
                              {client.email}
                              {client.phone_number &&
                                ` • ${client.phone_number}`}
                            </>
                          }
                        />
                      </ListItemButton>
                    ))
                  : !isSearching && (
                      <Box p={3} textAlign="center">
                        <Typography color="text.secondary">
                          No clients found
                        </Typography>
                      </Box>
                    )}
              </>
            ) : (
              // Empty state - prompt to search
              <Box p={3} textAlign="center">
                <Typography color="text.secondary" gutterBottom>
                  Search for a client to get started
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type in the search box above to find existing clients
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </Paper>

      {/* Add New Client Button */}
      <Box display="flex" justifyContent="center">
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={onCreateNew}
          size="large"
        >
          Add New Client
        </Button>
      </Box>
    </Box>
  );
};
