import { useState } from 'react';
import Heading from './Heading';
import './StartPage.css';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

function StartPage() {
    const [data, setData] = useState({ pollTitle: '', options: [] });
    const [optionText, setOptionText] = useState('');
    const [pollSubmitted, setPollSubmitted] = useState(false);  // Local submission state
    const navigate = useNavigate();

    // Function to add an option locally without submitting
    const addOption = () => {
        if (optionText.trim()) {
            const newOption = {
                id: data.options.length + 1, // Incremental ID for new options
                optionName: optionText,
                optionCount: 0
            };
            setData(prevData => ({
                ...prevData,
                options: [...prevData.options, newOption]
            }));
            setOptionText(''); // Reset input field
        }
    };

    // Async function to submit the poll and persist data in the database
    const handleSubmit = async () => {
        if (!data.pollTitle) {
            alert("Poll title is required!");
            return;
        }

        const dbURL = 'http://localhost:3001/api/polls';

        try {
            const response = await fetch(dbURL, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json(); // Await the result from the fetch

            console.log('Poll added:', result);
            if (result.poll && result.poll._id) {
                const pollId = result.poll._id; // Get the poll ID
                setPollSubmitted(true);
                navigate(`/poll/${pollId}`); // Navigate using the poll ID
            } else {
                alert("Poll creation failed!");
            }
        } catch (error) {
            console.error('Error adding poll:', error);
        }
    };

    // Function to delete an option locally (not in DB until submitted)
    const handleDeleteLocal = (optionId) => {
        // Filter out the option locally
        setData(prevData => ({
            ...prevData,
            options: prevData.options.filter(option => option.id !== optionId)
        }));
    };

    // Function to edit an option locally (not in DB until submitted)
    const handleEditLocal = (optionId, currentOptionName) => {
        const updatedOptionName = prompt("Edit Option:", currentOptionName);
        if (updatedOptionName) {
            // Update the local state with the new name
            setData(prevData => ({
                ...prevData,
                options: prevData.options.map(option =>
                    option.id === optionId ? { ...option, optionName: updatedOptionName } : option
                )
            }));
        }
    };

    // Locally added options are rendered here
    const addedOptionsLocally = data.options.map(option => (
        <div key={option.id} className="option-item">
            <span>{option.optionName}</span>
            <span className='editing'>
                <button onClick={() => handleEditLocal(option.id, option.optionName)}>✏️</button>
                <button onClick={() => handleDeleteLocal(option.id)}>🗑️</button>
            </span>
        </div>
    ));

    return (
        <>
            <div className="Content">
                <Heading />
                <div className="my-container">
                    <motion.div className='main' whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.8 }}>
                        <label className='title'>Give Title</label>
                        <input
                            type='text'
                            value={data.pollTitle}
                            onChange={(e) => setData({ ...data, pollTitle: e.target.value })} // Controlled input
                        />
                        <label className='addOptions'>Add Options:
                            <input
                                type='text'
                                value={optionText}
                                onChange={(e) => setOptionText(e.target.value)}
                            />
                            <button onClick={addOption}><i className="bi bi-plus-lg"></i></button>
                        </label>

                        <span className="options-container">
                            {addedOptionsLocally}
                        </span>

                        <button onClick={handleSubmit}>Submit Poll</button>

                        {/* Conditional rendering to confirm poll submission */}
                        {pollSubmitted && <p>Poll submitted successfully!</p>}
                    </motion.div>
                </div>
            </div>
        </>
    );
}

export default StartPage;
