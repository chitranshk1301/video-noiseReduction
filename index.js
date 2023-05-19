// TODO: 
// 1. delete files after they are done processing (both input and output)
// 2. google drive link (that'll require database we'll use mongo) 
// 3. Queing service 

// 

const express = require('express');
const fs = require('fs');
const app = express();
const multer = require('multer');
const morgan = require('morgan');
const exec = require('child_process').exec;
import { path as ffmpeg } from '@ffmpeg-installer/ffmpeg';

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
    exec(`${ffmpeg} -i ${inputPath} -af "highpass=f=200,lowpass=f=3000,afftdn=nf=-25" ${outputPath}`, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    })
}

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

app.get('/run', (req, res) => {
    noiseReducer();
    res.send('Noise reducer is running');

})

app.listen(3000, () => console.log('Server started on port 3000'));



 
