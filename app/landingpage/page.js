'use client';

import { useRouter } from 'next/navigation';
import { Box, Button, Container, Typography, AppBar, Toolbar, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // Black
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e5e7eb', // Light grey
    },
    background: {
      default: '#000000', // Black background
    },
    text: {
      primary: '#ffffff', // White text
      secondary: '#e5e7eb', // Light grey text
    },
  },
});

const LandingPage = () => {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/signin');
  };

return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static" color="primary">
            <Toolbar>
                <Typography 
                variant="h6" 
                color="inherit"
                sx={{
                    flexGrow: 1, 
                    fontFamily: 'cursive'}}
                >
                    Inventory Buddy
                </Typography>
            </Toolbar>
        </AppBar>
        <Container maxWidth="md">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="80vh"
                textAlign="center"
            >
                <Typography Typography variant="h3" component="h1" gutterBottom sx={{fontFamily: 'Raleway, cursive'}}>
                    Welcome to Inventory Buddy
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom sx={{fontWeight: 'bold'}}>
                Your ultimate inventory management tool.
            </Typography>
            <Typography variant="body1" paragraph>
            Keep track of your items, minimize waste, and always know what you have in stock. Inventory Buddy helps you manage your inventory efficiently, ensuring you never run out of essential items. 
            With our tool, you can organize your inventory. Simplify your life and start managing your inventory like a pro.
            </Typography>
            <Button variant="contained" color="secondary" onClick={handleSignIn} sx={{ mt: 4 }}>
            Sign In
            </Button>
        </Box>
        </Container>
    </ThemeProvider>
    );
};

export default LandingPage;