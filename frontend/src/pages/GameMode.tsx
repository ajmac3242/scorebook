import React, { useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import BasketballCourt from '../components/BasketballCourt';
import { db, type StatEvent } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

const GameMode: React.FC = () => {
  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [statType, setStatType] = useState<string>('MAKE');
  const [points, setPoints] = useState<number>(2);

  const players = useLiveQuery(() => db.players.toArray()) || [];

  const handleCourtClick = (x: number, y: number) => {
    setSelectedX(x);
    setSelectedY(y);
    setDialogOpen(true);
  };

  const handleSaveStat = async () => {
    if (!selectedPlayerId) return;

    const gameId = new URLSearchParams(window.location.search).get('gameId') || 'practice-session';

    const newStat: StatEvent = {
      gameId: gameId,
      playerId: selectedPlayerId,
      type: statType,
      points: statType === 'MAKE' ? points : 0,
      locationX: selectedX!,
      locationY: selectedY!,
      timestamp: new Date().toISOString(),
      synced: 0
    };

    await db.stats.add(newStat);
    setDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Shot Chart</Typography>
            <BasketballCourt onCoordClick={handleCourtClick} />
          </Paper>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Current Lineup</Typography>
            <List>
              {players.map(p => (
                <ListItem key={p.id}>
                  <ListItemText primary={p.name} secondary={`#${p.defaultNumber}`} />
                  <Button variant="outlined" onClick={() => setSelectedPlayerId(p.id?.toString() || '')}>
                    Select
                  </Button>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Record Stat</DialogTitle>
        <DialogContent>
          <Typography>Location: {selectedX?.toFixed(1)}, {selectedY?.toFixed(1)}</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Player</Typography>
            <ToggleButtonGroup
              value={selectedPlayerId}
              exclusive
              onChange={(_, val) => setSelectedPlayerId(val as string)}
              fullWidth
            >
              {players.map(p => (
                <ToggleButton key={p.id} value={p.id?.toString() || ''}>
                  {p.name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Action</Typography>
            <ToggleButtonGroup
              value={statType}
              exclusive
              onChange={(_, val) => setStatType(val as string)}
              fullWidth
            >
              <ToggleButton value="MAKE">Make</ToggleButton>
              <ToggleButton value="MISS">Miss</ToggleButton>
              <ToggleButton value="STEAL">Steal</ToggleButton>
              <ToggleButton value="REBOUND">Rebound</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {statType === 'MAKE' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Points</Typography>
              <ToggleButtonGroup
                value={points}
                exclusive
                onChange={(_, val) => setPoints(val as number)}
                fullWidth
              >
                <ToggleButton value={1}>1 (FT)</ToggleButton>
                <ToggleButton value={2}>2</ToggleButton>
                <ToggleButton value={3}>3</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveStat} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameMode;
