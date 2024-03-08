import React from 'react';

const QuestionResponse = ({ question, answer }) => {
  const boxStyle = {
    backgroundColor: answer? 'green': 'red',
    color: '#000',
    border: `1px solid`,
    borderRadius: '10px',
    padding: '2px',
    margin: '2px',
    textAlign: 'center',
  };

  return (
    <div style={boxStyle}>
      <p>{question}</p>
    </div>
  );
};

export default QuestionResponse;
