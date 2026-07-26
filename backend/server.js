require('dotenv').config();

const app = require('./src');
const connectDB = require('./src/config/db');

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});