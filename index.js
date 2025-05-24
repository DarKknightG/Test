const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mysql = require("mysql2");
const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Establishing the sql connection.
const connection = mysql.createConnection({
    host: "127.0.0.1", // Host Name
    user: process.env.db_USERNAME, // Database Username
    password: process.env.db_PASSWORD, // Database Password
    database: "schoolDb", // Database Name
});

// Connecting to port.
app.listen(port, (req, res) => {
    console.log("listening to port 8080");
});

// Index route.
app.get("/", (req, res) => {
    res.send("School Management API is running.");
});

// Function to get the distance between two latitude and longitude
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Add School route
app.post("/addSchool", (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || isNaN(latitude) || isNaN(longitude)) {
        return res
            .status(400)
            .json({ error: "All fields are required and must be valid" });
    }

    const query =
        "INSERT INTO schools (name, address, latitude, longitude) VALUES (?,?,?,?)";

    connection.query(
        query,
        [name, address, latitude, longitude],
        (err, result) => {
            if (err) return res.status(500).send(err.message);
            res.status(201).send("added school successfully");
        }
    );
});

// Route to show the list of schools.
app.get("/listSchools", (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
            error:
                "Latitude and longitude are required and must be valid numbers",
        });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const query = "SELECT * FROM Schools";
    connection.query(query, (err, result) => {
        if (err) return res.status(500).send(err.message);

        const allSchools = result.map((school) => {
            const distance = getDistance(
                userLat,
                userLon,
                school.latitude,
                school.longitude
            );
            return { ...school, distance };
        });

        allSchools.sort((a, b) => {
            return a.distance - b.distance;
        });
        res.send(allSchools);
    });
});
