// import { useState, useEffect } from "react";
// import "./App.css";
// import Home from "./Components/Home/Home";
// import Login from "./Components/Login/Login";
// import Register from "./Components/Register/Register";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
// } from "react-router-dom";
// import { GoogleOAuthProvider } from '@react-oauth/google';

// function App() {
//   // Get the user from localStorage if it exists
//   const storedUser = JSON.parse(localStorage.getItem("user"));

//   // Initialize state with the stored user, if available
//   const [userState, setUserState] = useState(storedUser);

//   // Whenever the userState changes, update localStorage
//   useEffect(() => {
//     if (userState) {
//       localStorage.setItem("user", JSON.stringify(userState));
//     } else {
//       localStorage.removeItem("user");
//     }
//   }, [userState]);

//   return (
//     <GoogleOAuthProvider clientId="802852813018-k29a6gd2rd0e71na3umbjnjfdgiqorak.apps.googleusercontent.com">
//       <div className="App">
//         <Router>
//           <Routes>
//             <Route
//               path="/home"
//               element={
//                 userState ? (
//                   <Home setUserState={setUserState} user={userState} />
//                 ) : (
//                   <Login setUserState={setUserState} />
//                 )
//               }
//             />
//             <Route
//               path="/login"
//               element={<Login setUserState={setUserState} />}
//             />
//             <Route path="/register" element={<Register />} />
//           </Routes>
//         </Router>
//       </div>
//     </GoogleOAuthProvider>
//   );
// }

// export default App;

import { useState, useEffect } from "react";
import "./App.css";
import Home from "./Components/Home/Home";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [userState, setUserState] = useState(storedUser);

  useEffect(() => {
    if (userState) {
      localStorage.setItem("user", JSON.stringify(userState));
    } else {
      localStorage.removeItem("user");
    }
  }, [userState]);

  return (
    <GoogleOAuthProvider clientId="802852813018-k29a6gd2rd0e71na3umbjnjfdgiqorak.apps.googleusercontent.com">
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route
              path="/home"
              element={
                userState ? (
                  <Home setUserState={setUserState} user={userState} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/login"
              element={<Login setUserState={setUserState} />}
            />
            <Route path="/register" element={<Register setUserState={setUserState} />} />
          </Routes>
        </Router>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;