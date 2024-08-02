'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, getDoc, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { firestore, auth, storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import withAuth from '../protectedRoute';
import { Container, Typography, Box, Button, Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField, createTheme, ThemeProvider, Menu, MenuItem, Snackbar, CircularProgress } from '@mui/material';
import { AddShoppingCart, Edit, Delete, Logout, AccountCircle, CameraAlt, FileUpload } from '@mui/icons-material';
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

const HeaderContent = styled(Box)(({ theme }) => ({
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
  const [imageURL, setImageURL] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userUid, setUserUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);
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
    setLoading(true);
    try {
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
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    setLoading(true);
    try {
      if (userUid) {
        await deleteDoc(doc(firestore, `pantry-items-${userUid}`, id));
        await updatePantry();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity);
  };

  const editItem = async (id, name, quantity) => {
    setLoading(true);
    try {
      if (userUid) {
        const docRef = doc(firestore, `pantry-items-${userUid}`, id);
        await setDoc(docRef, { name, quantity: Number(quantity) || 1 }, { merge: true });
        await updatePantry();
        setEditingItem(null);
        setNewItemName('');
        setNewItemQuantity('');
      }
    } catch (error) {
      console.error("Error editing item:", error);
    } finally {
      setLoading(false);
    }
  };

  const captureImage = () => {
    setCapturing(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch((err) => console.error("Error accessing camera:", err));
  };

  const takePhoto = async () => {
    setCapturing(false);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
    const imageFile = new File([imageBlob], 'photo.jpg', { type: 'image/jpeg' });

    setUploading(true);
    try {
      const storageRef = ref(storage, `images/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      setImageURL(downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadingImage(true);
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      uploadBytes(storageRef, file)
        .then(() => getDownloadURL(storageRef))
        .then((url) => {
          setImageURL(url);
          setUploadingImage(false);
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
          setUploadingImage(false);
        });
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Filtered items based on search query
  const filteredItems = pantryItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <ThemeProvider theme={theme}>
      <Box>
      <Header>
        <HeaderContent>
          <HeaderText variant="h6">Welcome to Your Inventory</HeaderText>
          <Box display="flex" alignItems="center">
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem>
                <Typography variant="body2">{userEmail}</Typography>
              </MenuItem>
              <MenuItem onClick={handleSignOut}>
                <Logout fontSize="small" />
                <Typography variant="body2">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </HeaderContent>
      </Header>

        <Container maxWidth="md" sx={{ marginY: 4 }}>
          <Card>
            <CardHeader title="Manage Your Inventory" />
            <CardContent>
              <Box component="form" sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                <TextField
                  label="Item Name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Quantity"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  type="number"
                  fullWidth
                />
                <Button variant="contained" color="primary" onClick={() => addItem(newItemName, newItemQuantity, imageURL)}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Add Item'}
                </Button>
              </Box>

              <TextField
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                sx={{ marginBottom: 2 }}
              />

              <TableContainer>
                <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pantryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: 'auto' }} />}
                      </TableCell>
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

          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => fileInputRef.current.click()}
              startIcon={<FileUpload />}
            >
              Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={captureImage}
              startIcon={<CameraAlt />}
              sx={{ marginLeft: 2 }}
            >
              Capture Image
            </Button>
          </Box>

          {capturing && (
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
              <video ref={videoRef} width="320" height="240" />
              <Button variant="contained" color="primary" onClick={takePhoto}>
                Take Photo
              </Button>
            </Box>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Container>

        <Footer>
          <Typography variant="body2">&copy; {new Date().getFullYear()} Inventory Buddy. All rights reserved.</Typography>
        </Footer>

        <Snackbar
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
          message="Item added successfully"
          autoHideDuration={3000}
        />
      </Box>
    </ThemeProvider>
  );
};

export default withAuth(Page);