'use client'
import React, { useState, useEffect } from "react";
import Webcam from "react-webcam";
import { firestore } from "@/firebase";
import { Box, Grid, Typography, Button, Modal, TextField, Card, CardContent, CardActions, Snackbar, CircularProgress } from '@mui/material';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const storage = getStorage();

  const updateInventory = async () => {
    try {
      const snapshot = query(collection(firestore, 'inventory'));
      const docs = await getDocs(snapshot);
      const inventoryList = [];
      docs.forEach((doc) => {
        inventoryList.push({ name: doc.id, ...doc.data() });
      });
      setInventory(inventoryList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const addItem = async (item, quantity, imageUrl = null) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const existingQuantity = docSnap.data().quantity;
        await setDoc(docRef, { quantity: existingQuantity + quantity, imageUrl }, { merge: true });
      } else {
        await setDoc(docRef, { quantity, imageUrl });
      }
      await updateInventory();
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { quantity: quantity - 1 }, { merge: true });
        }
      }
      await updateInventory();
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCameraOpen = () => setCameraOpen(true);
  const handleCameraClose = () => setCameraOpen(false);

  const handleCapture = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setImageSrc(screenshot);
    handleCameraClose();
  };

  const handleImageUpload = async () => {
    if (imageSrc) {
      try {
        const storageRef = ref(storage, `images/${itemName}`);
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        addItem(itemName, parseInt(itemQuantity, 10), downloadURL);
        setImageSrc(null);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    } else {
      addItem(itemName, parseInt(itemQuantity, 10));
    }
    setItemName('');
    setItemQuantity('');
    handleClose();
  };

  const webcamRef = React.useRef(null);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ padding: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h2" gutterBottom sx={{ fontFamily: 'cursive', fontWeight: 'bold' }}>
        Inventory Management
      </Typography>
      <TextField
        label="Search Items"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ marginBottom: 2, width: '50%' }}
      />
      <Button variant="contained" onClick={handleOpen} sx={{ marginBottom: 2 }}>
        Add New Item
      </Button>
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2} sx={{ padding: 2, borderRadius: 2 }}>
          {filteredInventory.map(({ name, quantity, imageUrl }) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Card sx={{ backgroundColor: '#B6D0E2' }}>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  {imageUrl && <img src={imageUrl} alt={name} style={{ width: '100%', height: 'auto' }} />}
                  <Typography color="text.secondary">
                    Quantity: {quantity}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => addItem(name, 1)}>Add</Button>
                  <Button size="small" onClick={() => removeItem(name)}>Remove</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">
            Add Item
          </Typography>
          <TextField
            label="Item Name"
            variant="outlined"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Quantity"
            variant="outlined"
            type="number"
            value={itemQuantity}
            onChange={(e) => setItemQuantity(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <Button variant="contained" onClick={handleCameraOpen} sx={{ marginBottom: 2 }}>
            Take Photo
          </Button>
          <Button
            variant="contained"
            onClick={handleImageUpload}
          >
            Add
          </Button>
        </Box>
      </Modal>
      <Modal open={cameraOpen} onClose={handleCameraClose}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">
            Capture Image
          </Typography>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
          />
          <Button variant="contained" onClick={handleCapture}>
            Capture
          </Button>
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Action completed"
      />
    </Box>
  );
}
