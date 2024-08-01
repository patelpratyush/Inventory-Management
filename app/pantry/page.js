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
  const [imageURL, setImageURL] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userUid, setUserUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null); // Reference to the media stream
  const fileInputRef = useRef(null); // Reference to the file input
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
        mediaStreamRef.current = stream; // Save the stream reference
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
      console.log('Image available at:', downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
      stopCamera(); // Stop the camera after capturing the photo
    }
  };

  const uploadImage = async (event) => {
    setUploadingImage(true);
    const file = event.target.files[0];
    if (file) {
      try {
        const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setImageURL(downloadURL);
        console.log('Image available at:', downloadURL);
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
    }
    mediaStreamRef.current = null; // Clear the reference
    if (videoRef.current) {
      videoRef.current.srcObject = null; // Stop video playback
    }
  };
  
  const handleCancel = () => {
    stopCamera(); // Stop the camera
    setCapturing(false); // Hide the camera interface
  };
  

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddOrEditItem = () => {
    if (editingItem) {
      editItem(editingItem.id, newItemName, newItemQuantity);
    } else {
      addItem(newItemName, newItemQuantity, imageURL);
    }
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
            textAlign: 'center',
            fontWeight: 'bold',
            fontFamily: 'Raleway, cursive',
            }}
        >
            Inventory List
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <TextField
            label="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Quantity"
            type="number"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              onClick={captureImage}
              disabled={loading || uploading || capturing || uploadingImage}
              startIcon={<CameraAlt />}
            >
              Capture Image
            </Button>
            <Button
              variant="contained"
              onClick={() => fileInputRef.current.click()}
              disabled={loading || uploading || capturing || uploadingImage}
              startIcon={<FileUpload />}
            >
              Upload Image
            </Button>
            <Button
              variant="contained"
              onClick={handleAddOrEditItem}
              disabled={loading || uploading || uploadingImage}
            >
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Button>
          </Box>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={uploadImage}
          />
        </Box>

        {capturing && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video ref={videoRef} style={{ width: '100%', maxWidth: '600px', borderRadius: '8px' }}></video>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={takePhoto}
                sx={{ flex: 1 }}
                disabled={uploading}
              >
                Take Photo
              </Button>
              <Button
                variant="contained"
                onClick={handleCancel} // Use handleCancel here
                sx={{ flex: 1, backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }}
              >
                Cancel
              </Button>
            </Box>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          </Box>
        )}
        <Card sx={{ mb: 2 }}>
          <CardHeader title="Items" />
          <CardContent>
            <TableContainer sx={{ maxHeight: 350, overflowY: 'auto' }}>
              <Table stickyHeader>
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