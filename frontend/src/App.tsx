import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Container, Button, Box } from '@mui/material';
import theme from './theme';
import GameMode from './pages/GameMode';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Basketball Stats
            </Typography>
            <Button color="inherit" component={Link} to="/">Dashboard</Button>
            <Button color="inherit" component={Link} to="/game">New Game</Button>
          </Toolbar>
        </AppBar>
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/game" element={<GameMode />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
};

const Dashboard = () => (
  <Box>
    <Typography variant="h4">Dashboard</Typography>
    <Typography>Welcome Coach! Select a game to start tracking.</Typography>
  </Box>
);

export default App;
