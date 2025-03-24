const React = require('react');
const Link = require('next/link');

module.exports = function Custom404() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link href="/" style={{ 
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#0070f3',
        color: 'white',
        borderRadius: '5px',
        textDecoration: 'none'
      }}>
        Return Home
      </Link>
    </div>
  );
}

// Force server-side rendering for this page
module.exports.getStaticProps = async function() {
  return {
    props: {}, // will be passed to the page component as props
  };
} 