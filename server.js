const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs').promises; // Use promise-based fs for async/await
const app = express();
const port = 3000;

// --- Configuration ---
const USERS_JSON_PATH = path.join(__dirname, 'users.json'); // Path to your users file

// --- Load Initial Users (Asynchronously) ---
let users = {}; // Initialize empty, will be loaded async

async function loadUsers() {
    try {
        console.log(`Attempting to load users from: ${USERS_JSON_PATH}`);
        // Check if file exists, create if not
        try {
            await fs.access(USERS_JSON_PATH);
        } catch (accessError) {
            console.log(`users.json not found, creating an empty one.`);
            // Initialize with a default user if needed, or just empty
            const defaultUsers = { /* "admin": "password123" */ };
            await fs.writeFile(USERS_JSON_PATH, JSON.stringify(defaultUsers, null, 2), 'utf8');
        }
        // Read the file
        const data = await fs.readFile(USERS_JSON_PATH, 'utf8');
        users = JSON.parse(data);
        console.log("Users loaded successfully:", Object.keys(users));
    } catch (error) {
        console.error("FATAL: Could not load users from users.json.", error);
        process.exit(1); // Exit if users can't be loaded
    }
}

// --- Middleware ---
app.use(bodyParser.json());

// --- Routes ---

// Serve Login Page
app.get('/', (req, res) => {
    const loginPath = path.join(__dirname, 'login.html');
    console.log(`Serving login page from: ${loginPath}`);
    res.sendFile(loginPath, (err) => {
        if (err) {
            console.error("Error sending login.html:", err);
            res.status(err.status || 500).send("Could not load login page.");
        }
    });
});

// Serve Registration Page
app.get('/register', (req, res) => {
    const registerPath = path.join(__dirname, 'register.html');
    console.log(`Serving registration page from: ${registerPath}`);
    res.sendFile(registerPath, (err) => {
         if (err) {
             console.error("Error sending register.html:", err);
             res.status(err.code === 'ENOENT' ? 404 : 500).send("Could not load registration page.");
         }
     });
});

