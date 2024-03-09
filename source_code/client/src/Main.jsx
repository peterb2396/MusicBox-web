import React, { useState, useEffect } from 'react';
import QuestionResponse from './QuestionResponse';
import Rule from './Rule';
import axios from 'axios'

const Main = () => {
  // User can change this in the application
  const defaultIP = 'localhost'

  const [textInput, setTextInput] = useState('');
  const [fileLineComps, setFileLineComps] = useState([]);
  const [components, setComponents] = useState([]);
  const [lastQuestion, setLastQuestion] = useState('');
  const [headerColor, setHeaderColor] = useState('black')
  const [headerTxt, setHeaderTxt] = useState('Waiting for player to guess number');
  const [NODE_IP, setNodeIp] = useState((localStorage.getItem('ip') && localStorage.getItem('ip') !== 'undefined')? localStorage.getItem('ip') : defaultIP)
  const [ipText, setIPText] = useState(NODE_IP)
  const [conn, setConn] = useState(false)
  const [ready, setReady] = useState(false)
  
  const [ws, setWs] = useState(null); // State to hold WebSocket instance

  // Ensure these match the ports in the Node server and the Unity client
  const SOCK_PORT = 2174;
  const NODE_PORT = 2175
  const SERVER_URL = `http://${NODE_IP}:${NODE_PORT}`
  
  document.body.style = 'background: #f2f2f2';

  // Setup websocket: React--Node communication
  // Occurs on refresh / first load
  useEffect(() => {
    // Reach the WebSocket hosted on the Node.js server
    const newWs = new WebSocket(`ws://${NODE_IP}:${SOCK_PORT}`);
    setWs(newWs);

    newWs.onopen = () => {
      console.log('Connected to Node.js WebSocket');
    };

    axios.get(`${SERVER_URL}/getRules`)
    .then((res) => {
      setFileLineComps(prevComps => {
        return res.data.map(rule => <Rule key={rule.id} rule={rule} />);
      });

      setConn(true)
      setReady(true)
    }
    
    )
    .catch((e) => {
      // Can't reach server: used to display enter ip page
      setConn(false)
      setReady(true)

    })
    

    return () => {
      newWs.close();
    };
  }, [SERVER_URL, NODE_IP]);

  if (ws)
  {
    ws.onerror = (e) => {
      setConn(false)
    }
    ws.onclose = (e) => {
      setConn(false)
    }

    /**
     * A message was recieved from the Unity User.
     * It was either a Y/N answer to our question,
     * or a true/false of did they guess correct.
     * 
     * @param {Message String} event 
     */
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
        if (event.data === "true")
        {
          // Clear the YN questions, they got it right
          setHeaderTxt("The player picked the correct number!");
          setHeaderColor('green')

          setComponents([])

          // Refresh rules to uncheck them all
          axios.get(`${SERVER_URL}/getRules`).then((res) => {
            setFileLineComps(prevComps => {
              return res.data.map(rule => <Rule key={rule.id} rule={rule} />);
            });
          })
          .catch((e)=> {
            setHeaderColor('red')
            setHeaderTxt('Network Error while refreshing rules')
          })
          
          
        }
        else
        {
          setHeaderTxt("The player picked the wrong number!");
          setHeaderColor('red')
        }
      

      }
      
    }; 

  }
  
  // change and join the typed server ip
  function setServerIP()
  {
    let ip = document.getElementById('ipEntry').value
    localStorage.setItem('ip', ip); 
    setNodeIp(ip)
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

  // wait to return until we're ready
  if (!ready)
  {
    return (<p></p>)
  }

  // Failed to connect to the server
  if (!conn)
  {
    // Failed to connect
    return (
      <div style={centeredContainerStyles}>
      <h1>Failed to Connect</h1>
      <div style={textInputContainerStyles}>
          <label htmlFor="ipField">Server IP: </label>
          <input 
            type="text" 
            id="ipEntry"
            value={ipText}
            onChange={(e)=> setIPText(e.target.value)} 
            placeholder="Enter server address..." 
          />
          <button onClick={setServerIP}>Connect</button>
      </div>
    </div>
    )
  }
  // Connected successfully to the server
  return (
    <div style = {{flex: 1, flexDirection: 'column'}}>
      <p style = {{color: headerColor, textAlign: 'center'}}>
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

const centeredContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  margin: 0,
  padding: 0,
};

const textInputContainerStyles = {
  marginTop: '20px',
  display: 'flex',
  flexDirection: 'column'
};

export default Main;
