import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { db, type Season } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

const Seasons: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const seasons = useLiveQuery(async () => {
    try {
      await db.open();
      return await db.seasons.toArray();
    } catch (err) {
      console.error("Failed to fetch seasons:", err);
      return [];
    }
  }) || [];

  const handleAddSeason = async () => {
    const newSeason: Season = {
      name,
      startDate,
      endDate,
      synced: 0
    };
    try {
      await db.open();
      await db.seasons.add(newSeason);
      setOpen(false);
      setName('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error("Failed to add season:", err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Seasons</Typography>
      <Paper className="moleskine-card">
        <List>
          {seasons.length === 0 && <Typography>No seasons created yet.</Typography>}
          {seasons.map((season) => (
            <ListItem key={season.id} divider>
              <ListItemText
                primary={season.name}
                secondary={`${season.startDate} to ${season.endDate}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Season</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Season Name"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSeason} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Seasons;
