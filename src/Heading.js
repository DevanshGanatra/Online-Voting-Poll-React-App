import React from 'react';
import { motion } from 'framer-motion';
import './Heading.css';
const Heading = () => {
    const text = "Make Group Polls for Friends & Family".split(" ");
    return (
      <div className="textOfHeading">
        {text.map((el, i) => (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.25,
              delay: i / 10,
            }}
            key={i}
          >
            {el}{" "}
          </motion.span>
        ))}
      </div>
    );
};

export default Heading;
