import React, { useState } from 'react';

const Rule = ({ rule }) => {
  const [isGrayBackground, setIsGrayBackground] = useState(false); // State to track background color
  

  const boxStyle = {
    backgroundColor: isGrayBackground ? 'gray' : 'white', // Use gray or white based on state
    color: '#000',
    border: `1px solid`,
    borderRadius: '10px',
    margin: '2px',
    paddingLeft: '5px',
    paddingRight: '5px',
    cursor: 'pointer', 
  };

  // Function to toggle background color when clicked
  const handleClick = () => {
    setIsGrayBackground(prevState => !prevState);
  };

  return (
    <div style={boxStyle} onClick={handleClick}> 
      <p>{rule}</p>
    </div>
  );
};

export default Rule;
