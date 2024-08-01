'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, getDoc, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { firestore, auth } from '@/firebase';
import withAuth from '../protectedRoute';
import { Container, Typography, Box, Button, Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField, createTheme, ThemeProvider, Menu, MenuItem, Snackbar, CircularProgress } from '@mui/material';
import { AddShoppingCart, Edit, Delete, Logout, AccountCircle } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: 'none',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  borderRadius: 2,
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e5e7eb',
    },
    error: {
      main: '#dc2626',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          transition: 'background-color 0.3s, color 0.3s',
          '&:hover': {
            backgroundColor: '#333333',
            color: '#ffffff',
          },
          '&:active': {
            backgroundColor: '#555555',
            color: '#ffffff',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
        },
      },
    },
  },
});

const Header = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  position: 'relative',
  width: '100%',
  padding: 10,
}));

const HeaderContent = styled(Container)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 0,
  margin: 0,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}));

const HeaderText = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  fontSize: '1rem',
  fontFamily: 'cursive',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.875rem',
  },
}));

const Footer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  textAlign: 'center',
  position: 'fixed',
  bottom: 0,
  width: '100%',
}));

const Page = () => {
  const [pantryItems, setPantryItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userUid, setUserUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserUid(user.uid);
      } else {
        setUserEmail('');
        setUserUid('');
      }
    });

    return () => unsubscribe();
  }, []);

  const updatePantry = async () => {
    if (userUid) {
      const snapshot = collection(firestore, `pantry-items-${userUid}`);
      const docs = await getDocs(snapshot);
      const pantryList = [];
      docs.forEach((doc) => {
        pantryList.push({ id: doc.id, ...doc.data() });
      });
      setPantryItems(pantryList);
    }
  };

  useEffect(() => {
    if (userUid) {
      updatePantry();
    }
  }, [userUid]);

  const addItem = async (name, quantity, imageUrl = null) => {
    if (userUid) {
      const docRef = doc(firestore, `pantry-items-${userUid}`, name);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity: existingQuantity } = docSnap.data();
        await setDoc(docRef, { quantity: existingQuantity + Number(quantity), imageUrl }, { merge: true });
      } else {
        await setDoc(docRef, { name, quantity: Number(quantity) || 1, imageUrl });
      }
      await updatePantry();
      setNewItemName('');
      setNewItemQuantity('');
      setSnackbarOpen(true);
    }
  };

  const deleteItem = async (id) => {
    if (userUid) {
      await deleteDoc(doc(firestore, `pantry-items-${userUid}`, id));
      await updatePantry();
    }
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity);
  };

  const editItem = async (id, name, quantity) => {
    if (userUid) {
      const docRef = doc(firestore, `pantry-items-${userUid}`, id);
      await setDoc(docRef, { name, quantity: Number(quantity) || 1 }, { merge: true });
      await updatePantry();
      setEditingItem(null);
      setNewItemName('');
      setNewItemQuantity('');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <Header>
        <HeaderContent maxWidth="2000">
          <a href="/" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
            <AddShoppingCart fontSize="medium" />
            <HeaderText variant="h6" component="span">Inventory Buddy</HeaderText>
          </a>
          <IconButton
            onClick={handleMenuOpen}
            sx={{ marginLeft: 'auto' }}
            color="inherit"
          >
            <AccountCircle fontSize="large" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem>
              <Typography variant="body2">{userEmail}</Typography>
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <Logout fontSize="small" />
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>
        </HeaderContent>
      </Header>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography
            variant="h4"
            gutterBottom
            sx={{
            textAlign: 'center',       // Centers the text
            fontWeight: 'bold',        // Makes the text bold
            fontFamily: 'Raleway, cursive', // Apply a fancy font family
            }}
        >
            Inventory List
        </Typography>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <TextField
            label="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            sx={{ marginRight: 2 }}
          />
          <TextField
            label="Quantity"
            type="number"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
            sx={{ marginRight: 2 }}
          />
          <Button variant="contained" onClick={() => (editingItem ? editItem(editingItem.id, newItemName, newItemQuantity) : addItem(newItemName, newItemQuantity))}>
            {editingItem ? 'Edit Item' : 'Add Item'}
          </Button>
        </Box>
        <Card sx={{ mb: 2 }}>
          <CardHeader title="Pantry Items" />
          <CardContent>
            <TableContainer sx={{ maxHeight: 350, overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pantryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => startEditing(item)}>
                          <Edit color="primary" />
                        </IconButton>
                        <IconButton onClick={() => deleteItem(item.id)}>
                          <Delete color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
      
      {loading && <CircularProgress />}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Action completed"
      />
    </ThemeProvider>
  );
};

export default withAuth(Page);