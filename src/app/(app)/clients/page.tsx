import {
  Container,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  InputAdornment,
  Fab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'next/link';

export default function ClientsPage() {
  // Mock data for demonstration
  const clients = [
    {
      id: 1,
      name: 'Jane Smith',
      phone: '(555) 123-4567',
      lastOrder: '2 days ago',
    },
    {
      id: 2,
      name: 'John Doe',
      phone: '(555) 234-5678',
      lastOrder: '1 week ago',
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      phone: '(555) 345-6789',
      lastOrder: '2 weeks ago',
    },
    {
      id: 4,
      name: 'Mike Wilson',
      phone: '(555) 456-7890',
      lastOrder: '1 month ago',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Clients
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search clients..."
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Clients List */}
        <List>
          {clients.map((client) => (
            <ListItem
              key={client.id}
              component={Link}
              href={`/clients/${client.id}`}
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              secondaryAction={
                <IconButton edge="end">
                  <ChevronRightIcon />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={client.name}
                secondary={`${client.phone} • Last order: ${client.lastOrder}`}
              />
            </ListItem>
          ))}
        </List>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add client"
          component={Link}
          href="/clients/new"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Container>
  );
}