// Handle Login Post
app.post('/login', (req, res) => {
    console.log("Login attempt received (POST /login)");
    if (!req.body || !req.body.username || !req.body.password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }
    const { username, password } = req.body;
    // Use the in-memory 'users' object for login check (it's kept up-to-date)
    if (users[username] && users[username] === password) {
        console.log(`Login successful for user: ${username}`);
        res.status(200).json({ success: true, message: 'Login successful' });
    } else {
        console.log(`Login failed for user: ${username}`);
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

// Handle Registration Post
app.post('/register', async (req, res) => {
    console.log("Registration attempt received:", req.body);
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password are required.' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });

    try {
        // Read latest data from file before checks/write
        let currentUsersFromFile;
        try {
            const data = await fs.readFile(USERS_JSON_PATH, 'utf8');
            currentUsersFromFile = JSON.parse(data);
        } catch (readError) {
             console.error("Error reading users.json during registration:", readError);
             return res.status(500).json({ success: false, message: 'Server error reading user data.' });
        }

        if (currentUsersFromFile[username]) {
            console.log(`Registration failed: Username '${username}' already exists.`);
            return res.status(409).json({ success: false, message: 'Username already taken. Please choose another.' });
        }

        // WARNING: Plain text password storage. Use bcrypt in production.
        currentUsersFromFile[username] = password;

        await fs.writeFile(USERS_JSON_PATH, JSON.stringify(currentUsersFromFile, null, 2), 'utf8');
        console.log(`users.json updated. Added new user: ${username}.`);

        // Update in-memory object
        users = currentUsersFromFile;
        console.log("In-memory users object updated.");

        res.status(201).json({ success: true, message: 'Registration successful!' });

    } catch (error) {
        console.error("Error processing registration:", error);
        res.status(500).json({ success: false, message: 'Failed to register user due to a server error.' });
    }
});

// Handle Change Username Post
app.post('/api/change-username', async (req, res) => {
    console.log("Change username request received:", req.body);
    const { currentUsername, newUsername } = req.body;
    if (!currentUsername || !newUsername) return res.status(400).json({ success: false, message: 'Current and new usernames are required.' });
    if (newUsername === currentUsername) return res.status(400).json({ success: false, message: 'New username cannot be the same as the current one.' });

    try {
        let currentUsersFromFile;
        try { const data = await fs.readFile(USERS_JSON_PATH, 'utf8'); currentUsersFromFile = JSON.parse(data); }
        catch (readError) { console.error("Error reading users.json during username change:", readError); return res.status(500).json({ success: false, message: 'Server error reading user data.' }); }

        if (!currentUsersFromFile[currentUsername]) {
             // Double check memory only as a fallback / warning indicator
             if (!users[currentUsername]){ return res.status(404).json({ success: false, message: 'Current user not found.' }); }
             console.warn("User found in memory but maybe not latest file state for username change check.");
        }
        if (currentUsersFromFile[newUsername]) return res.status(409).json({ success: false, message: 'New username already exists.' });

        const password = currentUsersFromFile[currentUsername] || users[currentUsername]; // Prefer file data
        if (!password) { console.error(`Could not retrieve password for user ${currentUsername} during change.`); return res.status(500).json({ success: false, message: 'Internal error processing request.' }); }

        delete currentUsersFromFile[currentUsername];
        currentUsersFromFile[newUsername] = password;

        await fs.writeFile(USERS_JSON_PATH, JSON.stringify(currentUsersFromFile, null, 2), 'utf8');
        console.log(`users.json updated. Changed ${currentUsername} to ${newUsername}.`);

        // Update in-memory object
        users = currentUsersFromFile;
        console.log("In-memory users object updated.");

        res.status(200).json({ success: true, message: 'Username updated successfully.' });

    } catch (error) {
        console.error("Error changing username:", error);
        res.status(500).json({ success: false, message: 'Failed to update username due to a server error.' });
    }
});

// Handle Change Password Post
app.post('/api/change-password', async (req, res) => {
    console.log("Change password request received for:", req.body.currentUsername);
    const { currentUsername, currentPassword, newPassword } = req.body;

    if (!currentUsername || !currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'All password fields are required.' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });

    try {
        // Read latest data from file
        let currentUsersFromFile;
        try {
            const data = await fs.readFile(USERS_JSON_PATH, 'utf8');
            currentUsersFromFile = JSON.parse(data);
        } catch (readError) {
             console.error("Error reading users.json during password change:", readError);
             return res.status(500).json({ success: false, message: 'Server error reading user data.' });
        }

        // Verify User exists in file data
        if (!currentUsersFromFile[currentUsername]) {
            console.log(`Password change failed: User '${currentUsername}' not found in file.`);
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Verify Current Password (Plain text comparison - insecure)
        const storedPassword = currentUsersFromFile[currentUsername];
        if (storedPassword !== currentPassword) {
            console.log(`Password change failed: Incorrect current password for user '${currentUsername}'.`);
            return res.status(401).json({ success: false, message: 'Incorrect current password.' });
        }

        // Update the password (Plain text storage - insecure)
        currentUsersFromFile[currentUsername] = newPassword;

        // Write updated data back to file
        await fs.writeFile(USERS_JSON_PATH, JSON.stringify(currentUsersFromFile, null, 2), 'utf8');
        console.log(`users.json updated. Changed password for user: ${currentUsername}.`);

        // Update in-memory object
        users = currentUsersFromFile;
        console.log("In-memory users object updated with new password.");

        res.status(200).json({ success: true, message: 'Password updated successfully.' });

    } catch (error) {
        console.error("Error processing password change:", error);
        res.status(500).json({ success: false, message: 'Failed to update password due to a server error.' });
    }
});


// --- Static Files (Serve AFTER specific routes) ---
const staticPath = path.join(__dirname);
console.log(`Serving static files from root directory: ${staticPath}`);
app.use(express.static(staticPath));

// --- Catch-all 404 ---
app.use((req, res) => {
    console.log(`404 Not Found for path: ${req.originalUrl}`);
    const fourOhFourPath = path.join(__dirname, '404.html');
    // Check if 404.html exists before sending
    fs.access(fourOhFourPath).then(() => {
        res.status(404).sendFile(fourOhFourPath);
    }).catch(() => {
        res.status(404).send("Sorry, can't find that!"); // Fallback text
    });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack);
    res.status(500).send('Something broke!');
});

// --- Start Server ---
loadUsers().then(() => {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
        console.log(`Serving files directly from: ${__dirname}`);
    });
}).catch(error => {
    // Error logged in loadUsers
});