const express = require('express');
const fs = require('fs');
const app = express();
const multer = require('multer');
const morgan = require('morgan');
const { time } = require('console');

app.use(morgan('dev'));

// create directory
var dir = 'public'
var subDirectory = 'public/uploads'

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.mkdirSync(subDirectory);
}

// multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// endpoints
app.get('/',(req,res) => {
    res.sendFile(__dirname + '/index.html');
})

app.get('/', (req, res) => {
    res.send('Hello World');
    console.log('server is working')
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        console.log(file);
        if (!file) {
            res.status(400).send({
                status: false,
                data: 'No file is selected.'
            });
        } else {
            res.send({
                status: true,
                message: 'File is uploaded.',
                data: {
                    name: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                }
            });
        }
    } catch (err) {
        console.log(err);
    }
})

app.listen(3000, () => console.log('Server started on port 3000'));

