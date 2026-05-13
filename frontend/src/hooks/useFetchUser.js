import { useEffect, useState } from 'react';
import api from 'api/axios';
import { useAuth } from '../context/AuthContext';

const useFetchUser = () => {
  const { user, token, setLoading } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const res = await api.get(`/users/${user.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(res.data.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  return userData;
};

export default useFetchUser;
