require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
const multer = require('multer');
const morgan = require('morgan');
const exec = require('child_process').exec;
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
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
var subDirectory1 = 'public/uploads'
var subDirectory2 = 'public/downloads'

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.mkdirSync(subDirectory1);
    fs.mkdirSync(subDirectory2);
}

// multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/downloads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'my-video.mov');
    }
});

const inputPath = './public/uploads/my-video.mov';
const outputPath = './public/downloads/output-video.mov';

// noise reducer function
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


const upload = multer({ storage: storage });

// post request to upload link to the mongoose database
app.post('/upload-link', upload.single('file'), async (req, res) => {
    const data = new Data({
        link: req.body.link
    })

    try {
        const dataToSave = await data.save();
        // Extract the file ID from the Google Drive link
        const fileId = extractFileId(dataToSave.link);

        // Use Google Drive API to fetch the file
        const file = await fetchFileFromDrive(fileId);
        // rename file
        fs.rename(file,'my-video.mov', (err) => {if (err) {console.log(err);}})
        console.log('Fetched file:', file);
        // save to folder
        const folderPath = './public/uploads';
        const fileName = 'my-video.mov';
        saveFileToFolder(file, fileName, folderPath);
        console.log('File saved to folder.');

        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

// Helper function to save the file to a specific folder
function saveFileToFolder(fileData, folderPath) {
    const filePath = path.join(folderPath, 'my-video.mov');
    fs.writeFileSync(filePath, fileData);
}


// Google works

// Helper function to extract the file ID from the Google Drive link
function extractFileId(link) {
    // Example: https://drive.google.com/file/d/<file_id>/view
    // Example: https://drive.google.com/file/d/1Zu4BvxFJrF6A62It6rDYMRwdAb4EcXau/view?usp=share_link
    const regex = /\/file\/d\/(.+?)\//;
    const matches = link.match(regex);
    return matches ? matches[1] : null;
}

// Helper function to fetch the file from Google Drive using the Google Drive API
async function fetchFileFromDrive(fileId) {
    const apiKey = process.env.API_KEY; // Replace with your own API key

    const response = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}?key=${apiKey}`, {
        responseType: 'json'
    });

    return response.data;
}

// google work ends



// this is route is to upload file from local machine
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