const express = require("express");
const mongoose = require("mongoose");
const Poll = require("./poll");
const Vote = require("./vote"); // Vote model to track user votes by IP
const cors = require("cors");
const requestIp = require("request-ip"); // to capture IP addresses
const http = require("http");
const { Server } = require("socket.io");

require('dotenv').config();
const dbURL = process.env.DB_URL;

mongoose.connect(dbURL)
    .then(() => {
        console.log("Connected to DataBase :)");

        const app = express();
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: {
                origin: "*", // Allow all origins (you can restrict this as per your needs)
                methods: ["GET", "POST"]
            }
        });

        app.use(cors());
        app.use(express.json());
        app.use(requestIp.mw()); // Middleware to capture IP

        // POST: Create a new poll
        app.post("/api/polls", async (req, res) => {
            try {
                const { pollTitle, options } = req.body;

                if (!Array.isArray(options) || options.length === 0) {
                    return res.status(400).json({ message: "Options are required and must be an array." });
                }

                const pollId = new mongoose.Types.ObjectId().toString(); // Create a new ObjectId or replace it with your custom ID logic

                const formattedOptions = options.map((option, index) => ({
                    id: option.id || new mongoose.Types.ObjectId().toString(), // Generate an ID if not provided
                    optionName: option.optionName,
                    optionCount: 0
                }));

                const newPoll = new Poll({ _id: pollId, pollTitle, options: formattedOptions });
                const savedPoll = await newPoll.save();
                res.status(201).json({ message: "Poll created successfully!", poll: savedPoll });
            } catch (error) {
                console.error("Error creating poll:", error);
                res.status(500).json({ message: "Error creating poll" });
            }
        });

        // GET: Retrieve a poll by pollId
        app.get('/api/polls/:pollId', async (req, res) => {
            try {
                const pollId = req.params.pollId;
                const poll = await Poll.findById(pollId);

                if (!poll) {
                    return res.status(404).json({ message: "Poll not found." });
                }

                const totalVotes = poll.options.reduce((acc, option) => acc + option.optionCount, 0);
                const ip = req.clientIp || req.ip;

                // Check if the user has already voted based on IP and pollId
                const hasVoted = await Vote.exists({ ip, pollId });

                res.status(200).json({
                    pollTitle: poll.pollTitle,
                    options: poll.options,
                    hasVoted,
                    totalVotes
                });
            } catch (error) {
                console.error('Error fetching poll:', error);
                res.status(500).json({ message: 'Error fetching poll data.' });
            }
        });



        // POST: Submit a vote for a poll
        app.post("/api/polls/:pollId/vote", async (req, res) => {
            try {
                const pollId = req.params.pollId; // Get the poll ID from parameters
                const { optionId } = req.body; // Get the option ID from request body
                const ip = req.clientIp || req.ip; // Get the client's IP address

                // Validate pollId and optionId presence
                if (!pollId) {
                    return res.status(400).json({ message: "Poll ID is required." });
                }

                if (!optionId) {
                    return res.status(400).json({ message: "Option ID is required." });
                }

                // Check if the user has already voted for this poll
                const existingVote = await Vote.findOne({ ip, pollId });
                if (existingVote) {
                    return res.status(400).json({ message: "You have already voted in this poll!" });
                }

                // Find the poll and increment the vote count for the selected option and totalVotes
                const poll = await Poll.findOneAndUpdate(
                    { _id: pollId, "options.id": optionId },
                    {
                        $inc: { "options.$.optionCount": 1, totalVotes: 1 }  // Increment both the option and totalVotes
                    },
                    { new: true } // Return the updated poll
                );

                if (!poll) {
                    return res.status(404).json({ message: "Poll or option not found." });
                }

                // Save the vote in the Vote collection
                const newVote = new Vote({ ip, pollId, optionId });
                await newVote.save();

                // Return a success response with the updated poll
                res.status(200).json({
                    message: "Vote submitted successfully!",
                    poll: poll
                });

            } catch (error) {
                console.error("Error submitting vote:", error);
                res.status(500).json({ message: "Error submitting vote." });
            }
        });


        // GET: Fetch a specific poll by ID
        app.get("/api/polls/:pollId", async (req, res) => {
            try {
                const pollId = req.params.pollId;
                if (!mongoose.isValidObjectId(pollId)) {
                    return res.status(400).json({ message: "Invalid poll ID format" });
                }

                const poll = await Poll.findById(pollId);
                if (!poll) {
                    return res.status(404).json({ message: "Poll not found" });
                }
                res.status(200).json(poll);
            } catch (error) {
                console.error("Error fetching poll:", error);
                res.status(500).json({ message: "Error fetching poll" });
            }
        });

        // PUT: Edit an option in the poll by _id
        app.put("/api/polls/:pollId/options/:optionId", async (req, res) => {
            try {
                const { optionName } = req.body; // New option name
                const pollId = req.params.pollId; // Poll ID treated as a string
                const optionId = req.params.optionId; // Option ID treated as a string

                if (typeof pollId !== "string" || pollId.trim() === '') {
                    return res.status(400).json({ message: "Invalid poll ID format" });
                }

                if (typeof optionId !== "string" || optionId.trim() === '') {
                    return res.status(400).json({ message: "Invalid option ID format" });
                }

                const poll = await Poll.findById(pollId);
                if (!poll) {
                    return res.status(404).json({ message: "Poll not found" });
                }

                const option = poll.options.find(option => option.id === optionId); // Find option by custom id
                if (!option) {
                    return res.status(404).json({ message: "Option not found" });
                }

                option.optionName = optionName;

                const updatedPoll = await poll.save();
                res.status(200).json(updatedPoll);
            } catch (error) {
                console.error("Error updating option:", error);
                res.status(500).json({ message: "Error updating option" });
            }
        });




        // DELETE: Delete an option by optionId
        app.delete("/api/polls/:pollId/options/:optionId", async (req, res) => {
            try {
                const pollId = req.params.pollId;
                const optionId = req.params.optionId;

                if (typeof pollId !== "string" || pollId.trim() === '') {
                    return res.status(400).json({ message: "Invalid poll ID format" });
                }

                if (typeof optionId !== "string") {
                    return res.status(400).json({ message: "Invalid option ID format" });
                }

                const poll = await Poll.findById(pollId);
                if (!poll) {
                    return res.status(404).json({ message: "Poll not found" });
                }

                const initialOptionCount = poll.options.length;

                poll.options = poll.options.filter(option => option.id !== optionId);

                if (poll.options.length === initialOptionCount) {
                    return res.status(404).json({ message: "Option not found" });
                }

                const updatedPoll = await poll.save();
                res.status(200).json(updatedPoll);
            } catch (error) {
                console.error("Error deleting option:", error);
                res.status(500).json({ message: "Error deleting option" });
            }
        });

        // GET: Fetch a specific poll by ID
        app.get("/api/polls/:pollId", async (req, res) => {
            try {
                const pollId = req.params.pollId;

                if (typeof pollId !== 'string' || pollId.trim() === '') {
                    return res.status(400).json({ message: "Invalid poll ID format" });
                }

                // Fetch the poll by its _id
                const poll = await Poll.findById(pollId); // Note: This will still work as mongoose will convert string _id to ObjectId internally
                if (!poll) {
                    return res.status(404).json({ message: "Poll not found" });
                }

                res.status(200).json(poll);
            } catch (error) {
                console.error("Error fetching poll:", error);
                res.status(500).json({ message: "Error fetching poll" });
            }
        });

        // POST: Add a new option to an existing poll
        app.post("/api/polls/:pollId", async (req, res) => {
            try {
                const pollId = req.params.pollId; // Get poll ID from parameters
                const { optionName } = req.body;  // Get new option's name from request body

                if (!optionName || typeof optionName !== 'string' || optionName.trim() === '') {
                    return res.status(400).json({ message: "Option name is required." });
                }

                // Find the poll by its ID
                const poll = await Poll.findById(pollId);
                if (!poll) {
                    return res.status(404).json({ message: "Poll not found." });
                }

                // Get the last option's ID and increment it by 1 for the new option's ID
                let lastOptionId = 0;
                if (poll.options.length > 0) {
                    lastOptionId = Math.max(...poll.options.map(option => parseInt(option.id))); // Get the highest ID
                }

                const newOptionId = (lastOptionId + 1).toString(); // Increment the last ID and convert to string

                // Add the new option to the poll's options array
                poll.options.push({
                    id: newOptionId,
                    optionName: optionName,
                    optionCount: 0 // Start with 0 votes for the new option
                });

                // Save the updated poll to the database
                const updatedPoll = await poll.save();

                // Respond with the updated poll
                res.status(200).json({ message: "Option added successfully.", poll: updatedPoll });
            } catch (error) {
                console.error("Error adding new option:", error);
                res.status(500).json({ message: "Error adding new option." });
            }
        });

        // Add this route in end the poll
        app.delete("/api/polls/:pollId", async (req, res) => {
            try {
                const pollId = req.params.pollId;
                const poll = await Poll.findByIdAndDelete(pollId); // Delete the poll by ID
                if (!poll) {
                    return res.status(404).json({ message: "Poll not found" });
                }
                res.status(200).json({ message: "Poll deleted successfully" });
            } catch (error) {
                console.error("Error deleting poll:", error);
                res.status(500).json({ message: "Error deleting poll" });
            }
        });


        // Start the server
        server.listen(3001, () => {
            console.log("Server started on port 3001");
        });
    })
    .catch((error) => {
        console.error("Error connecting to the database:", error);
    });
