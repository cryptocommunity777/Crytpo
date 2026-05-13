import React from 'react';

const TreeNode = ({ user }) => {
  return (
    <li>
      <div style={{
        background: '#2a9d8f',
        color: 'white',
        padding: '8px 12px',
        borderRadius: 6,
        marginBottom: 6,
        fontWeight: 600,
      }}>
        {user.name} (ID: {user.userId}) - Level {user.level}
      </div>
      {user.children && user.children.length > 0 && (
        <ul style={{ paddingLeft: 20, listStyle: 'none', borderLeft: '2px solid #ccc', marginTop: 6 }}>
          {user.children.map((child) => (
            <TreeNode key={child.userId} user={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

const ReferralTreeView = ({ rootUser }) => {
  if (!rootUser) return <p>Loading tree...</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Referral Tree</h2>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        <TreeNode user={rootUser} />
      </ul>
    </div>
  );
};

export default ReferralTreeView;
