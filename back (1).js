const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS (for development purposes only)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Create the 'uploads' directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store files in uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate unique filename
  }
});
const upload = multer({ storage: storage });

// Dummy users data (replace with your actual authentication mechanism)
const users = [
  { username: "student", password: "student", userType: "student" },
  { username: "teacher", password: "teacher", userType: "teacher" }
];

// Dummy projects data (replace with your actual database)
let projects = [];

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username && user.password === password);
  if (user) {
    res.status(200).json({ success: true, userType: user.userType });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Endpoint to submit a project
app.post("/submit", upload.fields([
    { name: "abstract1File", maxCount: 1 },
    { name: "abstract2File", maxCount: 1 },
    { name: "abstract3File", maxCount: 1 }
]), (req, res) => {
    const { class: projectClass, branch, abstract1Title, abstract2Title, abstract3Title } = req.body;
    const abstract1File = req.files["abstract1File"][0];
    const abstract2File = req.files["abstract2File"][0];
    const abstract3File = req.files["abstract3File"][0];

    // Save project data to database
    projects.push({
        id: projects.length + 1,
        class: projectClass,
        branch: branch,
        abstract1Title: abstract1Title,
        abstract1File: abstract1File.filename, // Store file name
        abstract2Title: abstract2Title,
        abstract2File: abstract2File.filename, // Store file name
        abstract3Title: abstract3Title,
        abstract3File: abstract3File.filename // Store file name
    });

    res.status(200).json({ success: true, message: "Project submitted successfully" });
});

// Endpoint to retrieve projects by branch
app.get("/projects", (req, res) => {
    const { branch } = req.query;
    const projectsByBranch = projects.filter(project => project.branch === branch);
    res.json(projectsByBranch);
});

// Serve abstract files
app.get("/abstracts/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(err); // Log the error for debugging
            res.status(404).json({ success: false, message: "File not found" });
        } else {
            res.sendFile(filePath);
        }
    });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
