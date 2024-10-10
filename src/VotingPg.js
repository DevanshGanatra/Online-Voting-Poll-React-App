import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import framer-motion
import './VotingPg.css'; // Styling file

const VotingPg = () => {
    const { pollId } = useParams(); // Get the pollId from the URL
    const [options, setOptions] = useState([]);
    const [pollTitle, setPollTitle] = useState('');
    const [selectedVote, setSelectedVote] = useState('');
    const [totalVotes, setTotalVotes] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);

    // Calculate the total votes based on option counts
    const calculateTotalVotes = (options) => {
        return options.reduce((sum, option) => sum + option.optionCount, 0);
    };

    // Fetch poll options and voting status
    useEffect(() => {
        const fetchPollData = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/polls/${pollId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch poll data');
                }
                const data = await response.json();

                setOptions(data.options);
                setPollTitle(data.pollTitle); // Set the poll title

                // Calculate and set total votes from all options
                const totalVotes = calculateTotalVotes(data.options);
                setTotalVotes(totalVotes);

                setHasVoted(data.hasVoted);
            } catch (error) {
                console.error('Error fetching poll data:', error);
                alert('Failed to load poll data. Please try again later.');
            }
        };

        fetchPollData();
    }, [pollId]);

    // Handle vote selection
    const handleVoteSelection = (id) => {
        if (!hasVoted) {
            setSelectedVote(id);
        }
    };

    // Submit vote
    const handleSubmitVote = async () => {
        if (!selectedVote) return;

        try {
            const response = await fetch(`http://localhost:3001/api/polls/${pollId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ optionId: selectedVote }),
            });

            const data = await response.json();
            if (data.message === 'Vote submitted successfully!') {
                setHasVoted(true);

                // Update the selected option's vote count in the options array
                setOptions((prevOptions) =>
                    prevOptions.map((option) =>
                        option.id === selectedVote
                            ? { ...option, optionCount: option.optionCount + 1 }
                            : option
                    )
                );

                // Calculate and update the totalVotes after the vote
                const newTotalVotes = calculateTotalVotes(
                    options.map((option) =>
                        option.id === selectedVote
                            ? { ...option, optionCount: option.optionCount + 1 }
                            : option
                    )
                );
                setTotalVotes(newTotalVotes); // Update with new totalVotes

                alert('Your vote has been submitted!'); // Notify user of success
            } else {
                alert('You have already voted or an error occurred.');
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('Failed to submit vote. Please try again later.');
        }
    };

    return (
        <div className='votingPgBody'>
            <div className="voting-page">
                <motion.div
                    className="container"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className='VotingTitle'>{pollTitle}</h2>
                    <div className="options-list">
                        {options.map((option) => {
                            const votePercentage = totalVotes > 0 ? (option.optionCount / totalVotes) * 100 : 0;

                            return (
                                <motion.div
                                    key={option.id}
                                    className={`option ${selectedVote === option.id ? 'selected' : ''}`}
                                    onClick={() => handleVoteSelection(option.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <p>{option.optionName}</p>
                                    <div className="vote-progress">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${votePercentage}%` }}
                                        />
                                        <div className="vote-count">Votes: {option.optionCount}</div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    <h3>Total Votes: {totalVotes}</h3>

                    {selectedVote && !hasVoted && (
                        <motion.div
                            className="confirmation"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p>Are you sure you want to vote for <strong>{options.find(opt => opt.id === selectedVote)?.optionName}</strong>?</p>
                            <button onClick={handleSubmitVote}>Submit Vote</button>
                            <button onClick={() => setSelectedVote('')}>Cancel</button>
                        </motion.div>
                    )}

                    {hasVoted && <p>You have already voted. Thank you!</p>}
                </motion.div>
            </div>
        </div>
    );
};

export default VotingPg;
