"use client";

import { useUser, SignedIn, UserButton } from '@clerk/nextjs'
import { Card, AppBar, Toolbar, Grid, Container, Dialog, TextField, Typography, Box, Paper, Button, CardActionArea, CardContent, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { writeBatch, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation'
import { db } from '@/firebase';
import { useState } from 'react';

export default function Generate() {
  const {isLoaded, isSignedIn, user} = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("Please enter some text to generate flashcards.");
      return;
    }
  
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }
  
      const data = await response.json();
      setFlashcards(data);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert("An error occurred while generating flashcards. Please try again.");
    }
  };
  

  const handleCardClick = (id) => {
    setFlipped((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const saveFlashcards = async () => {
    if(!name){
      alert('Please enter a name')
      return
    }
    const batch =  writeBatch(db)
    const userDocRef = doc(collection(db, 'users'), user.id)
    const docSnap = await getDoc(userDocRef)

    if(docSnap.exists()){
      const collections = docSnap.data().flashcards || []
      if(collections.find((f) => f.name === name)){
        alert("Flashcard collection with the same name exists")
        return
      }
      else{
        collections.push({name})
        batch.set(userDocRef, {flashcards: collections}, {merge: true})
      }
    }
    else{
      batch.set(userDocRef, {flashcards: [{name}]})
    }

    const colRef = collection(userDocRef, name)
    flashcards.forEach((flashcard) => {
      const cardDocRef = doc(colRef)
      batch.set(cardDocRef, flashcard)
    })
    await batch.commit()
    handleClose()
    router.push('/flashcards')
  }

  return(
    <Container macWidth="md">
      <AppBar sx={{ bgcolor: "#e0e0e0", boxShadow: 'none', width: "100vw", left: 0, marginLeft: 'calc(-50vw + 50%)' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ color: "black", fontWeight: 'bold'  }}>
          FlashBook
        </Typography>
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ color: "black", fontWeight: 'bold'  }}>
            Generate New Flashcard
          </Typography>
        </Box>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </Toolbar>
    </AppBar>
      <Box sx={{
        mt: 4, mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <Typography variant="h4">Generate Flashcards</Typography>
        <Paper sx={{p: 4, width: '100%'}}>
          <TextField value = {text} onChange={(e) => setText(e.target.value)} label="Enter Text" fullWidth multiline rows={4} variant='outlined'
            sx={{mb: 2}}></TextField>
          <Button variant='contained' color='primary' onClick={handleSubmit} fullWidth>Generate Flashcards</Button>
        </Paper>
      </Box>
      {flashcards.length > 0 && <Box sx={{mt: 4}}>
          <Typography variant='h5'></Typography>
          <Grid container spacing={3}>
            {flashcards.map((flashcard, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardActionArea onClick={() => {
                    handleCardClick(index)
                  }}>
                    <CardContent>
                      <Box sx={{perpective: '1000px',
                        '& > div': {
                          transition: 'transform 0.6s',
                          transformStyle: 'preserve-3d',
                          position: 'relative',
                          width: '100%',
                          height: '200px',
                          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
                          transform: flipped[index] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        },
                        '& > div > div': {
                          position: 'absolute',
                          width: '100%',
                          height: '200px',
                          backfaceVisibility: 'hidden',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 2,
                          boxSizing: 'border-box'
                        },
                        '& > div > div:nth-of-type(2)': {
                          transform: 'rotateY(180deg)',
                        }
                      }}>
                        <div>
                          <div>
                            <Typography variant='h5' component='div'>
                              {flashcard.front}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant='h5' component='div'>
                              {flashcard.back}
                            </Typography>
                          </div>
                        </div>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{mt:4, display: 'flex', justifyContent: 'center'}}>
            <Button variant='contained' color='secondary' onClick={handleOpen}>Save</Button>
          </Box>
        </Box>}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Save Flashcards</DialogTitle>
          <DialogContent>
            <DialogContentText>Please enter a name for your flashcard collection</DialogContentText>
            <TextField autofocus margin='dense' label="Collection Name" type='text' dullWidth value={name} onChange={(e) => setName(e.target.value)} variant='outlined'></TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={saveFlashcards}>Save</Button>
          </DialogActions>
        </Dialog>
    </Container>
  )
}