import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegisterUI from './RegisterUI';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Player');

  // Franchise specific parameters (only for Owners)
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [vibe, setVibe] = useState('Fearless');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        username,
        email,
        password,
        role,
        ...(role === 'Owner' && {
          teamName,
          teamLogo,
          vibe,
          primaryColor,
        }),
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      login(data.token, data.user);
      
      // If owner, show logo generation alert or navigate directly
      if (role === 'Owner' && data.user.imageGeneratorPrompt) {
        alert(`AI Generated Team Motto Slogan:\n"${data.user.teamSlogan}"\n\nAI Emblem prompt has been registered for your franchise!`);
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterUI
      username={username}
      setUsername={setUsername}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      role={role}
      setRole={setRole}
      teamName={teamName}
      setTeamName={setTeamName}
      teamLogo={teamLogo}
      setTeamLogo={setTeamLogo}
      vibe={vibe}
      setVibe={setVibe}
      primaryColor={primaryColor}
      setPrimaryColor={setPrimaryColor}
      error={error}
      loading={loading}
      handleSubmit={handleSubmit}
    />
  );
};

export default Register;
