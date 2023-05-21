// TODO: 
// 1. delete files after they are done processing (both input and output)
// 2. google drive link (that'll require database we'll use mongo) 
// 3. Queing service 

// 

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
const multer = require('multer');
const morgan = require('morgan');
const exec = require('child_process').exec;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const mongoString = process.env.DATABASE_URL
const Data = require('./schema');

app.use(bodyParser.json());

// mongoose config
mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})

// morgan config
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
        cb(null, 'my-video.mov');
    }
});

const inputPath = './public/uploads/my-video.mov';
const outputPath = './public/uploads/output-video.mov';

// noise reducer
const noiseReducer = (req, res) => {
    exec(`ffmpeg -i ${inputPath} -af "highpass=f=200,lowpass=f=3000,afftdn=nf=-25" ${outputPath}`, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    })
}

// endpoints
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

// post request to upload link to the mongoose database
app.post('/upload-link', async(req, res) => {
    const data = new Data({
        link: req.body.link
    })

    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

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

app.get('/run', (req, res) => {
    noiseReducer();
    res.send('Noise reducer is running');

})

app.listen(3000, () => console.log('Server started on port 3000'));




