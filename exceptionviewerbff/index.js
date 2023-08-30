const express = require('express');
const fs = require('fs');
const path = require('path');
const util = require('util');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const cors = require('cors');
const readdir = util.promisify(fs.readdir);
const session = require('express-session');
const bodyParser = require('body-parser');
const PORT = 3002;

const app = express();
app.use(express.json())
app.use(cors());

app.use(express.static('public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

const users = [
    { username: 'admin', password: 'password123', role:'admin' },
    { username: 'user1', password: 'password1', role: 'enhanceduser'},
    { username: 'user2', password: 'password2', role: 'user'}
];

users.forEach(user => {
    user.passwordHash = bcrypt.hashSync(user.password, 10);
    //delete user.password;
});

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'public/index.html')
})

const requireRole = (role) => {
    console.log("Role --- ", role)
    return (req, res, next) => {
        console.log("Role --- ", role, req.session. req.session.user)
        if (role) {
            next();
        } else {
            res.status(403).send('Access denied');
        }
    };
};

app.post('/api/login', async(req, res) => {
    
    const { username, password } = req.body;
    console.log("Login", username, password)
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user && await bcrypt.compare(password, user.passwordHash)) {
        req.session.user = user;
        console.log("SET -- - ", req.session.user);
        if (user) {
            res.status(200).json({ message: 'Login successful', user: req.session.user });
        } else {
            res.status(401).json({ message: 'Login failed' });
        }
        // switch(user.role){
        //     case 'admin':
        //         res.redirect('/admin')
        //         break;
        //     case 'user':
        //         res.redirect('/welcome')
        //         break;
        //     case 'enhanceduser':
        //         res.redirect('/user')
        //         break;
        //     default:
        //         res.redirect('/admin')
        //         break;
        // }
        
        // user.role === 'admin' ? res.redirect('/admin') : res.redirect('/welcome') ;
    } else {
        res.send('Invalid username or password. <a href="/">Try again</a>');
    }
});

app.get('/admin', requireRole('admin'),  (req, res) => {
    console.log('NODE LOGIN --', req.session.user)
    if (req.session.user) {
        res.render(__dirname + '/public/adminWelcome', { username: req.session.user.username, role: req.session.user.role});
    } else {
        if(!req.session.user) {
            res.redirect('/');
            return;
        }
        
    }
});

app.get('/user', requireRole('enhanceduser'),  (req, res) => {
    
    if (req.session.user) {
        res.render(__dirname + '/public/enhancedwelcome', { username: req.session.user.username, role: req.session.user.role});
    } else {
        if(!req.session.user) {
            res.redirect('/');
            return;
        }
        
    }
});

app.get('/welcome', requireRole('user'),  (req, res) => {
    if (req.session.user) {
        res.render(__dirname + '/public/welcome', { username: req.session.user.username, role: req.session.user.role});
    } else {
        if(!req.session.user) {
            res.redirect('/');
            return;
        }
        
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/folder', async (req, res) => {
    try {
        const folders = await readdir(__dirname);

        const filteredFolders = folders.filter(item => fs.statSync(item).isDirectory());
        const filteredFolderStream = filteredFolders;//req.session.user.role === 'admin' ? filteredFolders.slice(0,3) : req.session.user.role === 'enhanceduser' ? filteredFolders.slice(0,2) : filteredFolders.slice(0,1);
        res.send(filteredFolderStream);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while reading directories.');
    }
});

app.get('/files/:folder', async (req, res) => {
    const folderName = req.params.folder;
    try {
        const folderPath = path.join(__dirname, folderName);
        const files = await readdir(folderPath);
        const filteredFiles = files.filter(item => item !== '.DS_Store');

        res.send(filteredFiles);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while reading files in the folder.');
    }
});

app.get('/file-content/:folder/:file', (req, res) => {
    const folderName = req.params.folder;
    const fileName = req.params.file;

    try {
        const filePath = path.join(__dirname, folderName, fileName);
        const content = fs.readFileSync(filePath, 'utf-8');
        res.send(content);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while reading content.');
    }
});

app.listen(PORT, ()=>{
    console.log(`Server is listening on PORT ${PORT}`);
})