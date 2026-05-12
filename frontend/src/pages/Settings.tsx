import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import PaletteIcon from '@mui/icons-material/Palette';
import { useAppTheme, ThemePreset } from '../theme/ThemeContext';

interface PresetCardProps {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, selected, onSelect }) => (
  <Card
    variant="outlined"
    sx={{
      borderColor: selected ? 'primary.main' : 'divider',
      borderWidth: selected ? 2 : 1,
      borderRadius: 2,
      transition: 'border-color 0.2s',
    }}
  >
    <CardActionArea onClick={onSelect} sx={{ p: 0 }}>
      <Box
        sx={{
          height: 56,
          bgcolor: preset.previewColor,
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <CheckIcon
            sx={{
              color: '#fff',
              bgcolor: 'rgba(0,0,0,0.35)',
              borderRadius: '50%',
              p: 0.4,
              fontSize: 28,
            }}
          />
        )}
      </Box>
      <CardContent sx={{ py: 1, px: 1.5 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {preset.label}
        </Typography>
        <Chip
          label={preset.mode}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.6rem', height: 18, mt: 0.5 }}
        />
      </CardContent>
    </CardActionArea>
  </Card>
);

const Settings: React.FC = () => {
  const { presetId, setPresetId, availablePresets } = useAppTheme();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PaletteIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Appearance
        </Typography>
      </Box>

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        THEME
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose a colour theme for CourtSight. Your selection is saved automatically.
      </Typography>

      <Grid container spacing={2}>
        {availablePresets.map((preset) => (
          <Grid item xs={6} sm={4} md={3} key={preset.id}>
            <Tooltip title={preset.label} arrow>
              <span>
                <PresetCard
                  preset={preset}
                  selected={preset.id === presetId}
                  onSelect={() => setPresetId(preset.id)}
                />
              </span>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Settings;
