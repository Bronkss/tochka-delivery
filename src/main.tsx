import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Auth from './pages/Auth.tsx';
import './styles/index.css';
import { Provider } from 'react-redux';
import { store } from './app/store';
import ScrollToTop from "./hooks/ScrollToTop.tsx";
import CategoryPages from "./pages/CategoryPages.tsx";

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <StrictMode>
            <BrowserRouter>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/category/:categoryId" element={<CategoryPages />} />
                </Routes>
            </BrowserRouter>
        </StrictMode>
    </Provider>
);