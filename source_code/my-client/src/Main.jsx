import React, { useState, useEffect } from 'react';
import QuestionResponse from './QuestionResponse';
import Rule from './Rule';
import axios from 'axios'

const Main = () => {
  const [textInput, setTextInput] = useState('');
  const [fileLineComps, setFileLineComps] = useState([]);
  const [components, setComponents] = useState([]);
  const [lastQuestion, setLastQuestion] = useState('');
  const [headerColor, setHeaderColor] = useState('black')
  const [headerTxt, setHeaderTxt] = useState('Waiting for player to guess number');

  const [ws, setWs] = useState(null); // State to hold WebSocket instance
  const SOCK_PORT = 2173;
  const NODE_PORT = 3001
  const SERVER_URL = `http://localhost:${NODE_PORT}`
  
  document.body.style = 'background: #f2f2f2';
  // Setup websocket: React--Node communication
  useEffect(() => {
    const newWs = new WebSocket(`ws://localhost:${SOCK_PORT}`);
    setWs(newWs);

    newWs.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    axios.get(`${SERVER_URL}/getRules`).then((res) => {
      setFileLineComps(prevComps => {
        return res.data.map(rule => <Rule key={rule.id} rule={rule} />);
      });
    });

    return () => {
      newWs.close();
    };
  }, [SERVER_URL]);

  if (ws)
  {
    ws.onmessage = (event) => {
      if (event.data === "Yes" || event.data === "No")
      {
        // Make sure i asked a question first
        if (lastQuestion)
        {
          const newComponent = <QuestionResponse question={lastQuestion} answer = {event.data === "Yes"? true: false}></QuestionResponse>
          setComponents([...components, newComponent]);
          setLastQuestion('')
        }

      }
      else // They submitted an answer!
      {
        let parts = event.data.split(',')
        let answer = parts[0]
        let question = parts[1]
        let correct = check(question, answer)
        

        


        if (correct)
        {
          // Clear the screen, they got it right
          setHeaderTxt("The player picked the correct number!");
          setHeaderColor('green')

          setComponents([])
          // Refresh rules
          axios.get(`${SERVER_URL}/getRules`).then((res) => {
            setFileLineComps(prevComps => {
              return res.data.map(rule => <Rule key={rule.id} rule={rule} />);
            });
          });
          
          
        }
        else
        {
          setHeaderTxt("The player picked the wrong number!");
          setHeaderColor('red')
        }
      
        ws.send(correct? "true": "false");

      }
      // See if they submitted the question
      
    }; 

  }

  function check(q, a)
  {
    // Check conditions
    // First and last digit are equal, swap the middle two
    if (q.charAt(0) === q.charAt(3) && a.charAt(0) === a.charAt(3) 
    &&  a.charAt(0) === q.charAt(0) && a.charAt(3) === q.charAt(3)
    && a.charAt(1) === q.charAt(2) && a.charAt(2) === q.charAt(1)) return true;

    // All numbers are even, reverse the code
    if (areAllDigitsEven(q) && q === a.split('').reverse().join('') === q) return true;

    // If all but one numbers are odd, the code is 1234
    if (countOddDigits(q) === 3 && a === "1234") return true




    // If no rules apply, the code is 0000
    if (a === "0000") return true

    return false
        
        
  }

  function countOddDigits(str) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      // Check if the character is a digit and if it's odd
      if (!isNaN(parseInt(char)) && parseInt(char) % 2 !== 0) {
        count++; // Increment count if the digit is odd
      }
    }
    return count;
  }

  function areAllDigitsEven(str) {
    // Loop through each character in the string
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      // Check if the character is a digit and if it's even
      if (!isNaN(parseInt(char)) && parseInt(char) % 2 !== 0) {
        return false; // Return false if any digit is not even
      }
    }
    return true; // Return true if all digits are even
  }
  

  // Function to handle submitting the text input
  const handleSubmit = () => {
    if (textInput.trim() !== '' && ws) {
      // Send the entered text to the WebSocket server
      // This message will be a full question, from control room, node will forward to unity
      ws.send(textInput);
      setLastQuestion(textInput);
      setTextInput('');
    }
  };


  return (
    <div style = {{flex: 1, flexDirection: 'column'}}>
      <p style = {{textAlign: 'center', color: headerColor}}>
        {headerTxt}
      </p>

    
    <div style={{ display: 'flex', margin: '10px'}}>
      
      {/* Left side with text input and submit button */}
      <div>
      <div style={{ flex: 1,  flexDirection: 'column', marginRight: '10px' }}>
        <textarea
          style={{ marginBottom: 10, padding: '10px', borderRadius: '10px', width: '100%' }} // Set textarea width to 100%
          rows={10}
          cols={50}
          placeholder="Ask a question..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
        <button
          style={{ backgroundColor: '#4caf50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%' }} // Set button width to 100%
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>

        {/* Scroll box with Q/A */}
        <div style = {{overflowY: 'auto'}}>
          {components}
        </div>

      </div>
      {/* Right side with file lines */}
      <div style={{marginLeft: '20px', flex: 1, border: '1px solid black', borderRadius: 5, padding: 5, overflowY: 'auto' }}>
        {fileLineComps}
      </div>
    </div>
    </div>
  );
};

export default Main;
