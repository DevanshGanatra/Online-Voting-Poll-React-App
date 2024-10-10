import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import './LinkGeneratingPage.css';

function LinkGeneratingPage() {
    const { pollId } = useParams();
    const [poll, setPoll] = useState(null);
    const navigate = useNavigate();
    const [showQRCode, setShowQRCode] = useState(false);
    const [newOptionName, setNewOptionName] = useState(""); // State for new option name
    const [showResults, setShowResults] = useState(false);
    const [pollResults, setPollResults] = useState(null);

    useEffect(() => {
        const fetchPollData = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/polls/${pollId}`);
                if (!response.ok) throw new Error('Poll not found');
                const data = await response.json();
                setPoll(data);
            } catch (error) {
                console.error("Error fetching poll:", error);
            }
        };

        fetchPollData();
    }, [pollId]);

    const handleDelete = async (optionId) => {
        try {
            await fetch(`http://localhost:3001/api/polls/${pollId}/options/${optionId}`, { method: 'DELETE' });
            setPoll(prevPoll => ({
                ...prevPoll,
                options: prevPoll.options.filter(option => option.id !== optionId)
            }));
        } catch (error) {
            console.error("Error deleting option:", error);
        }
    };

    const handleEdit = async (optionId, currentOptionName) => {
        const updatedOptionName = prompt("Edit Option:", currentOptionName);
        if (updatedOptionName) {
            try {
                const response = await fetch(`http://localhost:3001/api/polls/${pollId}/options/${optionId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ optionName: updatedOptionName }),
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) throw new Error('Error editing option');
                const updatedPoll = await response.json();
                setPoll(updatedPoll);
            } catch (error) {
                console.error("Error editing option:", error);
            }
        }
    };

    const handleShareLink = () => {
        const shareURL = `${window.location.origin}/vote/${pollId}`;
        alert(`Share this link to vote: ${shareURL}`);
    };

    const handleScanQR = () => {
        setShowQRCode(true);
    };

    const handleCloseQRModal = () => {
        setShowQRCode(false);
    };

    const handleAddOption = async () => {
        if (!newOptionName.trim()) {
            alert("Option name is required."); // Validate option name
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/polls/${pollId}`, {
                method: 'POST',
                body: JSON.stringify({ optionName: newOptionName }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Error adding new option');
            window.location.reload();
        } catch (error) {
            console.error("Error adding new option:", error);
        }
    };

    // Function to handle showing poll results
    const handleSeeResults = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/polls/${pollId}`);
            if (!response.ok) throw new Error('Error fetching poll results');
            const results = await response.json();
            setPollResults(results);
            setShowResults(true); // Show results modal
        } catch (error) {
            console.error("Error fetching poll results:", error);
        }
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById("qr-code"); // Get the QR code canvas element
        const pngUrl = canvas.toDataURL("image/png"); // Convert the canvas to a data URL
        const downloadLink = document.createElement("a"); // Create an anchor element
        downloadLink.href = pngUrl; // Set the href to the data URL
        downloadLink.download = "qr-code.png"; // Set the file name for the download
        document.body.appendChild(downloadLink); // Append the anchor to the body
        downloadLink.click(); // Trigger the click to download
        document.body.removeChild(downloadLink); // Remove the anchor from the document
    };


    // Function to handle ending the poll
    const handleEndPoll = async () => {
        if (window.confirm("Are you sure you want to end the poll?")) {
            try {
                const response = await fetch(`http://localhost:3001/api/polls/${pollId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) throw new Error('Error ending the poll');
                navigate("/");
            } catch (error) {
                console.error("Error ending poll:", error);
            }
        }
    };

    if (!poll) {
        return (
            <motion.div className="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}>
                Loading...
            </motion.div>
        );
    }

    const shareURL = `${window.location.origin}/vote/${pollId}`;

    return (
        <motion.div className="Linkcontainer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            <h2>{poll.pollTitle}</h2>

            <motion.div className="button-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}>
                <motion.button
                    onClick={handleShareLink}
                    className="btn btn-primary mb-3"
                    whileHover={{ scale: 1.1, backgroundColor: "#0056b3" }}
                    whileTap={{ scale: 0.95 }}>
                    Generate Voting Link
                </motion.button>
                <motion.button
                    onClick={handleScanQR}
                    className="btn btn-secondary mb-3"
                    whileHover={{ scale: 1.1, backgroundColor: "#6c757d" }}
                    whileTap={{ scale: 0.95 }}>
                    Scan QR
                </motion.button>
                <motion.button
                    onClick={handleSeeResults}
                    className="btn btn-info mb-3"
                    whileHover={{ scale: 1.1, backgroundColor: "#17a2b8" }}
                    whileTap={{ scale: 0.95 }}>
                    See Results
                </motion.button>
                <motion.button
                    onClick={handleEndPoll}
                    className="btn btn-danger mb-3"
                    whileHover={{ scale: 1.1, backgroundColor: "#dc3545" }}
                    whileTap={{ scale: 0.95 }}>
                    End Poll
                </motion.button>
            </motion.div>

            <motion.table
                className="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Option Name</th>
                        <th>Edit</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {poll && poll.options && poll.options.length > 0 ? (
                        poll.options.map(option => (
                            <motion.tr key={option.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}>
                                <td>{option.id}</td>
                                <td>{option.optionName}</td>
                                <td>
                                    <motion.button
                                        className="btn btn-warning"
                                        onClick={() => handleEdit(option.id, option.optionName)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}>
                                        Edit
                                    </motion.button>
                                </td>
                                <td>
                                    <motion.button
                                        className="btn btn-danger"
                                        onClick={() => handleDelete(option.id)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}>
                                        Delete
                                    </motion.button>
                                </td>
                            </motion.tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">No options available</td>
                        </tr>
                    )}
                </tbody>
            </motion.table>

            <div className="add-option-container">
                <input
                    type="text"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder="New Option Name"
                    className="form-control mb-2"
                />
                <motion.button
                    onClick={handleAddOption}
                    className="btn btn-success "
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}>
                    Add Entry
                </motion.button>
            </div>

            {showQRCode && (
                <motion.div className="qr-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}>
                    <motion.div className="qr-modal">
                        <QRCodeCanvas
                            value={shareURL}
                            id="qr-code" // Add an ID for the canvas to reference
                        />
                        <motion.button
                            onClick={handleCloseQRModal}
                            className="btn btn-close"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}>
                        </motion.button>
                        <motion.button
                            onClick={handleDownloadQR}
                            className="btn btn-download"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}>
                            Download QR
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}


            {showResults && (
                <motion.div className="results-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}>
                    <motion.div className="results-modal">
                        <h3>Poll Results</h3>
                        <ul>
                            {pollResults.options.map(option => {
                                const isHighest = option.optionCount === Math.max(...pollResults.options.map(opt => opt.optionCount));
                                return (
                                    <li key={option.id} className={isHighest ? 'highest-vote' : ''}>
                                        {option.optionName}: {option.optionCount} votes
                                    </li>
                                );
                            })}
                        </ul>
                        <p>
                            Highest Votes: {pollResults.options.reduce((prev, current) =>
                                (prev.optionCount > current.optionCount) ? prev : current).optionName}
                        </p>
                        <motion.button
                            onClick={() => setShowResults(false)}
                            className="btn btn-close"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}>
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}

        </motion.div>
    );
}

export default LinkGeneratingPage;
