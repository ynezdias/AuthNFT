import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinRouter from './routes/pin.js';
import mintRouter from './routes/mint.js';
import escrowRouter from './routes/escrow.js';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));


app.use('/api/pin', pinRouter);
app.use('/api/mint', mintRouter);
app.use('/api/escrow', escrowRouter);


const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));