
import { supabase } from './supabase';

// Expo SDK 54+ reads EXPO_PUBLIC_* variables directly from process.env
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
    get: async (endpoint: string, params?: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        // Build query string
        const url = new URL(`${BACKEND_URL}${endpoint}`);
        if(params) {
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        }

        const res = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if(!res.ok) throw new Error(await res.text());
        return res.json();
    },

    post: async (endpoint: string, body: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if(!res.ok) throw new Error(await res.text());
        return res.json();
    },

    put: async (endpoint: string, body: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if(!res.ok) throw new Error(await res.text());
        return res.json();
    },
    
    delete: async (endpoint: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if(!res.ok) throw new Error(await res.text());
        return res.json();
    }
}
