import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Payments = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [selectedMethod, setSelectedMethod] = useState('telebirr');
  const [copied, setCopied] = useState('');

  // Live data from the backend
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
  const [registrationFee, setRegistrationFee] = useState(200);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // ─── Fallback data (used only if the backend is unreachable) ───
  const FALLBACK_PLANS = [
    { id: 'monthly',   name: 'Monthly',   price: 1500,  days: 30,  popular: false },
    { id: 'quarterly', name: 'Quarterly', price: 4000,  days: 90,  popular: true  },
    { id: 'yearly',    name: 'Yearly',    price: 15000, days: 365, popular: false },
  ];

  const FALLBACK_METHODS = [
    {
      id: 'telebirr',
      name: 'Telebirr',
      shortName: 'Telebirr',
      icon: '📱',
      tagline: 'Ethio Telecom mobile money',
      accountLabel: 'Phone Number',
      account: '+251 921 639 261',
      holder: 'Meskaye Hizunan Medhanealem Monastery School',
      extra: 'Open Telebirr app → Send Money → Enter the phone number above',
      color: '#00a651',
    },
    {
      id: 'cbe',
      name: 'Commercial Bank of Ethiopia',
      shortName: 'CBE',
      icon: '🏦',
      tagline: 'Commercial Bank of Ethiopia',
      accountLabel: 'Account Number',
      account: '1000 2134 7239 2',
      holder: 'Meskaye Hizunan Medhanealem Monastery School',
      extra: 'Use CBE Birr or visit any CBE branch to deposit',
      color: '#6c2d91',
    },
    {
      id: 'abyssinia',
      name: 'Bank of Abyssinia',
      shortName: 'Abyssinia',
      icon: '🏛️',
      tagline: 'Bank of Abyssinia',
      accountLabel: 'Account Number',
      account: '117871509',
      holder: 'Meskaye Hizunan Medhanealem Monastery School',
      extra: 'Use Abyssinia Mobile Banking or visit any branch',
      color: '#f6a800',
    },
    {
      id: 'bunna',
      name: 'Bunna Bank',
      shortName: 'Bunna',
      icon: '☕',
      tagline: 'Bunna International Bank',
      accountLabel: 'Account Number',
      account: 'Contact school for Bunna account',
      holder: 'Meskaye Hizunan Medhanealem Monastery School',
      extra: 'Please contact the school administrator for the Bunna Bank account number',
      color: '#8b4513',
    },
    {
      id: 'nisir',
      name: 'Nisir Microfinance',
      shortName: 'Nisir',
      icon: '💰',
      tagline: 'Nisir Microfinance Institution',
      accountLabel: 'Account Number',
      account: 'Contact school for Nisir account',
      holder: 'Meskaye Hizunan Medhanealem Monastery School',
      extra: 'Please contact the school administrator for the Nisir account number',
      color: '#0d7377',
    },
  ];

  // Emojis per method — kept on the frontend since the backend response is emoji-free
  const METHOD_ICONS = {
    telebirr: '📱',
    cbe: '🏦',
    abyssinia: '🏛️',
    bunna: '☕',
    nisir: '💰',
  };

  // ─── Fetch plans + methods from the backend on mount ───
  useEffect(() => {
    let cancelled = false;

    const fetchPaymentData = async () => {
      try {
        const res = await api.get('/payments/methods');
        if (cancelled) return;

        const data = res.data || {};

        // Merge backend data with frontend-only fields (icons)
        const incomingPlans = Array.isArray(data.plans) ? data.plans : [];
        const incomingMethods = Array.isArray(data.methods) ? data.methods : [];

        setPlans(incomingPlans.length ? incomingPlans : FALLBACK_PLANS);
        setMethods(
          incomingMethods.length
            ? incomingMethods.map((m) => ({
                ...m,
                icon: m.icon || METHOD_ICONS[m.id] || '💳',
              }))
            : FALLBACK_METHODS
        );
        setRegistrationFee(
          typeof data.registrationFee === 'number' ? data.registrationFee : 200
        );

        // Default the selected plan to the first one if the current selection doesn't exist
        if (incomingPlans.length && !incomingPlans.find((p) => p.id === selectedPlan)) {
          setSelectedPlan(incomingPlans[0].id);
        }
        if (incomingMethods.length && !incomingMethods.find((m) => m.id === selectedMethod)) {
          setSelectedMethod(incomingMethods[0].id);
        }

        setApiError('');
      } catch (err) {
        if (cancelled) return;
        console.warn('Could not load payment methods from API, using fallback:', err.message);
        setPlans(FALLBACK_PLANS);
        setMethods(FALLBACK_METHODS);
        setRegistrationFee(200);
        setApiError('Could not reach the server. Showing cached payment information.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPaymentData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = plans.find((p) => p.id === selectedPlan) || plans[0] || { name: '—', price: 0, days: 0 };
  const total = (plan.price || 0) + registrationFee;
  const activeMethod = methods.find((m) => m.id === selectedMethod) || methods[0] || null;

  const handleCopy = (text) => {
    const clean = text.replace(/\s+/g, '');
    navigator.clipboard.writeText(clean).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    }).catch(() => {
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <div style={{ padding: '24px', minHeight: '100%' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#fdfaf6',
            border: '2px solid #d4af37',
            borderRadius: '16px',
            color: '#8e1616',
            fontWeight: 700,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💳</div>
            Loading payment methods…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', minHeight: '100%' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* HEADER */}
        <div
          style={{
            marginBottom: '24px',
            padding: '20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #8e1616 0%, #4a0000 100%)',
            border: '3px solid #d4af37',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '3rem', color: 'rgba(255,215,0,0.15)', pointerEvents: 'none' }}>⳩</div>
          <div style={{ position: 'absolute', bottom: '8px', left: '12px', fontSize: '3rem', color: 'rgba(255,215,0,0.15)', pointerEvents: 'none' }}>☦</div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', textShadow: '2px 2px 6px rgba(0,0,0,0.7)', margin: 0 }}>
              💳 Subscription Plans
            </h1>
            <p style={{ color: '#ffd700', fontWeight: 600, marginTop: '6px', margin: 0 }}>
              Choose a plan and pay using your preferred method
            </p>
          </div>
        </div>

        {/* API warning (only shows if backend was unreachable) */}
        {apiError && (
          <div style={{
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#856404',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}>
            ⚠️ {apiError}
          </div>
        )}

        {/* REGISTRATION FEE */}
        <div style={{ background: '#fff8e1', border: '2px solid #d4af37', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>📋</div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, color: '#8e1616', fontSize: '1rem' }}>One-Time Registration Fee</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#555' }}>
              A registration fee of <strong style={{ color: '#8e1616' }}>{registrationFee} ETB</strong> applies for new students.
            </p>
          </div>
        </div>

        {/* PLAN CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                style={{
                  padding: '24px 20px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  background: '#fdfaf6',
                  border: isSelected ? '4px solid #8e1616' : '2px solid #d4af37',
                  boxShadow: isSelected ? '0 12px 40px rgba(142, 22, 22, 0.3)' : '0 4px 20px rgba(142, 22, 22, 0.1)',
                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
              >
                {p.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #ffd700, #d4af37)', color: '#4a0000', padding: '4px 16px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)' }}>
                    ⭐ POPULAR
                  </div>
                )}
                <h3 style={{ margin: '8px 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#8e1616' }}>{p.name}</h3>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#8e1616' }}>{p.price.toLocaleString()}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8e1616' }}>ETB</span>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#666' }}>{p.days} days access</p>
                {isSelected && (
                  <div style={{ marginTop: '16px', textAlign: 'center', padding: '6px 12px', background: 'linear-gradient(135deg, #ffd700, #d4af37)', color: '#4a0000', fontSize: '0.75rem', fontWeight: 700, borderRadius: '999px' }}>
                    ✓ Selected
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PAYMENT SUMMARY */}
        <div style={{ background: '#fdfaf6', border: '2px solid #d4af37', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 700, color: '#8e1616' }}>🧾 Payment Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '0.9rem', color: '#555' }}>
            <span>{plan.name} Subscription ({plan.days} days)</span>
            <span style={{ fontWeight: 700 }}>{plan.price.toLocaleString()} ETB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '0.9rem', color: '#555' }}>
            <span>Registration Fee (one-time)</span>
            <span style={{ fontWeight: 700 }}>{registrationFee} ETB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0 0' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8e1616' }}>Total:</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8e1616' }}>{total.toLocaleString()} ETB</span>
          </div>
        </div>

        {/* PAYMENT METHOD */}
        <div style={{ background: '#fdfaf6', border: '2px solid #d4af37', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ margin: 0, marginBottom: '16px', fontSize: '1.25rem', fontWeight: 700, color: '#8e1616', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏦 Choose Payment Method
          </h2>

          {/* Method tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {methods.map((m) => {
              const isActive = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    background: isActive ? 'linear-gradient(135deg, #8e1616, #4a0000)' : '#ffffff',
                    color: isActive ? '#ffd700' : '#8e1616',
                    border: isActive ? '3px solid #d4af37' : '2px solid #d4af37',
                    boxShadow: isActive ? '0 6px 20px rgba(142, 22, 22, 0.4)' : '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '1.75rem' }}>{m.icon}</span>
                  <span>{m.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Active method details */}
          {activeMethod && (
            <div
              style={{
                background: '#ffffff',
                border: `3px solid ${activeMethod.color}`,
                borderRadius: '16px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '2.5rem', padding: '8px 12px', background: `${activeMethod.color}20`, borderRadius: '12px' }}>
                  {activeMethod.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: activeMethod.color }}>
                    {activeMethod.name}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                    {activeMethod.tagline}
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: '#fff8e1',
                  border: `3px dashed ${activeMethod.color}`,
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, letterSpacing: '1px', marginBottom: '8px' }}>
                  {activeMethod.accountLabel.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#8e1616',
                    letterSpacing: '2px',
                    wordBreak: 'break-all',
                    marginBottom: '8px',
                  }}
                >
                  {activeMethod.account}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>
                  {activeMethod.holder}
                </div>

                <button
                  onClick={() => handleCopy(activeMethod.account)}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: copied === activeMethod.account
                      ? 'linear-gradient(135deg, #4caf50, #2e7d32)'
                      : 'linear-gradient(135deg, #ffd700, #d4af37)',
                    color: copied === activeMethod.account ? '#ffffff' : '#4a0000',
                    border: '2px solid #b8941f',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied === activeMethod.account ? '✓ Copied!' : '📋 Copy Account Number'}
                </button>
              </div>

              <div
                style={{
                  background: '#ffebee',
                  border: '2px solid #c62828',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: '#c62828', fontSize: '1rem' }}>
                  💰 Amount to send: <strong>{total.toLocaleString()} ETB</strong>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#8e1616' }}>
                  ({plan.price.toLocaleString()} ETB plan + {registrationFee} ETB registration)
                </p>
              </div>

              <div
                style={{
                  background: `${activeMethod.color}10`,
                  borderLeft: `4px solid ${activeMethod.color}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  color: '#555',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: activeMethod.color }}>ℹ️ How to pay:</strong>
                <div style={{ marginTop: '6px' }}>{activeMethod.extra}</div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  padding: '14px 16px',
                  background: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  color: '#856404',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                ⏳ After sending payment, please contact the school administrator with the transaction reference to activate your account.
              </div>
            </div>
          )}

          <div style={{ marginTop: '32px', textAlign: 'center', paddingTop: '16px', borderTop: '2px solid rgba(212, 175, 55, 0.3)' }}>
            <p style={{ fontSize: '1.5rem', color: '#d4af37', letterSpacing: '6px', margin: 0 }}>✠ ☧ ☦ ✠</p>
            <p style={{ fontSize: '0.85rem', color: '#8e1616', fontWeight: 700, marginTop: '8px', margin: 0 }}>
              የምስካዬ ኅዙናን መድሃኒዓለም ገዳም ትምህርት ቤት
            </p>
            <p style={{ fontSize: '0.75rem', color: '#d4af37', fontWeight: 600, marginTop: '4px', margin: 0 }}>
              • በእግዚአብሔር ተስፋ አለን •
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;