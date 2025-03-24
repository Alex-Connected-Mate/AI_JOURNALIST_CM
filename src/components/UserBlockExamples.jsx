const React = require('react');
const UserBlock = require('./UserBlock');

/**
 * UserBlockExamples Component
 * 
 * Showcases different variations of the UserBlock component
 * for different anonymity levels and configurations.
 */
const UserBlockExamples = () => {
  // Sample data for different user types
  const sampleUsers = {
    identified: [
      {
        name: 'John Doe',
        profileImage: '/images/profile-placeholder-1.jpg',
        id: 'john.doe'
      },
      {
        name: 'Sarah Smith',
        profileImage: '/images/profile-placeholder-2.jpg',
        id: 'sarah.smith'
      }
    ],
    semiAnonymous: [
      {
        name: 'JazzCat',
        emoji: '🎷',
        color: '#EAAEFF',
        id: 'jazz123'
      },
      {
        name: 'StarGazer',
        emoji: '🌟',
        color: '#FFD166',
        id: 'star456'
      }
    ],
    anonymous: [
      {
        emoji: '😶‍🌫️',
        color: '#06D6A0',
        id: '3825'
      },
      {
        emoji: '🦊',
        color: '#118AB2',
        id: '7942'
      }
    ],
    fullyAnonymous: [
      {
        emoji: '🐼',
        color: '#EF476F',
        id: 'Cl/16/12'
      },
      {
        emoji: '🦄',
        color: '#073B4C',
        id: 'Me/03/05'
      }
    ]
  };

  return (
    <div className="p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">UserBlock Examples</h1>
      
      {/* Identified Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Identified Users</h2>
        <div className="flex gap-4 flex-wrap">
          {sampleUsers.identified.map((user, index) => (
            <UserBlock
              key={`identified-${index}`}
              type="identified"
              name={user.name}
              profileImage={user.profileImage}
              id={user.id}
              onClick={() => console.log(`Clicked on ${user.name}`)}
            />
          ))}
          <UserBlock
            type="identified"
            name="Alex Wong"
            profileImage="/images/profile-placeholder-3.jpg"
            size="small"
          />
          <UserBlock
            type="identified"
            name="Maria Garcia"
            profileImage="/images/profile-placeholder-4.jpg"
            size="large"
          />
        </div>
      </div>
      
      {/* Semi-Anonymous Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Semi-Anonymous Users</h2>
        <div className="flex gap-4 flex-wrap">
          {sampleUsers.semiAnonymous.map((user, index) => (
            <UserBlock
              key={`semi-${index}`}
              type="semi-anonymous"
              name={user.name}
              emoji={user.emoji}
              color={user.color}
              id={user.id}
              onClick={() => console.log(`Clicked on ${user.name}`)}
            />
          ))}
          <UserBlock
            type="semi-anonymous"
            name="SkyRunner"
            emoji="🏃"
            color="#06D6A0"
            size="small"
          />
          <UserBlock
            type="semi-anonymous"
            name="MoonWalker"
            emoji="🌙"
            color="#118AB2"
            size="large"
          />
        </div>
      </div>
      
      {/* Anonymous Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Anonymous Users</h2>
        <div className="flex gap-4 flex-wrap">
          {sampleUsers.anonymous.map((user, index) => (
            <UserBlock
              key={`anon-${index}`}
              type="anonymous"
              emoji={user.emoji}
              color={user.color}
              id={user.id}
              onClick={() => console.log(`Clicked on anonymous user #${user.id}`)}
            />
          ))}
          <UserBlock
            type="anonymous"
            emoji="🦁"
            color="#EF476F"
            id="4831"
            size="small"
          />
          <UserBlock
            type="anonymous"
            emoji="🐯"
            color="#073B4C"
            id="9257"
            size="large"
          />
        </div>
      </div>
      
      {/* Fully Anonymous Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Fully Anonymous Users</h2>
        <div className="flex gap-4 flex-wrap">
          {sampleUsers.fullyAnonymous.map((user, index) => (
            <UserBlock
              key={`fully-${index}`}
              type="fully-anonymous"
              emoji={user.emoji}
              color={user.color}
              id={user.id}
              onClick={() => console.log(`Clicked on fully anonymous user ${user.id}`)}
            />
          ))}
          <UserBlock
            type="fully-anonymous"
            emoji="🦁"
            color="#EF476F"
            id="Br/27/09"
            size="small"
          />
          <UserBlock
            type="fully-anonymous"
            emoji="🐯"
            color="#073B4C"
            id="Js/14/02"
            size="large"
            enableColors={false}
          />
        </div>
      </div>
      
      {/* No Colors Example */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Without Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <UserBlock
            type="semi-anonymous"
            name="NoColor"
            emoji="🎨"
            enableColors={false}
            id="nocolor123"
          />
          <UserBlock
            type="anonymous"
            emoji="⚫"
            enableColors={false}
            id="1234"
          />
          <UserBlock
            type="fully-anonymous"
            emoji="◼️"
            enableColors={false}
            id="Ab/12/34"
          />
        </div>
      </div>
    </div>
  );
};

module.exports = UserBlockExamples; 