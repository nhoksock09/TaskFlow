const path = require('path');
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({
    path: path.join(__dirname, 'src', 'config', 'environments', `${env}.env`)
});

const app = require('./src');
const connectDB = require('./src/config/db');

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});