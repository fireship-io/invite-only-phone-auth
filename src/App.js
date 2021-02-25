import './App.css';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { useEffect, useRef, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const firebaseConfig = {
  // your config
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);
  return (
    <div className="App">
      <header className="App-header">{user ? <SendInvites user={user} /> : <SignUp />}</header>
    </div>
  );
}

function SignUp() {
  const [recaptcha, setRecaptcha] = useState(null);
  const element = useRef(null);

  useEffect(() => {
    if (!recaptcha) {

      const verifier = new firebase.auth.RecaptchaVerifier(element.current, {
        size: 'invisible',
      })

      verifier.verify().then(() => setRecaptcha(verifier));

    }
  });

  return (
    <>
      {recaptcha && <PhoneNumberVerification recaptcha={recaptcha} />}
      <div ref={element}></div>
    </>
  );
}

function PhoneNumberVerification({ recaptcha }) {
  const [digits, setDigits] = useState('');
  const [invited, setInvited] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [code, setCode] = useState('');

  const phoneNumber = `+1${digits}`;

  // Step 1 - Verify Invite
  useEffect(() => {
    if (phoneNumber.length === 12) {
      const ref = firestore.collection('invites').doc(phoneNumber);
      ref.get().then(({ exists }) => { setInvited(exists) });
    } else {
      setInvited(false);
    }
  }, [phoneNumber]);

  // Step 2 - Sign in
  const signInWithPhoneNumber = async () => {
    setConfirmationResult( await auth.signInWithPhoneNumber(phoneNumber, recaptcha) );
  };

  // Step 3 - Verify SMS code
  const verifyCode = async () => {
    const result = await confirmationResult.confirm(code);
    console.log(result.user);
  };

  return (
    <div>
      <h1>Sign Up!</h1>
      <fieldset>
        <label>10 digit US phone number</label>
        <br />
        <input value={digits} onChange={(e) => setDigits(e.target.value)} />

        <button className={!invited ? 'hide' : ''} onClick={signInWithPhoneNumber}>
          Sign In
        </button>

        {invited ? 
          <p className="success">You are one of the cool kids! 👋</p> : 
          <p className="danger">This phone number is not cool 😞</p>
          
        }  
      </fieldset>

      {confirmationResult && (
        <fieldset>
          <label>Verify code</label>
          <br />
          <input value={code} onChange={(e) => setCode(e.target.value)} />

          <button onClick={verifyCode}>Verify Code</button>
        </fieldset>
      )}
    </div>
  );
}

function SendInvites({ user }) {
  const query = firestore.collection('invites').where('sender', '==', user.uid);
  const [invites] = useCollectionData(query);

  const [digits, setDigits] = useState('');
  const phoneNumber = `+1${digits}`;

  const sendInvite = async () => {
    const inviteRef = firestore.collection('invites').doc(phoneNumber);
    await inviteRef.set({
      phoneNumber,
      sender: user.uid,
    });
  };

  return (
    <div>
      <h1>Invite your BFFs</h1>
      {invites?.map((data) => (
        <p>You invited {data?.phoneNumber}</p>
      ))}

      {invites?.length < 2 && (
        <>
          <input value={digits} onChange={(e) => setDigits(e.target.value)} />
          <button onClick={sendInvite}>Send Invite</button>
        </>
      )}

      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

export default App;
