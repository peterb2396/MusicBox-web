import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { useLocation } from 'react-router-dom';

import Login from './Login';

// Authorize with spotify
// Must display login page and redirect here when logged in.
export default function Link(props) {
    const location = useLocation();
    const [state, setState] = useState('')
    const [linked, setLinked] = useState(false)
    const [init, setInit] = useState(true)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setState(params.get('state'));
      }, [location]);

  
    
    const host = props.host
    const clientId = 'fffd853196474a44bb86a4d17717faab';
    const redirectUri = `${host}/auth-callback`;
    
    const originalPageUrl = window.location.href.substring(0, (window.location.href.indexOf('?') === -1)? window.location.href.length: window.location.href.indexOf('?'))
    const statestr = encodeURIComponent(originalPageUrl) + "uid" + sessionStorage.getItem('id')
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=user-read-currently-playing playlist-modify-public app-remote-control user-modify-playback-state&state=${statestr}`; 
        
    
    // Link or unlink
    function authenticate()
    {
      if (linked)
      {
        axios.post(`${host}/unlink`, {id: sessionStorage.getItem('id')})
        .then((res) => {
           // redirect to success
           window.location.href = window.location.href.substring(0, (window.location.href.indexOf('?') === -1)? window.location.href.length: window.location.href.indexOf('?')) + '?state=success'

        })
        .catch((e) => {
          // redirect to error
          window.location.href = window.location.href.substring(0, (window.location.href.indexOf('?') === -1)? window.location.href.length: window.location.href.indexOf('?')) + '?state=fail'
        })

      }
      else
      {
        window.location.href = authUrl;
      }
        

    }

    // When page reloads get is linked
    if (init)
    {
      setInit(false)
      axios.post(`${host}/isLinked`, {id: sessionStorage.getItem('id')})
      .then((res) => {
        setLinked(res.data)
        setLoading(false)

      })
      .catch((e) => {
        setLoading(false)
        console.log(e)
      })
    }

    // Style
    const styles = {
      container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      },
      gradientBackground: {
        // background: 'linear-gradient(#040306, #131624)',
        width: '100%',
        height: '100%',
      },
      safeArea: {
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
        padding: '20px',
        color: 'white',
      },
      title: {
        fontSize: '40px',
        fontWeight: 'bold',
        marginTop: '40px',
      },
      spotifyButton: {
        backgroundColor: linked? 'gray' : '#1DB954',
        color: 'white',
        padding: '10px 20px',
        fontSize: '1em',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        marginVertical: '10px',
      },
    };


    // If not logged in, show login window
    if (!props.token())
    {
        return <div style = {{paddingLeft: '20%', paddingRight: '20%'}}>
          <Login msg = "Please login with MusicBox first" redir = "/link/musicbox" setToken = {props.setToken} token = {props.token} host = {host}/>
        </div>
    }

    // Wait until we load account status before rendering options
    if (loading)
    {
      return (
        <div style={styles.container}>
           <div style={styles.gradientBackground}>
             <div style={styles.safeArea}>
               <div style={{ height: '80px' }} />
               <img style={{ width: '200px' }} src = "https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt = "Logo"></img>
             </div>
           </div>
         </div>
 
      )
    }

     // Check if we just authorized and were redirected here
     if (state)
     {
         return (
         <div style={styles.container}>
           <div style={styles.gradientBackground}>
             <div style={styles.safeArea}>
               <div style={{ height: '80px' }} />
               <img style={{ width: '200px' }} src = "https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt = "Logo"></img>
               <div style={styles.title}>{state === 'success'? (linked? 'Successfully Linked!': 'Successfully unlinked!'): (linked? 'Error unlinking accounts.': 'Error linking accounts.')}</div>
 
               <div>
                 <p style={{color: 'gray'}}>{state === 'success'? (linked? 'You can now connect to the setup network and complete the initialization.': ''): (linked? '' : '')}</p>
               </div>
 
               {state === 'fail' && 
               (
                 <button style={styles.spotifyButton} onClick={authenticate}>
                 Try Again
               </button>
               )}
               
             </div>
           </div>
         </div>
 
         )
     }
   
    // We are logged in and just access the page. show link or already linked
    return (
        <div style={styles.container}>
          <div style={styles.gradientBackground}>
            <div style={styles.safeArea}>
              <div style={{ height: '80px' }} />
              <img style={{ width: '200px' }} src = "https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt = "Logo"></img>
              <div style={styles.title}>Never forget that amazing new song.</div>
              <div>
                <p style={{color: 'gray'}}>{linked? 'Already linked your account!': 'Connect your Spotify account to start using MusicBox'}</p>
              </div>
              <div style={{ height: '80px' }} />
              <button style={styles.spotifyButton} onClick={authenticate}>
                {linked? 'Unlink Accounts': 'Link Accounts'}
              </button>
            </div>
          </div>
        </div>
      );
    };
    
    