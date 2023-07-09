const express = require('express');
const socket = require('socket.io');

const app = express();
const cors = require('cors');
const PORT=3020;

app.use(cors()); 
app.use(express.static('client'));

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
