import { supabase } from './supabase';

export const auth = {
  uid: () => {
    return supabase.auth.getUser().then(({ data }) => data.user?.id);
  },
  
  getSession: () => {
    return supabase.auth.getSession();
  },
  
  getUser: () => {
    return supabase.auth.getUser();
  }
}; 