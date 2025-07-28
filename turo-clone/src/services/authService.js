import { apiRequest } from './api.js';

const AUTH_TOKEN_KEY = 'turo_clone_auth_token';
const USER_DATA_KEY = 'turo_clone_user_data';

export async function register(userData) {
    try {
        const response = await apiRequest('/auth/register', 'POST', userData, false);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function login(email, password) {
    try {
        const response = await apiRequest('/auth/login', 'POST', { email, password }, false);
        
        // Guardar token y datos de usuario
        setUserData(response.user); // <-- GUARDA el usuario
        setAuthToken(response.token); // <-- GUARDA el token
        
        return response.user;
    } catch (error) {
        throw error;
    }
}

export function logout() {
    removeAuthToken();
    removeUserData();
}

export function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getUserData() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

export function setUserData(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

export function removeUserData() {
    localStorage.removeItem(USER_DATA_KEY);
}

export async function verifyAuth() {
    const token = getAuthToken();
    if (!token) return false;

    try {
        const response = await apiRequest('/auth/verify-token', 'POST', { token }, false);
        return response.valid;
    } catch (error) {
        return false;
    }
}

