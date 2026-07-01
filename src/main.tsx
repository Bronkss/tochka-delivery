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
import SearchPages from "./pages/SearchPages.tsx";
import AuthInitializer from "./components/AuthInitializer.tsx";
import Profile from './pages/Profile';

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <StrictMode>
            <BrowserRouter>
                <ScrollToTop />
                <AuthInitializer />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/account" element={<Profile />} />
                    <Route path="/category/:categoryId" element={<CategoryPages />} />
                    <Route path="/search" element={<SearchPages />} />
                </Routes>
            </BrowserRouter>
        </StrictMode>
    </Provider>
);