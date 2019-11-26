const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

// router imports
const apiRouter = require('./routes/api/api');

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

app.use('/api', apiRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log(`Listening on port 8000...`));
