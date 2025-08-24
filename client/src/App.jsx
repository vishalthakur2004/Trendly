import React, { useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import ChatBox from './pages/ChatBox'
import Connections from './pages/Connections'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import Notifications from './pages/Notifications'
import CallHistory from './pages/CallHistory'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Bookmarks from './pages/Bookmarks'
import {useUser, useAuth} from '@clerk/clerk-react'
import Layout from './pages/Layout'
import toast, {Toaster} from 'react-hot-toast'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUser } from './features/user/userSlice'
import { fetchConnections } from './features/connections/connectionsSlice'
import { addMessage } from './features/messages/messagesSlice'
import {
  setIncomingCall,
  setCurrentCall,
  setCallActive,
  setCallStatus,
  setParticipants,
  addParticipant,
  removeParticipant,
  endCall as endCallAction
} from './features/calls/callsSlice'
import Notification from './components/Notification'
import CallInterface from './components/CallInterface'
import CallingScreen from './components/CallingScreen'
import IncomingCallScreen from './components/IncomingCallScreen'
import socketService from './services/socketService'
import webrtcService from './services/webrtcService'

const App = () => {
  // Safe Clerk hooks usage with fallback
  let user, getToken

  try {
    const clerkUser = useUser()
    const clerkAuth = useAuth()

    if (clerkUser && clerkAuth) {
      user = clerkUser.user
      getToken = clerkAuth.getToken
    } else {
      // Fallback for development without Clerk
      user = {
        id: 'dev_user_123',
        firstName: 'Dev',
        lastName: 'User',
        emailAddresses: [{ emailAddress: 'dev@example.com' }]
      }
      getToken = async () => 'dev_token_123'
    }
  } catch (error) {
    // Fallback when Clerk is not available
    console.log('Clerk not available, using development mode')
    user = {
      id: 'dev_user_123',
      firstName: 'Dev',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'dev@example.com' }]
    }
    getToken = async () => 'dev_token_123'
  }

  const {pathname} = useLocation()
  const pathnameRef = useRef(pathname)

  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.user.value)
  const { isCallActive } = useSelector((state) => state.calls)

  useEffect(()=>{
    const fetchData = async () => {
      if(user){
      const token = await getToken()
      dispatch(fetchUser(token))
      dispatch(fetchConnections(token))
      }
    }
    fetchData()

  },[user, getToken, dispatch])

  useEffect(()=>{
    pathnameRef.current = pathname
  },[pathname])

  // Socket.io and WebRTC setup
  useEffect(() => {
    if (user && currentUser) {
      // Connect to socket
      socketService.connect(currentUser._id);

      // Setup call event listeners
      socketService.onIncomingCall((data) => {
        console.log('Incoming call:', data);
        dispatch(setIncomingCall(data));
      });

      socketService.onCallAccepted((data) => {
        console.log('Call accepted:', data);
        const callData = {
          call_id: data.callId,
          call_type: 'voice', // This should come from the call data
          participants: [currentUser, data.acceptedBy],
          status: 'active',
          is_group_call: false
        };

        dispatch(setCurrentCall(callData));
        dispatch(setParticipants([currentUser, data.acceptedBy]));
        dispatch(setCallActive(true));
        dispatch(setCallStatus('active'));

        toast.success('Call connected!');
      });

      socketService.onCallDeclined((data) => {
        console.log('Call declined:', data);
        dispatch(endCallAction());
        toast.info(`${data.declinedBy.full_name} declined the call`);
      });

      socketService.onCallEnded((data) => {
        console.log('Call ended:', data);
        dispatch(endCallAction());
        webrtcService.closeAllConnections();
        toast.info('Call ended');
      });

      // WebRTC signaling events
      socketService.onWebRTCOffer(async (data) => {
        console.log('Received WebRTC offer:', data);
        try {
          await webrtcService.handleOffer(
            data.fromUserId,
            data.offer,
            socketService,
            data.callId
          );
        } catch (error) {
          console.error('Error handling WebRTC offer:', error);
        }
      });

      socketService.onWebRTCAnswer(async (data) => {
        console.log('Received WebRTC answer:', data);
        try {
          await webrtcService.handleAnswer(data.fromUserId, data.answer);
        } catch (error) {
          console.error('Error handling WebRTC answer:', error);
        }
      });

      socketService.onWebRTCIceCandidate(async (data) => {
        console.log('Received ICE candidate:', data);
        try {
          await webrtcService.handleIceCandidate(data.fromUserId, data.candidate);
        } catch (error) {
          console.error('Error handling ICE candidate:', error);
        }
      });

      socketService.onParticipantJoined((data) => {
        console.log('Participant joined:', data);
        dispatch(addParticipant(data.newParticipant));
        toast.info(`${data.newParticipant.full_name} joined the call`);
      });

      socketService.onParticipantDisconnected((data) => {
        console.log('Participant disconnected:', data);
        dispatch(removeParticipant(data.disconnectedUserId));
        webrtcService.closePeerConnection(data.disconnectedUserId);
      });

      socketService.onAddedToCall((data) => {
        console.log('Added to call:', data);
        // Handle being added to a group call
        const callData = {
          call_id: data.callId,
          call_type: data.callType,
          participants: data.participants,
          status: 'active',
          is_group_call: true
        };

        dispatch(setCurrentCall(callData));
        dispatch(setCallActive(true));
        dispatch(setCallStatus('active'));

        toast.success('You were added to a call!');
      });

      return () => {
        socketService.removeAllListeners();
        socketService.disconnect();
        webrtcService.closeAllConnections();
      };
    }
  }, [user, currentUser, dispatch]);

  useEffect(()=>{
    if(user){
      const eventSource = new EventSource(import.meta.env.VITE_BASEURL + '/api/message/' + user.id);

      eventSource.onmessage = (event)=>{
        const message = JSON.parse(event.data)

        if(pathnameRef.current === ('/messages/' + message.from_user_id._id)){
          dispatch(addMessage(message))
        }else{
          toast.custom((t)=>(
            <Notification t={t} message={message}/>
          ), {position: "bottom-right"})
        }
      }
      return ()=>{
        eventSource.close()
      }
    }
  },[user, dispatch])
  
  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={ !user ? <Login /> : <Layout/>}>
          <Route index element={<Feed/>}/>
          <Route path='messages' element={<Messages/>}/>
          <Route path='messages/:userId' element={<ChatBox/>}/>
          <Route path='connections' element={<Connections/>}/>
          <Route path='discover' element={<Discover/>}/>
          <Route path='notifications' element={<Notifications/>}/>
          <Route path='profile' element={<Profile/>}/>
          <Route path='profile/:profileId' element={<Profile/>}/>
          <Route path='create-post' element={<CreatePost/>}/>
          <Route path='call-history' element={<CallHistory/>}/>
          <Route path='groups' element={<Groups/>}/>
          <Route path='groups/:groupId' element={<GroupDetail/>}/>
          <Route path='bookmarks' element={<Bookmarks/>}/>
        </Route>
      </Routes>

      {/* Call Components */}
      {user && (
        <>
          <IncomingCallScreen />
          <CallingScreen />
          {isCallActive && <CallInterface />}
        </>
      )}
    </>
  )
}

export default App
