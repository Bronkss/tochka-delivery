import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./App";
import Auth from './pages/Auth.tsx'
import "./styles/index.css"

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="auth" element={<Auth />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);
