import { useNavigate } from 'react-router-dom';

export default function WhatIfButton() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/what-if')}>🤔 이 소비 괜찮을까?</button>
  );
}
